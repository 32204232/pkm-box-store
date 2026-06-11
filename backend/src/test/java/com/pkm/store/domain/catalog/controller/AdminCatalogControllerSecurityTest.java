package com.pkm.store.domain.catalog.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pkm.store.domain.catalog.category.dto.CategoryCreateRequest;
import com.pkm.store.domain.catalog.category.dto.CategoryResponse;
import com.pkm.store.domain.catalog.category.service.CategoryService;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeCreateRequest;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeResponse;
import com.pkm.store.domain.catalog.producttype.service.ProductTypeService;
import com.pkm.store.domain.catalog.series.dto.SeriesCreateRequest;
import com.pkm.store.domain.catalog.series.dto.SeriesResponse;
import com.pkm.store.domain.catalog.series.service.SeriesService;
import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import com.pkm.store.global.security.CustomUserDetailsService;
import com.pkm.store.global.security.SecurityConfig;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminCatalogController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminCatalogControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private ProductTypeService productTypeService;

    @MockBean
    private SeriesService seriesService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void getAdminCategoriesReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        assertUnauthorizedOrForbidden(get("/api/admin/categories"));
    }

    @Test
    void getAdminCategoriesReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAdminCategoriesIsAllowedWithAdminRole() throws Exception {
        given(categoryService.getAdminCategories()).willReturn(List.of(createCategoryResponse()));

        mockMvc.perform(get("/api/admin/categories")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void createAdminCategoryReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        assertUnauthorizedOrForbidden(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createCategoryRequest())));
    }

    @Test
    void createAdminCategoryReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(post("/api/admin/categories")
                        .with(user("member@example.com").roles("MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createCategoryRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void createAdminCategoryIsAllowedWithAdminRole() throws Exception {
        given(categoryService.createCategory(any(CategoryCreateRequest.class))).willReturn(createCategoryResponse());

        mockMvc.perform(post("/api/admin/categories")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createCategoryRequest())))
                .andExpect(status().isCreated());
    }

    @Test
    void getAdminProductTypesRequiresAdminRole() throws Exception {
        assertUnauthorizedOrForbidden(get("/api/admin/product-types"));

        mockMvc.perform(get("/api/admin/product-types")
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());

        given(productTypeService.getAdminProductTypes()).willReturn(List.of(createProductTypeResponse()));

        mockMvc.perform(get("/api/admin/product-types")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void createAdminProductTypeRequiresAdminRole() throws Exception {
        assertUnauthorizedOrForbidden(post("/api/admin/product-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createProductTypeRequest())));

        mockMvc.perform(post("/api/admin/product-types")
                        .with(user("member@example.com").roles("MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createProductTypeRequest())))
                .andExpect(status().isForbidden());

        given(productTypeService.createProductType(any(ProductTypeCreateRequest.class)))
                .willReturn(createProductTypeResponse());

        mockMvc.perform(post("/api/admin/product-types")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createProductTypeRequest())))
                .andExpect(status().isCreated());
    }

    @Test
    void getAdminSeriesRequiresAdminRole() throws Exception {
        assertUnauthorizedOrForbidden(get("/api/admin/series"));

        mockMvc.perform(get("/api/admin/series")
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());

        given(seriesService.getAdminSeries()).willReturn(List.of(createSeriesResponse()));

        mockMvc.perform(get("/api/admin/series")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void createAdminSeriesRequiresAdminRole() throws Exception {
        assertUnauthorizedOrForbidden(post("/api/admin/series")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createSeriesRequest())));

        mockMvc.perform(post("/api/admin/series")
                        .with(user("member@example.com").roles("MEMBER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSeriesRequest())))
                .andExpect(status().isForbidden());

        given(seriesService.createSeries(any(SeriesCreateRequest.class))).willReturn(createSeriesResponse());

        mockMvc.perform(post("/api/admin/series")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSeriesRequest())))
                .andExpect(status().isCreated());
    }

    private void assertUnauthorizedOrForbidden(org.springframework.test.web.servlet.RequestBuilder requestBuilder) throws Exception {
        mockMvc.perform(requestBuilder)
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 401 && status != 403) {
                        throw new AssertionError("Expected 401 or 403 but was " + status);
                    }
                });
    }

    private CategoryCreateRequest createCategoryRequest() {
        return new CategoryCreateRequest("Sealed Product", "sealed-product", "Sealed boxes", 10, true);
    }

    private CategoryResponse createCategoryResponse() {
        return new CategoryResponse(1L, "Sealed Product", "sealed-product", "Sealed boxes", 10, true);
    }

    private ProductTypeCreateRequest createProductTypeRequest() {
        return new ProductTypeCreateRequest(1L, "Expansion Box", "expansion-box", "Expansion boxes", 10, true);
    }

    private ProductTypeResponse createProductTypeResponse() {
        return new ProductTypeResponse(1L, 1L, "Sealed Product", "Expansion Box", "expansion-box", "Expansion boxes", 10, true);
    }

    private SeriesCreateRequest createSeriesRequest() {
        return new SeriesCreateRequest("Scarlet Violet", "scarlet-violet", "Scarlet Violet series", 10, true);
    }

    private SeriesResponse createSeriesResponse() {
        return new SeriesResponse(1L, "Scarlet Violet", "scarlet-violet", "Scarlet Violet series", 10, true);
    }
}
