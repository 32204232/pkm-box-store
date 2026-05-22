package com.pkm.store.domain.product.dto;

import com.pkm.store.domain.product.type.ProductStatus;

public record ProductSearchCondition(
        String keyword,
        String category,
        String series,
        ProductStatus status,
        boolean inStockOnly,
        String sort
) {

    public ProductSearchCondition {
        keyword = blankToNull(keyword);
        category = blankToNull(category);
        series = blankToNull(series);
        sort = blankToDefault(sort, "latest");
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String blankToDefault(String value, String defaultValue) {
        String normalized = blankToNull(value);
        return normalized == null ? defaultValue : normalized;
    }
}
