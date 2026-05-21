package com.pkm.store.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentCancelRequest(
        @NotNull
        Long orderId,

        @NotBlank
        String cancelReason
) {
}
