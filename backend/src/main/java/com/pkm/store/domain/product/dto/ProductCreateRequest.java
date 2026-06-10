package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.type.ProductLanguage;
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

        @PositiveOrZero
        BigDecimal retailPrice,

        @NotBlank
        @Size(max = 50)
        String category,

        @NotBlank
        @Size(max = 100)
        String series,

        Long categoryId,

        Long productTypeId,

        Long seriesId,

        ProductLanguage language,

        LocalDate releaseDate,

        @NotNull
        @PositiveOrZero
        Integer stockQuantity,

        @Size(max = 500)
        String imageUrl,

        ProductStatus status
) {

    public ProductCreateRequest(
            String name,
            String description,
            BigDecimal price,
            String category,
            String series,
            LocalDate releaseDate,
            Integer stockQuantity,
            String imageUrl,
            ProductStatus status
    ) {
        this(name, description, price, null, category, series, null, null, null, null, releaseDate, stockQuantity, imageUrl, status);
    }
}
