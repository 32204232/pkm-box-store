package com.pkm.store.domain.payment.client;

import java.math.BigDecimal;

public record PaymentCancelCommand(
        String paymentKey,
        String cancelReason,
        BigDecimal cancelAmount
) {
}
