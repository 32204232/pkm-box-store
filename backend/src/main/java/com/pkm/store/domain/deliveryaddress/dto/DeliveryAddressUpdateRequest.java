package com.pkm.store.domain.deliveryaddress.dto;

public record DeliveryAddressUpdateRequest(
        String label,
        String receiverName,
        String receiverPhone,
        String zipCode,
        String address1,
        String address2,
        Boolean isDefault
) {
}
