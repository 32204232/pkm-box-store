package com.pkm.store.domain.payment.client;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentApproveResponse(
        String paymentKey,
        String providerOrderId,
        BigDecimal amount,
        LocalDateTime approvedAt
) {
}
