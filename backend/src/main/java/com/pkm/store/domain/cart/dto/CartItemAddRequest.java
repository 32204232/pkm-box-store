package com.pkm.store.domain.cart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CartItemAddRequest(
        @NotNull
        Long productId,

        @Positive
        int quantity
) {
}
