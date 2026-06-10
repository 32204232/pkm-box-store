package com.pkm.store.domain.catalog.service;

import com.pkm.store.domain.catalog.category.entity.Category;
import com.pkm.store.domain.catalog.category.repository.CategoryRepository;
import com.pkm.store.domain.catalog.producttype.entity.ProductType;
import com.pkm.store.domain.catalog.producttype.repository.ProductTypeRepository;
import com.pkm.store.domain.catalog.series.entity.Series;
import com.pkm.store.domain.catalog.series.repository.SeriesRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogValidationService {

    private final CategoryRepository categoryRepository;
    private final ProductTypeRepository productTypeRepository;
    private final SeriesRepository seriesRepository;

    public Category resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    public ProductType resolveProductType(Long productTypeId) {
        if (productTypeId == null) {
            return null;
        }
        return productTypeRepository.findById(productTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_TYPE_NOT_FOUND));
    }

    public Series resolveSeries(Long seriesId) {
        if (seriesId == null) {
            return null;
        }
        return seriesRepository.findById(seriesId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SERIES_NOT_FOUND));
    }

    public Category resolveCategoryForProduct(Category category, ProductType productType) {
        if (category == null && productType != null) {
            return productType.getCategory();
        }
        validateProductTypeCategory(category, productType);
        return category;
    }

    private void validateProductTypeCategory(Category category, ProductType productType) {
        if (category == null || productType == null) {
            return;
        }
        if (!productType.getCategory().getId().equals(category.getId())) {
            throw new BusinessException(ErrorCode.PRODUCT_TYPE_CATEGORY_MISMATCH);
        }
    }
}
