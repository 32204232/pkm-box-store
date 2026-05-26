"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { PaymentResponse } from "@/types/api";

const confirmRequests = new Map<string, Promise<PaymentResponse>>();
const TOSS_ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [providerOrderId, setProviderOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(true);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const providerOrderIdParam = searchParams.get("orderId");
    const internalOrderIdParam = searchParams.get("internalOrderId");
    const amountParam = searchParams.get("amount");
    const internalOrderId = Number(internalOrderIdParam);
    const amount = Number(amountParam);

    if (
      !paymentKey ||
      !providerOrderIdParam ||
      !TOSS_ORDER_ID_PATTERN.test(providerOrderIdParam) ||
      !Number.isInteger(internalOrderId) ||
      internalOrderId <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage("결제 승인에 필요한 정보가 올바르지 않습니다.");
      setConfirming(false);
      return;
    }

    const confirmedPaymentKey = paymentKey;
    const confirmedProviderOrderId = providerOrderIdParam;
    setProviderOrderId(confirmedProviderOrderId);

    const requestKey = `${internalOrderId}:${confirmedProviderOrderId}:${confirmedPaymentKey}:${amount}`;
    const confirmRequest =
      confirmRequests.get(requestKey) ??
      (async () => {
        const order = await api.order(internalOrderId);
        if (order.orderUid !== confirmedProviderOrderId) {
          throw new Error("주문번호가 일치하지 않습니다.");
        }
        return api.confirmPayment({
          orderId: internalOrderId,
          provider: "TOSS",
          paymentKey: confirmedPaymentKey,
          providerOrderId: confirmedProviderOrderId,
          amount
        });
      })();

    confirmRequests.set(requestKey, confirmRequest);

    async function confirmPayment() {
      try {
        const response = await confirmRequest;
        setPayment(response);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "결제 승인에 실패했습니다.");
      } finally {
        setConfirming(false);
      }
    }

    confirmPayment();
  }, [searchParams]);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>결제 완료</h1>
            <p>결제 승인 결과를 확인해 주세요.</p>
          </div>
        </div>

        <Message message={message} />

        {confirming ? (
          <div className="alert">결제를 승인하고 있습니다.</div>
        ) : payment ? (
          <div className="payment-result-card payment-result-success">
            <div className="payment-result-icon">완료</div>
            <div className="payment-result-content">
              <h2>주문 결제가 완료되었습니다.</h2>
              <p>주문 상세에서 결제 내역과 배송 진행 상태를 확인할 수 있습니다.</p>

              <div className="payment-result-details">
                <div className="row">
                  <span className="muted">주문번호</span>
                  <strong>{providerOrderId ?? payment.orderId}</strong>
                </div>
                <div className="row">
                  <span className="muted">결제 상태</span>
                  <strong>{payment.status}</strong>
                </div>
                <div className="row payment-result-total">
                  <span className="muted">결제 금액</span>
                  <strong>{formatPrice(payment.amount)}</strong>
                </div>
              </div>

              <div className="payment-result-actions">
                <Link className="button primary payment-result-primary" href={`/orders/${payment.orderId}`}>
                  주문 상세 보기
                </Link>
                <Link className="button" href="/mypage/orders">
                  주문 목록으로 이동
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="payment-result-card">
            <div className="payment-result-content">
              <h2>결제 승인 결과를 확인하지 못했습니다.</h2>
              <p>주문 목록에서 주문 상태를 확인해 주세요.</p>
              <div className="payment-result-actions">
                <Link className="button primary payment-result-primary" href="/mypage/orders">
                  주문 목록으로 이동
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
