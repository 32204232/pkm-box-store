package com.pkm.store.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;

@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 100)
    private String series;

    private LocalDate releaseDate;

    @Column(nullable = false)
    private int stockQuantity;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Product(
            String name,
            String description,
            BigDecimal price,
            String category,
            String series,
            LocalDate releaseDate,
            int stockQuantity,
            String imageUrl,
            ProductStatus status
    ) {
        validatePrice(price);
        validateStockQuantity(stockQuantity);
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.series = series;
        this.releaseDate = releaseDate;
        this.stockQuantity = stockQuantity;
        this.imageUrl = imageUrl;
        this.status = status == null ? ProductStatus.ON_SALE : status;
    }

    public static Product create(
            String name,
            String description,
            BigDecimal price,
            String category,
            String series,
            LocalDate releaseDate,
            int stockQuantity,
            String imageUrl,
            ProductStatus status
    ) {
        return new Product(name, description, price, category, series, releaseDate, stockQuantity, imageUrl, status);
    }

    public void update(
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
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (price != null) {
            validatePrice(price);
            this.price = price;
        }
        if (category != null) {
            this.category = category;
        }
        if (series != null) {
            this.series = series;
        }
        this.releaseDate = releaseDate;
        if (stockQuantity != null) {
            validateStockQuantity(stockQuantity);
            this.stockQuantity = stockQuantity;
        }
        this.imageUrl = imageUrl;
        if (status != null) {
            this.status = status;
        }
    }

    public void hide() {
        this.status = ProductStatus.HIDDEN;
    }

    public void validatePurchasable(int quantity) {
        validateStockChangeQuantity(quantity);
        if (status != ProductStatus.ON_SALE) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        }
        if (stockQuantity < quantity) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
    }

    public void decreaseStock(int quantity) {
        validateStockChangeQuantity(quantity);
        if (stockQuantity < quantity) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
        this.stockQuantity -= quantity;
    }

    public void increaseStock(int quantity) {
        validateStockChangeQuantity(quantity);
        this.stockQuantity += quantity;
    }

    private static void validatePrice(BigDecimal price) {
        if (price == null || price.signum() < 0) {
            throw new IllegalArgumentException("상품 가격은 0 이상이어야 합니다.");
        }
    }

    private static void validateStockQuantity(Integer stockQuantity) {
        if (stockQuantity == null || stockQuantity < 0) {
            throw new IllegalArgumentException("상품 재고는 0 이상이어야 합니다.");
        }
    }

    private static void validateStockChangeQuantity(int quantity) {
        if (quantity < 1) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
