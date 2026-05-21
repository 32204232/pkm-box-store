package com.pkm.store.domain.payment.dto;

import com.pkm.store.domain.payment.type.PaymentProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record PaymentConfirmRequest(
        @NotNull
        Long orderId,

        @NotNull
        PaymentProvider provider,

        @NotBlank
        String paymentKey,

        @NotBlank
        String providerOrderId,

        @NotNull
        @PositiveOrZero
        BigDecimal amount
) {
}
