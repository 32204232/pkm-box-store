package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.type.ProductStatus;

public record AdminProductSearchCondition(
        String keyword,
        String category,
        String series,
        ProductStatus status,
        boolean lowStockOnly
) {

    public AdminProductSearchCondition {
        keyword = blankToNull(keyword);
        category = blankToNull(category);
        series = blankToNull(series);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
