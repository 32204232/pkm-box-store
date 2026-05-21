"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Order } from "@/types/api";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setMessage("올바르지 않은 주문번호입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    api
      .order(orderId)
      .then(setOrder)
      .catch((error) => setMessage(error instanceof Error ? error.message : "주문 정보를 조회하지 못했습니다."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>주문 상세</h1>
            <p>주문 상품과 배송 정보를 확인할 수 있습니다.</p>
          </div>
          <Link className="button" href="/orders">
            주문 목록
          </Link>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">주문 정보를 불러오고 있습니다.</div>
        ) : !order ? (
          <div className="alert">표시할 주문 정보가 없습니다.</div>
        ) : (
          <div className="stack">
            <div className="card">
              <div className="card-body stack">
                <div className="row">
                  <span className="muted">주문번호</span>
                  <strong>{order.orderUid}</strong>
                </div>
                <div className="row">
                  <span className="muted">주문 상태</span>
                  <StatusBadge value={order.status} />
                </div>
                <div className="row">
                  <span className="muted">총 금액</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>
                <div className="row">
                  <span className="muted">만료 시간</span>
                  <strong>{formatDateTime(order.expiresAt)}</strong>
                </div>
                <div className="row">
                  <span className="muted">생성 시간</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="row">
                  <span className="muted">수정 시간</span>
                  <span>{formatDateTime(order.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>단가</th>
                    <th>수량</th>
                    <th>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productNameSnapshot}</td>
                      <td>{formatPrice(item.orderPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-body stack">
                <strong>배송 정보</strong>
                <div className="row">
                  <span className="muted">수령인</span>
                  <span>{order.receiverName}</span>
                </div>
                <div className="row">
                  <span className="muted">연락처</span>
                  <span>{order.receiverPhone}</span>
                </div>
                <div className="row">
                  <span className="muted">주소</span>
                  <span>{order.address}</span>
                </div>
              </div>
            </div>

            {order.status === "PAYMENT_PENDING" && (
              <div className="action-group">
                <Link className="button primary" href={`/orders/${order.id}/payment`}>
                  결제하러 가기
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
