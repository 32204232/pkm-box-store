"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";

const failRequests = new Map<string, Promise<string>>();
const TOSS_ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function PaymentFailContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    const internalOrderIdParam = searchParams.get("internalOrderId");
    const providerOrderId = searchParams.get("orderId");
    const internalOrderId = Number(internalOrderIdParam);
    const tossMessage = searchParams.get("message");
    const hasValidProviderOrderId = providerOrderId ? TOSS_ORDER_ID_PATTERN.test(providerOrderId) : true;

    const requestKey =
      Number.isInteger(internalOrderId) && internalOrderId > 0
        ? `${internalOrderId}:${providerOrderId ?? ""}`
        : `no-order:${providerOrderId ?? ""}:${tossMessage ?? ""}`;
    const failRequest =
      failRequests.get(requestKey) ??
      (async () => {
        if (!hasValidProviderOrderId) {
          return "Toss Payments 주문번호 형식이 올바르지 않습니다.";
        }
        if (Number.isInteger(internalOrderId) && internalOrderId > 0) {
          await api.failPayment(internalOrderId);
        }
        return tossMessage || "결제가 실패했거나 취소되었습니다.";
      })();

    failRequests.set(requestKey, failRequest);

    async function failPayment() {
      try {
        setMessage(await failRequest);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "결제 실패 처리에 실패했습니다.");
      } finally {
        setProcessing(false);
      }
    }

    failPayment();
  }, [searchParams]);

  return (
    <RequireAuth>
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>결제 실패</h1>
            <p>결제가 완료되지 않았습니다.</p>
          </div>
        </div>

        <Message message={processing ? "결제 실패 정보를 처리하고 있습니다." : message} />

        {!processing && (
          <div className="payment-result-card payment-result-fail">
            <div className="payment-result-icon">실패</div>
            <div className="payment-result-content">
              <h2>결제가 완료되지 않았습니다.</h2>
              <p>주문 상태를 확인하거나 상품 목록으로 돌아가 다시 주문할 수 있습니다.</p>

              {message && (
                <div className="payment-result-details">
                  <div>
                    <span className="muted">실패 사유</span>
                    <strong>{message}</strong>
                  </div>
                </div>
              )}

              <div className="payment-result-actions">
                <Link className="button primary payment-result-primary" href="/orders">
                  주문 목록으로 이동
                </Link>
                <Link className="button" href="/">
                  상품 목록으로 이동
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
