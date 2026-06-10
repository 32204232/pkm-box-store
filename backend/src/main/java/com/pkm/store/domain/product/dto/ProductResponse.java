package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductLanguage;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        BigDecimal retailPrice,
        String category,
        String series,
        Long categoryId,
        String categoryName,
        Long productTypeId,
        String productTypeName,
        Long seriesId,
        String seriesName,
        ProductLanguage language,
        LocalDate releaseDate,
        int stockQuantity,
        String imageUrl,
        ProductStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public ProductResponse(
            Long id,
            String name,
            String description,
            BigDecimal price,
            String category,
            String series,
            LocalDate releaseDate,
            int stockQuantity,
            String imageUrl,
            ProductStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this(
                id,
                name,
                description,
                price,
                null,
                category,
                series,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                releaseDate,
                stockQuantity,
                imageUrl,
                status,
                createdAt,
                updatedAt
        );
    }

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getRetailPrice(),
                product.getCategory(),
                product.getSeries(),
                product.getCategoryMaster() == null ? null : product.getCategoryMaster().getId(),
                product.getCategoryMaster() == null ? null : product.getCategoryMaster().getName(),
                product.getProductType() == null ? null : product.getProductType().getId(),
                product.getProductType() == null ? null : product.getProductType().getName(),
                product.getSeriesMaster() == null ? null : product.getSeriesMaster().getId(),
                product.getSeriesMaster() == null ? null : product.getSeriesMaster().getName(),
                product.getLanguage(),
                product.getReleaseDate(),
                product.getStockQuantity(),
                product.getImageUrl(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
