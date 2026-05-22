package com.pkm.store.domain.dashboard.dto;

import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;

public record AdminDashboardProductResponse(
        Long id,
        String name,
        BigDecimal price,
        String category,
        String series,
        int stockQuantity,
        ProductStatus status
) {

    public static AdminDashboardProductResponse from(Product product) {
        return new AdminDashboardProductResponse(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getCategory(),
                product.getSeries(),
                product.getStockQuantity(),
                product.getStatus()
        );
    }
}
