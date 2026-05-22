package com.pkm.store.domain.deliveryaddress.dto;

import jakarta.validation.constraints.NotBlank;

public record DeliveryAddressCreateRequest(
        String label,

        @NotBlank
        String receiverName,

        @NotBlank
        String receiverPhone,

        @NotBlank
        String zipCode,

        @NotBlank
        String address1,

        String address2,

        Boolean isDefault
) {
}
