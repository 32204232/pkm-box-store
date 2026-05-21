package com.pkm.store.domain.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        List<CartItemResponse> items,
        int totalQuantity,
        BigDecimal totalPrice
) {

    public static CartResponse from(List<CartItemResponse> items) {
        int totalQuantity = items.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();
        BigDecimal totalPrice = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(items, totalQuantity, totalPrice);
    }
}
