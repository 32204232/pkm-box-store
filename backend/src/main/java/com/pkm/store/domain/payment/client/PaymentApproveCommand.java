package com.pkm.store.domain.payment.client;

import java.math.BigDecimal;

public record PaymentApproveCommand(
        String paymentKey,
        String providerOrderId,
        BigDecimal amount
) {
}
