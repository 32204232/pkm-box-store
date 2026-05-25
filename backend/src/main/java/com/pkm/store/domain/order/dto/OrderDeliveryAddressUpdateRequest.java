package com.pkm.store.domain.order.dto;

import jakarta.validation.constraints.Size;

public record OrderDeliveryAddressUpdateRequest(
        Long deliveryAddressId,

        @Size(max = 100)
        String receiverName,

        @Size(max = 30)
        String receiverPhone,

        @Size(max = 20)
        String zipCode,

        @Size(max = 255)
        String address1,

        @Size(max = 255)
        String address2
) {
}
