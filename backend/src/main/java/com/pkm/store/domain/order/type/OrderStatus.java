package com.pkm.store.domain.order.type;

public enum OrderStatus {
    PAYMENT_PENDING,
    PAID,
    PREPARING,
    SHIPPED,
    DELIVERED,
    CANCELED,
    FAILED,
    EXPIRED
}
