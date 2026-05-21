package com.pkm.store.domain.order.dto;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.type.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderUid,
        OrderStatus status,
        BigDecimal totalPrice,
        String receiverName,
        String receiverPhone,
        String address,
        LocalDateTime expiresAt,
        List<OrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderUid(),
                order.getStatus(),
                order.getTotalPrice(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getAddress(),
                order.getExpiresAt(),
                order.getOrderItems().stream().map(OrderItemResponse::from).toList(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
