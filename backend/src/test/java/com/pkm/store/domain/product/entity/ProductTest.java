package com.pkm.store.domain.product.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ProductTest {

    @Test
    void createThrowsExceptionWhenPriceIsNegative() {
        assertThatThrownBy(() -> createProduct(BigDecimal.valueOf(-1), 10))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createThrowsExceptionWhenStockQuantityIsNegative() {
        assertThatThrownBy(() -> createProduct(BigDecimal.valueOf(10000), -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void hideChangesStatusToHidden() {
        Product product = createProduct(BigDecimal.valueOf(10000), 10);

        product.hide();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.HIDDEN);
    }

    @Test
    void updateChangesCategorySeriesAndReleaseDate() {
        Product product = createProduct(BigDecimal.valueOf(10000), 10);
        LocalDate releaseDate = LocalDate.of(2026, 5, 21);

        product.update(
                null,
                null,
                null,
                "스페셜 박스",
                "스칼렛&바이올렛",
                releaseDate,
                null,
                null,
                null
        );

        assertThat(product.getCategory()).isEqualTo("스페셜 박스");
        assertThat(product.getSeries()).isEqualTo("스칼렛&바이올렛");
        assertThat(product.getReleaseDate()).isEqualTo(releaseDate);
    }

    @Test
    void updateClearsReleaseDateAndImageUrlWhenNullIsPassed() {
        Product product = createProduct(BigDecimal.valueOf(10000), 10);

        product.update(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThat(product.getReleaseDate()).isNull();
        assertThat(product.getImageUrl()).isNull();
    }

    @Test
    void validatePurchasableSucceedsWhenProductIsOnSaleAndStockIsEnough() {
        Product product = createProduct(BigDecimal.valueOf(10000), 10);

        product.validatePurchasable(2);
    }

    @Test
    void validatePurchasableThrowsWhenProductIsNotOnSale() {
        Product product = createProduct(ProductStatus.COMING_SOON, 10);

        assertThatThrownBy(() -> product.validatePurchasable(1))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_NOT_PURCHASABLE);
    }

    @Test
    void validatePurchasableThrowsWhenStockIsNotEnough() {
        Product product = createProduct(BigDecimal.valueOf(10000), 1);

        assertThatThrownBy(() -> product.validatePurchasable(2))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
    }

    private Product createProduct(BigDecimal price, int stockQuantity) {
        return createProduct(ProductStatus.ON_SALE, price, stockQuantity);
    }

    private Product createProduct(ProductStatus status, int stockQuantity) {
        return createProduct(status, BigDecimal.valueOf(10000), stockQuantity);
    }

    private Product createProduct(ProductStatus status, BigDecimal price, int stockQuantity) {
        return Product.create(
                "포켓몬 카드 박스",
                "한국어판 포켓몬 카드 박스",
                price,
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                stockQuantity,
                "https://example.com/product.jpg",
                status
        );
    }
}
