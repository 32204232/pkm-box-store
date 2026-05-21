package com.pkm.store.domain.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrderCreateRequest(
        @NotBlank
        @Size(max = 100)
        String receiverName,

        @NotBlank
        @Size(max = 30)
        String receiverPhone,

        @NotBlank
        @Size(max = 500)
        String address
) {
}
