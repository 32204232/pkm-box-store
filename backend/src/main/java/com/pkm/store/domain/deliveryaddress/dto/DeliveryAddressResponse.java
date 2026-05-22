package com.pkm.store.domain.deliveryaddress.dto;

import com.pkm.store.domain.deliveryaddress.entity.DeliveryAddress;
import java.time.LocalDateTime;

public record DeliveryAddressResponse(
        Long id,
        String label,
        String receiverName,
        String receiverPhone,
        String zipCode,
        String address1,
        String address2,
        boolean isDefault,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static DeliveryAddressResponse from(DeliveryAddress address) {
        return new DeliveryAddressResponse(
                address.getId(),
                address.getLabel(),
                address.getReceiverName(),
                address.getReceiverPhone(),
                address.getZipCode(),
                address.getAddress1(),
                address.getAddress2(),
                address.isDefault(),
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
