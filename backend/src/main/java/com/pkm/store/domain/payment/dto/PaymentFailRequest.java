package com.pkm.store.domain.payment.dto;

import jakarta.validation.constraints.NotNull;

public record PaymentFailRequest(
        @NotNull
        Long orderId
) {
}
