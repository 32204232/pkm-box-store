"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, formatPrice } from "@/lib/api";
import type { Order } from "@/types/api";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getOrderName(order: Order) {
  const [firstItem] = order.items;
  const firstName = firstItem?.productNameSnapshot ?? "주문 상품";
  const otherCount = order.items.length - 1;

  return otherCount > 0 ? `${firstName} 외 ${otherCount}개` : firstName;
}

export default function OrderPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);

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

  async function startPayment() {
    if (!order || paying || canceling) {
      return;
    }

    if (!TOSS_CLIENT_KEY) {
      setMessage("Toss Payments 클라이언트 키가 설정되지 않았습니다.");
      return;
    }

    setPaying(true);
    setMessage("Toss Payments 결제창을 여는 중입니다.");

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: order.totalPrice
        },
        orderId: String(order.id),
        orderName: getOrderName(order),
        customerName: order.receiverName,
        successUrl: `${window.location.origin}/payments/success?orderId=${order.id}`,
        failUrl: `${window.location.origin}/payments/fail?orderId=${order.id}`,
        card: {
          flowMode: "DEFAULT",
          useEscrow: false,
          useCardPoint: false,
          useAppCardOnly: false
        }
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제창 호출에 실패했습니다.");
      setPaying(false);
    }
  }

  async function cancelPayment() {
    if (!order || paying || canceling) {
      return;
    }

    setCanceling(true);
    setMessage(null);
    try {
      await api.failPayment(order.id);
      router.push("/orders");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제 취소에 실패했습니다.");
      setCanceling(false);
    }
  }

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>결제 대기</h1>
            <p>주문 정보를 확인한 뒤 결제를 진행해 주세요.</p>
          </div>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">주문 정보를 불러오고 있습니다.</div>
        ) : !order ? (
          <div className="alert">표시할 주문 정보가 없습니다.</div>
        ) : (
          <div className="payment-layout">
            <section className="payment-main">
              <div className="card">
                <div className="card-body stack">
                  <div className="payment-card-header">
                    <div>
                      <strong>주문 상품</strong>
                      <p>결제할 상품과 수량을 최종 확인해 주세요.</p>
                    </div>
                    <span className="badge">{order.items.length}개 상품</span>
                  </div>
                  <div className="table-wrap payment-table-wrap">
                    <table className="table payment-table">
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

              <div className="card">
                <div className="card-body stack">
                  <div className="payment-card-header">
                    <div>
                      <strong>배송 정보</strong>
                      <p>결제 후 아래 주소로 상품이 발송됩니다.</p>
                    </div>
                  </div>
                  <div className="payment-delivery-card">
                    <div>
                      <span className="muted">수령인</span>
                      <strong>{order.receiverName}</strong>
                    </div>
                    <div>
                      <span className="muted">연락처</span>
                      <strong>{order.receiverPhone}</strong>
                    </div>
                    <div className="payment-delivery-address">
                      <span className="muted">주소</span>
                      <strong>{order.address}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="card payment-summary">
              <div className="card-body stack">
                <div className="payment-summary-header">
                  <div>
                    <strong>결제 확인</strong>
                    <p>주문번호 {order.orderUid}</p>
                  </div>
                  <StatusBadge value={order.status} />
                </div>

                <div className="payment-total-box">
                  <span>총 결제 금액</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>

                <div className="payment-meta-list">
                  <div className="row">
                    <span className="muted">주문 상태</span>
                    <StatusBadge value={order.status} />
                  </div>
                  <div className="row">
                    <span className="muted">만료 시간</span>
                    <strong>{formatDateTime(order.expiresAt)}</strong>
                  </div>
                </div>

                {order.status === "PAYMENT_PENDING" && (
                  <div className="payment-actions">
                    <button
                      className="button primary payment-primary-button"
                      type="button"
                      onClick={startPayment}
                      disabled={paying || canceling}
                    >
                      {paying ? "결제창 여는 중..." : "결제하기"}
                    </button>
                    <button
                      className="button danger payment-cancel-button"
                      type="button"
                      onClick={cancelPayment}
                      disabled={paying || canceling}
                    >
                      {canceling ? "취소 처리 중..." : "결제 취소"}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
