"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";

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

    async function failPayment() {
      try {
        if (Number.isInteger(orderId) && orderId > 0) {
          await api.failPayment(orderId);
        }
        setMessage(tossMessage ? decodeURIComponent(tossMessage) : "결제가 실패했거나 취소되었습니다.");
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
