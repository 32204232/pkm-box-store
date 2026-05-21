"use client";

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

  async function loadOrders() {
    try {
      setOrders(await api.adminOrders());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "주문 조회 실패");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId: number, status: OrderStatus) {
    setMessage(null);
    try {
      await api.updateAdminOrderStatus(orderId, status);
      await loadOrders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상태 변경 실패");
    }
  }

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <h1>관리자 주문 관리</h1>
        </div>
        <Message message={message} />
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
                  <td>{order.orderUid}</td>
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
      </div>
    </RequireAuth>
  );
}
