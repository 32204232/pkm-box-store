package com.pkm.store.domain.order.dto;

import com.pkm.store.domain.order.type.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record AdminOrderStatusUpdateRequest(
        @NotNull
        OrderStatus status,

        String courierCompany,

        String trackingNumber
) {

    public AdminOrderStatusUpdateRequest(OrderStatus status) {
        this(status, null, null);
    }
}
