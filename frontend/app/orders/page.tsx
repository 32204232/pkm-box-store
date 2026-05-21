"use client";

import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Order } from "@/types/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .orders()
      .then(setOrders)
      .catch((error) => setMessage(error.message));
  }, []);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <h1>내 주문</h1>
        </div>
        <Message message={message} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>상태</th>
                <th>금액</th>
                <th>수령인</th>
                <th>만료시각</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderUid}</td>
                  <td>
                    <StatusBadge value={order.status} />
                  </td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td>{order.receiverName}</td>
                  <td>{order.expiresAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
}
