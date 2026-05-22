package com.pkm.store.domain.product.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import com.pkm.store.domain.product.dto.ProductResponse;
import com.pkm.store.domain.product.dto.ProductSearchCondition;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.service.ProductService;
import com.pkm.store.domain.product.type.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import(ProductService.class)
class ProductRepositorySearchTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @MockBean
    private AdminAuditLogService adminAuditLogService;

    @Test
    void searchProductsByKeywordInName() {
        productRepository.save(product("피카츄 박스", "인기 카드", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("이브이 박스", "컬렉션 카드", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition("피카츄", null, null, null, false, "latest"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("피카츄 박스");
    }

    @Test
    void filterProductsByCategory() {
        productRepository.save(product("부스터 상품", "설명", "부스터 박스", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("스타터 상품", "설명", "스타터 덱", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, "부스터 박스", null, null, false, "latest"));

        assertThat(responses).extracting(ProductResponse::category).containsExactly("부스터 박스");
    }

    @Test
    void filterProductsBySeries() {
        productRepository.save(product("스칼렛 상품", "설명", "부스터", "스칼렛&바이올렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("소드 상품", "설명", "부스터", "소드&실드", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, "소드&실드", null, false, "latest"));

        assertThat(responses).extracting(ProductResponse::series).containsExactly("소드&실드");
    }

    @Test
    void filterProductsByStatus() {
        productRepository.save(product("판매 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("예정 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.COMING_SOON, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, ProductStatus.COMING_SOON, false, "latest"));

        assertThat(responses).extracting(ProductResponse::status).containsExactly(ProductStatus.COMING_SOON);
    }

    @Test
    void filterProductsByInStockOnly() {
        productRepository.save(product("재고 있음", "설명", "부스터", "스칼렛", 30000, 1, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("재고 없음", "설명", "부스터", "스칼렛", 30000, 0, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, null, true, "latest"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("재고 있음");
    }

    @Test
    void searchProductsExcludesHiddenProducts() {
        productRepository.save(product("노출 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("숨김 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.HIDDEN, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, null, false, "latest"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("노출 상품");
    }

    @Test
    void sortProductsByPriceAsc() {
        productRepository.save(product("비싼 상품", "설명", "부스터", "스칼렛", 50000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("저렴한 상품", "설명", "부스터", "스칼렛", 10000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, null, false, "priceAsc"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("저렴한 상품", "비싼 상품");
    }

    @Test
    void sortProductsByPriceDesc() {
        productRepository.save(product("저렴한 상품", "설명", "부스터", "스칼렛", 10000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));
        productRepository.save(product("비싼 상품", "설명", "부스터", "스칼렛", 50000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, null, false, "priceDesc"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("비싼 상품", "저렴한 상품");
    }

    @Test
    void sortProductsByReleaseDateDesc() {
        productRepository.save(product("이전 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2025, 1, 1)));
        productRepository.save(product("최신 상품", "설명", "부스터", "스칼렛", 30000, 10, ProductStatus.ON_SALE, LocalDate.of(2026, 1, 1)));

        List<ProductResponse> responses = productService.getProducts(condition(null, null, null, null, false, "releaseDateDesc"));

        assertThat(responses).extracting(ProductResponse::name).containsExactly("최신 상품", "이전 상품");
    }

    private ProductSearchCondition condition(
            String keyword,
            String category,
            String series,
            ProductStatus status,
            boolean inStockOnly,
            String sort
    ) {
        return new ProductSearchCondition(keyword, category, series, status, inStockOnly, sort);
    }

    private Product product(
            String name,
            String description,
            String category,
            String series,
            int price,
            int stockQuantity,
            ProductStatus status,
            LocalDate releaseDate
    ) {
        return Product.create(
                name,
                description,
                BigDecimal.valueOf(price),
                category,
                series,
                releaseDate,
                stockQuantity,
                null,
                status
        );
    }
}
