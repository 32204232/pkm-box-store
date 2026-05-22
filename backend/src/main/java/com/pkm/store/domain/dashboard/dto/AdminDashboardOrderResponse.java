package com.pkm.store.domain.dashboard.dto;

import com.pkm.store.domain.order.entity.Order;
import com.pkm.store.domain.order.type.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminDashboardOrderResponse(
        Long id,
        String orderUid,
        String memberEmail,
        String memberName,
        OrderStatus status,
        BigDecimal totalPrice,
        LocalDateTime createdAt
) {

    public static AdminDashboardOrderResponse from(Order order) {
        return new AdminDashboardOrderResponse(
                order.getId(),
                order.getOrderUid(),
                order.getMember().getEmail(),
                order.getMember().getName(),
                order.getStatus(),
                order.getTotalPrice(),
                order.getCreatedAt()
        );
    }
}
