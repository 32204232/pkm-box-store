package com.pkm.store.domain.cart.dto;

import jakarta.validation.constraints.Positive;

public record CartItemUpdateRequest(
        @Positive
        int quantity
) {
}
