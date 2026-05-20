package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.type.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductCreateRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @NotBlank
        String description,

        @NotNull
        @PositiveOrZero
        BigDecimal price,

        @NotBlank
        @Size(max = 50)
        String category,

        @NotBlank
        @Size(max = 100)
        String series,

        LocalDate releaseDate,

        @NotNull
        @PositiveOrZero
        Integer stockQuantity,

        @Size(max = 500)
        String imageUrl,

        ProductStatus status
) {
}
