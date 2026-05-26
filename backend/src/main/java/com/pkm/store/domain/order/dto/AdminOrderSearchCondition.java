package com.pkm.store.domain.order.dto;

import com.pkm.store.domain.order.type.OrderStatus;
import java.time.LocalDate;

public record AdminOrderSearchCondition(
        OrderStatus status,
        String memberEmail,
        LocalDate startDate,
        LocalDate endDate
) {
}
