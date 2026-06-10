package com.pkm.store.domain.product.entity;

import com.pkm.store.domain.catalog.category.entity.Category;
import com.pkm.store.domain.catalog.producttype.entity.ProductType;
import com.pkm.store.domain.catalog.series.entity.Series;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.pkm.store.domain.product.type.ProductLanguage;
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

    @Column(precision = 12, scale = 2)
    private BigDecimal retailPrice;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 100)
    private String series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category categoryMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_type_id")
    private ProductType productType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id")
    private Series seriesMaster;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ProductLanguage language;

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
            BigDecimal retailPrice,
            String category,
            String series,
            Category categoryMaster,
            ProductType productType,
            Series seriesMaster,
            ProductLanguage language,
            LocalDate releaseDate,
            int stockQuantity,
            String imageUrl,
            ProductStatus status
    ) {
        validatePrice(price);
        validateRetailPrice(retailPrice);
        validateStockQuantity(stockQuantity);
        this.name = name;
        this.description = description;
        this.price = price;
        this.retailPrice = retailPrice;
        this.category = category;
        this.series = series;
        this.categoryMaster = categoryMaster;
        this.productType = productType;
        this.seriesMaster = seriesMaster;
        this.language = language;
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
        return create(name, description, price, null, category, series, null, null, null, null, releaseDate, stockQuantity, imageUrl, status);
    }

    public static Product create(
            String name,
            String description,
            BigDecimal price,
            BigDecimal retailPrice,
            String category,
            String series,
            Category categoryMaster,
            ProductType productType,
            Series seriesMaster,
            ProductLanguage language,
            LocalDate releaseDate,
            int stockQuantity,
            String imageUrl,
            ProductStatus status
    ) {
        return new Product(
                name,
                description,
                price,
                retailPrice,
                category,
                series,
                categoryMaster,
                productType,
                seriesMaster,
                language,
                releaseDate,
                stockQuantity,
                imageUrl,
                status
        );
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
        update(name, description, price, null, category, series, null, null, null, null, releaseDate, stockQuantity, imageUrl, status);
    }

    public void update(
            String name,
            String description,
            BigDecimal price,
            BigDecimal retailPrice,
            String category,
            String series,
            Category categoryMaster,
            ProductType productType,
            Series seriesMaster,
            ProductLanguage language,
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
        if (retailPrice != null) {
            validateRetailPrice(retailPrice);
        }
        this.retailPrice = retailPrice;
        if (category != null) {
            this.category = category;
        }
        if (series != null) {
            this.series = series;
        }
        if (categoryMaster != null) {
            this.categoryMaster = categoryMaster;
        }
        if (productType != null) {
            this.productType = productType;
        }
        if (seriesMaster != null) {
            this.seriesMaster = seriesMaster;
        }
        if (language != null) {
            this.language = language;
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

    private static void validateRetailPrice(BigDecimal retailPrice) {
        if (retailPrice != null && retailPrice.signum() < 0) {
            throw new IllegalArgumentException("상품 정가는 0 이상이어야 합니다.");
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
