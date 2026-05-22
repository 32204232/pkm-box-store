"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";

const failRequests = new Map<string, Promise<string>>();

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

    const orderIdParam = searchParams.get("orderId");
    const orderId = Number(orderIdParam);
    const tossMessage = searchParams.get("message");

    const requestKey = Number.isInteger(orderId) && orderId > 0 ? String(orderId) : `no-order:${tossMessage ?? ""}`;
    const failRequest =
      failRequests.get(requestKey) ??
      (async () => {
        if (Number.isInteger(orderId) && orderId > 0) {
          await api.failPayment(orderId);
        }
        return tossMessage ? decodeURIComponent(tossMessage) : "결제가 실패했거나 취소되었습니다.";
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
