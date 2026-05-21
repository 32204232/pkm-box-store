"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { Order } from "@/types/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .orders()
      .then(setOrders)
      .catch((error) => setMessage(error instanceof Error ? error.message : "주문 목록 조회 실패"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <h1>내 주문</h1>
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
                  <th>상태</th>
                  <th>금액</th>
                  <th>수령인</th>
                  <th>만료 시간</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/orders/${order.id}`}>{order.orderUid}</Link>
                    </td>
                    <td>
                      <StatusBadge value={order.status} />
                    </td>
                    <td>{formatPrice(order.totalPrice)}</td>
                    <td>{order.receiverName}</td>
                    <td>{formatDateTime(order.expiresAt)}</td>
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
