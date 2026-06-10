package com.pkm.store.domain.catalog.category.dto;

import com.pkm.store.domain.catalog.category.entity.Category;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        int displayOrder,
        boolean active
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getDisplayOrder(),
                category.isActive()
        );
    }
}
