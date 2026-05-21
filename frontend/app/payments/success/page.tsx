import { Suspense } from "react";
import { PaymentSuccessContent } from "./success-content";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="alert">결제 승인 정보를 확인하고 있습니다.</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
