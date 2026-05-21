package com.pkm.store.domain.order.dto;

import com.pkm.store.domain.order.entity.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productNameSnapshot,
        BigDecimal orderPrice,
        int quantity,
        BigDecimal lineTotal
) {

    public static OrderItemResponse from(OrderItem orderItem) {
        return new OrderItemResponse(
                orderItem.getId(),
                orderItem.getProduct().getId(),
                orderItem.getProductNameSnapshot(),
                orderItem.getOrderPrice(),
                orderItem.getQuantity(),
                orderItem.getLineTotal()
        );
    }
}
