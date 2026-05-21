import { Suspense } from "react";
import { PaymentFailContent } from "./fail-content";

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="alert">결제 실패 정보를 확인하고 있습니다.</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}
