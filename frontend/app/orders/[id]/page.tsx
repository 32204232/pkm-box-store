"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { Order } from "@/types/api";

type OrderDeliveryTracking = Order & {
  courierCompany?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

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
          <OrderDetailContent order={order} />
        )}
      </div>
    </RequireAuth>
  );
}

function OrderDetailContent({ order }: { order: Order }) {
  const tracking = order as OrderDeliveryTracking;
  const hasTrackingInfo =
    Boolean(tracking.courierCompany) ||
    Boolean(tracking.trackingNumber) ||
    Boolean(tracking.shippedAt) ||
    Boolean(tracking.deliveredAt);
  const isDelivered = order.status === "DELIVERED";
  const isShipped = order.status === "SHIPPED";

  return (
    <div className="order-detail-layout">
      <section className="order-detail-main">
        <div className="card order-status-card">
          <div className="card-body stack">
            <div className="order-status-header">
              <div>
                <span className="muted">주문 상태</span>
                <div className="order-status-title">
                  <StatusBadge value={order.status} />
                  {isDelivered && <strong>배송이 완료되었습니다.</strong>}
                  {isShipped && !isDelivered && <strong>상품이 배송 중입니다.</strong>}
                </div>
              </div>
              {order.status === "PAYMENT_PENDING" && (
                <Link className="button primary order-payment-button" href={`/orders/${order.id}/payment`}>
                  결제하러 가기
                </Link>
              )}
            </div>

            <div className="order-summary-grid">
              <div>
                <span className="muted">주문번호</span>
                <strong>{order.orderUid}</strong>
              </div>
              <div>
                <span className="muted">생성 시간</span>
                <strong>{formatDateTime(order.createdAt)}</strong>
              </div>
              <div>
                <span className="muted">총 금액</span>
                <strong className="order-summary-price">{formatPrice(order.totalPrice)}</strong>
              </div>
              <div>
                <span className="muted">결제 만료 시간</span>
                <strong>{formatDateTime(order.expiresAt)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body stack">
            <div className="order-section-header">
              <div>
                <strong>주문 상품</strong>
                <p>{order.items.length}개 상품의 주문 내역입니다.</p>
              </div>
            </div>
            <div className="table-wrap order-items-wrap">
              <table className="table order-items-table">
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
                      <td>
                        <strong>{item.productNameSnapshot}</strong>
                      </td>
                      <td>{formatPrice(item.orderPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <strong>{formatPrice(item.lineTotal)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <aside className="order-detail-side">
        <div className="card">
          <div className="card-body stack">
            <div className="order-section-header">
              <div>
                <strong>배송 정보</strong>
                <p>주문 상품을 받을 주소입니다.</p>
              </div>
            </div>
            <div className="order-info-list">
              <div>
                <span className="muted">수령인</span>
                <strong>{order.receiverName}</strong>
              </div>
              <div>
                <span className="muted">연락처</span>
                <strong>{order.receiverPhone}</strong>
              </div>
              <div>
                <span className="muted">주소</span>
                <strong>{order.address}</strong>
              </div>
            </div>
          </div>
        </div>

        {(hasTrackingInfo || isShipped || isDelivered) && (
          <div className="card">
            <div className="card-body stack">
              <div className="order-section-header">
                <div>
                  <strong>운송장 정보</strong>
                  <p>{isDelivered ? "배송 완료된 주문입니다." : "배송 진행 정보를 확인해 주세요."}</p>
                </div>
              </div>
              <div className="order-tracking-card">
                {tracking.courierCompany && (
                  <div>
                    <span className="muted">택배사</span>
                    <strong>{tracking.courierCompany}</strong>
                  </div>
                )}
                {tracking.trackingNumber && (
                  <div>
                    <span className="muted">운송장 번호</span>
                    <strong>{tracking.trackingNumber}</strong>
                  </div>
                )}
                {tracking.shippedAt && (
                  <div>
                    <span className="muted">발송 시간</span>
                    <strong>{formatDateTime(tracking.shippedAt)}</strong>
                  </div>
                )}
                {tracking.deliveredAt && (
                  <div>
                    <span className="muted">배송 완료 시간</span>
                    <strong>{formatDateTime(tracking.deliveredAt)}</strong>
                  </div>
                )}
                {!hasTrackingInfo && <strong>{isDelivered ? "배송 완료" : "배송 중"}</strong>}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
