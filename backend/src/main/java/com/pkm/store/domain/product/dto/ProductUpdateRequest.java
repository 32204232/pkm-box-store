package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.type.ProductStatus;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductUpdateRequest(
        @Size(max = 120)
        String name,

        String description,

        @PositiveOrZero
        BigDecimal price,

        @Size(max = 50)
        String category,

        @Size(max = 100)
        String series,

        LocalDate releaseDate,

        @PositiveOrZero
        Integer stockQuantity,

        @Size(max = 500)
        String imageUrl,

        ProductStatus status
) {
}
