package com.pkm.store.domain.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.product.dto.ProductCreateRequest;
import com.pkm.store.domain.product.dto.ProductResponse;
import com.pkm.store.domain.product.dto.ProductSearchCondition;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void createProductSucceeds() {
        ProductCreateRequest request = new ProductCreateRequest(
                "포켓몬 카드 박스",
                "한국어판 포켓몬 카드 박스",
                BigDecimal.valueOf(30000),
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                20,
                "https://example.com/product.jpg",
                ProductStatus.ON_SALE
        );
        given(productRepository.save(any(Product.class))).willAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.createProduct(request);

        assertThat(response.name()).isEqualTo("포켓몬 카드 박스");
        assertThat(response.price()).isEqualByComparingTo("30000");
        assertThat(response.category()).isEqualTo("부스터 박스");
        assertThat(response.series()).isEqualTo("스칼렛&바이올렛");
        assertThat(response.releaseDate()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(response.stockQuantity()).isEqualTo(20);
        assertThat(response.status()).isEqualTo(ProductStatus.ON_SALE);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void getProductsExcludesHiddenProducts() {
        Product product = createProduct("판매 상품", ProductStatus.ON_SALE);
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        given(productRepository.searchProducts(null, null, null, null, false, ProductStatus.HIDDEN, sort))
                .willReturn(List.of(product));

        List<ProductResponse> responses = productService.getProducts(
                new ProductSearchCondition(null, null, null, null, false, "latest")
        );

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).name()).isEqualTo("판매 상품");
        assertThat(responses.get(0).status()).isNotEqualTo(ProductStatus.HIDDEN);
        verify(productRepository).searchProducts(null, null, null, null, false, ProductStatus.HIDDEN, sort);
    }

    @Test
    void getProductThrowsBusinessExceptionWhenProductDoesNotExist() {
        given(productRepository.findByIdAndStatusNot(999L, ProductStatus.HIDDEN))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProduct(999L))
                .isInstanceOf(BusinessException.class);
    }

    private Product createProduct(String name, ProductStatus status) {
        return Product.create(
                name,
                "한국어판 포켓몬 카드 박스",
                BigDecimal.valueOf(30000),
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                20,
                "https://example.com/product.jpg",
                status
        );
    }
}
