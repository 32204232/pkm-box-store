"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { AdminOrder, OrderStatus } from "@/types/api";

const nextStatuses: OrderStatus[] = ["PREPARING", "SHIPPED", "DELIVERED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  async function loadOrders() {
    try {
      setOrders(await api.adminOrders());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId: number, status: OrderStatus) {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage(null);
    try {
      await api.updateAdminOrderStatus(orderId, status);
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상태 변경 실패");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <h1>관리자 주문 관리</h1>
        </div>
        <Message message={message} />
        {loading ? (
          <div className="alert">주문 목록을 불러오고 있습니다.</div>
        ) : orders.length === 0 ? (
          <div className="alert">주문 내역이 없습니다.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>회원</th>
                  <th>상태</th>
                  <th>금액</th>
                  <th>배송지</th>
                  <th>상태 변경</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}>{order.orderUid}</Link>
                    </td>
                    <td>
                      {order.memberName}
                      <br />
                      <span className="muted">{order.memberEmail}</span>
                    </td>
                    <td>
                      <StatusBadge value={order.status} />
                    </td>
                    <td>{formatPrice(order.totalPrice)}</td>
                    <td>{order.address}</td>
                    <td>
                      <select
                        className="select"
                        defaultValue=""
                        disabled={updatingOrderId === order.id}
                        onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
                      >
                        <option value="" disabled>
                          선택
                        </option>
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
