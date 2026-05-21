package com.pkm.store.domain.payment.client;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentCancelResponse(
        String paymentKey,
        BigDecimal canceledAmount,
        LocalDateTime canceledAt
) {
}
