package com.pkm.store.domain.cart.dto;

import com.pkm.store.domain.cart.entity.CartItem;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String imageUrl,
        BigDecimal price,
        ProductStatus productStatus,
        int quantity,
        BigDecimal lineTotal,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static CartItemResponse from(CartItem cartItem) {
        BigDecimal price = cartItem.getProduct().getPrice();
        return new CartItemResponse(
                cartItem.getId(),
                cartItem.getProduct().getId(),
                cartItem.getProduct().getName(),
                cartItem.getProduct().getImageUrl(),
                price,
                cartItem.getProduct().getStatus(),
                cartItem.getQuantity(),
                price.multiply(BigDecimal.valueOf(cartItem.getQuantity())),
                cartItem.getCreatedAt(),
                cartItem.getUpdatedAt()
        );
    }
}
