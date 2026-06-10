package com.pkm.store.domain.catalog.producttype.dto;

import com.pkm.store.domain.catalog.producttype.entity.ProductType;

public record ProductTypeResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        String slug,
        String description,
        int displayOrder,
        boolean active
) {

    public static ProductTypeResponse from(ProductType productType) {
        return new ProductTypeResponse(
                productType.getId(),
                productType.getCategory().getId(),
                productType.getCategory().getName(),
                productType.getName(),
                productType.getSlug(),
                productType.getDescription(),
                productType.getDisplayOrder(),
                productType.isActive()
        );
    }
}
