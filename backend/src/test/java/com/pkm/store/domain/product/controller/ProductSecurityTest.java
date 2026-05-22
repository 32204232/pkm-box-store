package com.pkm.store.domain.product.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pkm.store.domain.product.dto.ProductCreateRequest;
import com.pkm.store.domain.product.dto.ProductResponse;
import com.pkm.store.domain.product.dto.ProductSearchCondition;
import com.pkm.store.domain.product.service.ProductService;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import com.pkm.store.global.security.CustomUserDetailsService;
import com.pkm.store.global.security.SecurityConfig;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ProductSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void getProductsIsAllowedWithoutAuthentication() throws Exception {
        given(productService.getProducts(any(ProductSearchCondition.class))).willReturn(List.of());

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    @Test
    void createProductReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 401 && status != 403) {
                        throw new AssertionError("Expected 401 or 403 but was " + status);
                    }
                });
    }

    @Test
    void createProductReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(post("/api/admin/products")
                        .with(user("member@example.com").roles("MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void createProductIsAllowedWithAdminRole() throws Exception {
        given(productService.createProduct(any(ProductCreateRequest.class))).willReturn(createResponse());

        mockMvc.perform(post("/api/admin/products")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest())))
                .andExpect(status().isCreated());
    }

    private ProductCreateRequest createRequest() {
        return new ProductCreateRequest(
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
    }

    private ProductResponse createResponse() {
        return new ProductResponse(
                1L,
                "포켓몬 카드 박스",
                "한국어판 포켓몬 카드 박스",
                BigDecimal.valueOf(30000),
                "부스터 박스",
                "스칼렛&바이올렛",
                LocalDate.of(2026, 1, 1),
                20,
                "https://example.com/product.jpg",
                ProductStatus.ON_SALE,
                null,
                null
        );
    }
}
