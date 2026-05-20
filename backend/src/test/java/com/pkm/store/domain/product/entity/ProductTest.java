package com.pkm.store.domain.product.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pkm.store.domain.product.type.ProductStatus;
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

    private Product createProduct(BigDecimal price, int stockQuantity) {
        return Product.create(
                "포켓몬 카드 박스",
                "한국어판 포켓몬 카드 박스",
                price,
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                stockQuantity,
                "https://example.com/product.jpg",
                ProductStatus.ON_SALE
        );
    }
}
