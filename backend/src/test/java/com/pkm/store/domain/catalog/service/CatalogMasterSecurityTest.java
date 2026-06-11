package com.pkm.store.domain.catalog.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.catalog.category.dto.CategoryCreateRequest;
import com.pkm.store.domain.catalog.category.entity.Category;
import com.pkm.store.domain.catalog.category.repository.CategoryRepository;
import com.pkm.store.domain.catalog.category.service.CategoryService;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeCreateRequest;
import com.pkm.store.domain.catalog.producttype.entity.ProductType;
import com.pkm.store.domain.catalog.producttype.repository.ProductTypeRepository;
import com.pkm.store.domain.catalog.producttype.service.ProductTypeService;
import com.pkm.store.domain.catalog.series.dto.SeriesCreateRequest;
import com.pkm.store.domain.catalog.series.entity.Series;
import com.pkm.store.domain.catalog.series.repository.SeriesRepository;
import com.pkm.store.domain.catalog.series.service.SeriesService;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CatalogMasterSecurityTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductTypeRepository productTypeRepository;

    @Mock
    private SeriesRepository seriesRepository;

    private CategoryService categoryService;
    private ProductTypeService productTypeService;
    private SeriesService seriesService;
    private CatalogValidationService catalogValidationService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository);
        productTypeService = new ProductTypeService(productTypeRepository, categoryRepository);
        seriesService = new SeriesService(seriesRepository);
        catalogValidationService = new CatalogValidationService(categoryRepository, productTypeRepository, seriesRepository);
    }

    @Test
    void createCategoryThrowsWhenSlugAlreadyExists() {
        given(categoryRepository.existsBySlug("sealed-product")).willReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(createCategoryRequest("sealed-product")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_CATEGORY_SLUG);
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void createProductTypeThrowsWhenSlugAlreadyExistsInCategory() {
        Category category = createCategory(1L, true);
        given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
        given(productTypeRepository.existsByCategoryIdAndSlug(1L, "expansion-box")).willReturn(true);

        assertThatThrownBy(() -> productTypeService.createProductType(createProductTypeRequest(1L, "expansion-box")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_PRODUCT_TYPE_SLUG);
        verify(productTypeRepository, never()).save(any(ProductType.class));
    }

    @Test
    void createProductTypeThrowsWhenCategoryIsInactive() {
        Category inactiveCategory = createCategory(1L, false);
        given(categoryRepository.findById(1L)).willReturn(Optional.of(inactiveCategory));

        assertThatThrownBy(() -> productTypeService.createProductType(createProductTypeRequest(1L, "expansion-box")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CATALOG_REQUEST);
        verify(productTypeRepository, never()).save(any(ProductType.class));
    }

    @Test
    void createSeriesThrowsWhenSlugAlreadyExists() {
        given(seriesRepository.existsBySlug("scarlet-violet")).willReturn(true);

        assertThatThrownBy(() -> seriesService.createSeries(createSeriesRequest("scarlet-violet")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_SERIES_SLUG);
        verify(seriesRepository, never()).save(any(Series.class));
    }

    @Test
    void resolveCategoryForProductThrowsWhenProductTypeBelongsToDifferentCategory() {
        Category categoryA = createCategory(1L, true);
        Category categoryB = createCategory(2L, true);
        ProductType productTypeOfCategoryA = createProductType(10L, categoryA);

        assertThatThrownBy(() -> catalogValidationService.resolveCategoryForProduct(categoryB, productTypeOfCategoryA))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PRODUCT_TYPE_CATEGORY_MISMATCH);
    }

    private CategoryCreateRequest createCategoryRequest(String slug) {
        return new CategoryCreateRequest("Sealed Product", slug, "Sealed boxes", 10, true);
    }

    private ProductTypeCreateRequest createProductTypeRequest(Long categoryId, String slug) {
        return new ProductTypeCreateRequest(categoryId, "Expansion Box", slug, "Expansion boxes", 10, true);
    }

    private SeriesCreateRequest createSeriesRequest(String slug) {
        return new SeriesCreateRequest("Scarlet Violet", slug, "Scarlet Violet series", 10, true);
    }

    private Category createCategory(Long id, boolean active) {
        Category category = Category.create("Sealed Product " + id, "sealed-product-" + id, null, 10, active);
        ReflectionTestUtils.setField(category, "id", id);
        return category;
    }

    private ProductType createProductType(Long id, Category category) {
        ProductType productType = ProductType.create(category, "Expansion Box", "expansion-box", null, 10, true);
        ReflectionTestUtils.setField(productType, "id", id);
        return productType;
    }
}
