"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatPrice } from "@/lib/api";
import type { PaymentResponse } from "@/types/api";

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [confirming, setConfirming] = useState(true);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderIdParam = searchParams.get("orderId");
    const amountParam = searchParams.get("amount");
    const orderId = Number(orderIdParam);
    const amount = Number(amountParam);

    if (!paymentKey || !Number.isInteger(orderId) || orderId <= 0 || !Number.isFinite(amount) || amount <= 0) {
      setMessage("결제 승인에 필요한 정보가 올바르지 않습니다.");
      setConfirming(false);
      return;
    }

    const confirmedPaymentKey = paymentKey;

    async function confirmPayment() {
      try {
        const order = await api.order(orderId);
        const response = await api.confirmPayment({
          orderId,
          provider: "TOSS",
          paymentKey: confirmedPaymentKey,
          providerOrderId: order.orderUid,
          amount
        });
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
          <div className="card">
            <div className="card-body stack">
              <strong>결제가 완료되었습니다.</strong>
              <div className="row">
                <span className="muted">주문번호</span>
                <span>{payment.orderId}</span>
              </div>
              <div className="row">
                <span className="muted">결제 상태</span>
                <span>{payment.status}</span>
              </div>
              <div className="row">
                <span className="muted">결제 금액</span>
                <strong>{formatPrice(payment.amount)}</strong>
              </div>
              <div className="action-group">
                <Link className="button primary" href="/orders">
                  주문 목록으로 이동
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="action-group">
            <Link className="button primary" href="/orders">
              주문 목록으로 이동
            </Link>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
