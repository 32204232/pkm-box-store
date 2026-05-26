"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/api";

const statusLabels: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "배송 준비",
  SHIPPED: "배송 중",
  DELIVERED: "배송 완료",
  CANCELED: "취소 완료",
  FAILED: "결제 실패",
  EXPIRED: "주문 만료"
};

function getOrderTitle(order: Order) {
  const firstItem = order.items[0]?.productNameSnapshot ?? "주문 상품";
  const otherCount = order.items.length - 1;
  return otherCount > 0 ? `${firstItem} 외 ${otherCount}개` : firstItem;
}

export function MypageOrders() {
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
    <div className="mypage-section">
      <div className="mypage-page-head">
        <div>
          <h1>주문 내역</h1>
          <p>결제 대기부터 배송 완료까지 내 주문 상태를 확인합니다.</p>
        </div>
      </div>
      <Message message={message} />
      {loading ? (
        <div className="alert">주문 목록을 불러오고 있습니다.</div>
      ) : orders.length === 0 ? (
        <div className="mypage-empty">주문 내역이 없습니다.</div>
      ) : (
        <div className="mypage-order-list">
          {orders.map((order) => (
            <article className="mypage-order-card" key={order.id}>
              <div className="mypage-order-main">
                <div className="mypage-order-date">{formatDateTime(order.createdAt)}</div>
                <Link href={`/orders/${order.id}`}>
                  <strong>{getOrderTitle(order)}</strong>
                </Link>
                <span>{order.orderUid}</span>
              </div>
              <div className="mypage-order-meta">
                <StatusBadge value={order.status} />
                <strong>{formatPrice(order.totalPrice)}</strong>
                <small>{statusLabels[order.status]}</small>
              </div>
              <div className="mypage-order-actions">
                <Link className="button" href={`/orders/${order.id}`}>
                  상세 보기
                </Link>
                {order.status === "PAYMENT_PENDING" && (
                  <Link className="button primary" href={`/orders/${order.id}/payment`}>
                    결제하기
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
