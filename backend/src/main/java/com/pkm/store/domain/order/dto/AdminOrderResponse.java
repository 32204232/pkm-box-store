package com.pkm.store.domain.order.dto;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.type.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminOrderResponse(
        Long id,
        String orderUid,
        Long memberId,
        String memberEmail,
        String memberName,
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

    public static AdminOrderResponse from(Order order) {
        return new AdminOrderResponse(
                order.getId(),
                order.getOrderUid(),
                order.getMember().getId(),
                order.getMember().getEmail(),
                order.getMember().getName(),
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
