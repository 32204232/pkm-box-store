package com.pkm.store.domain.order.dto;

import jakarta.validation.constraints.Size;

public record OrderCreateRequest(
        @Size(max = 100)
        String receiverName,

        @Size(max = 30)
        String receiverPhone,

        @Size(max = 500)
        String address,

        Long deliveryAddressId
) {
}
