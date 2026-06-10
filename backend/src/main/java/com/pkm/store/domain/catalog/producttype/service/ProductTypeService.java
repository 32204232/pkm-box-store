package com.pkm.store.domain.catalog.producttype.service;

import com.pkm.store.domain.catalog.category.entity.Category;
import com.pkm.store.domain.catalog.category.repository.CategoryRepository;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeCreateRequest;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeResponse;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeUpdateRequest;
import com.pkm.store.domain.catalog.producttype.entity.ProductType;
import com.pkm.store.domain.catalog.producttype.repository.ProductTypeRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductTypeService {

    private final ProductTypeRepository productTypeRepository;
    private final CategoryRepository categoryRepository;

    public List<ProductTypeResponse> getActiveProductTypes(Long categoryId) {
        if (categoryId == null) {
            return productTypeRepository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc()
                    .stream()
                    .map(ProductTypeResponse::from)
                    .toList();
        }

        return productTypeRepository.findAllByCategoryIdAndActiveTrueOrderByDisplayOrderAscIdAsc(categoryId)
                .stream()
                .map(ProductTypeResponse::from)
                .toList();
    }

    public List<ProductTypeResponse> getAdminProductTypes() {
        return productTypeRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(ProductTypeResponse::from)
                .toList();
    }

    @Transactional
    public ProductTypeResponse createProductType(ProductTypeCreateRequest request) {
        Category category = resolveActiveCategory(request.categoryId());
        String slug = normalizeSlug(request.slug());
        if (productTypeRepository.existsByCategoryIdAndSlug(category.getId(), slug)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PRODUCT_TYPE_SLUG);
        }

        ProductType productType = ProductType.create(
                category,
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return ProductTypeResponse.from(productTypeRepository.save(productType));
    }

    @Transactional
    public ProductTypeResponse updateProductType(Long id, ProductTypeUpdateRequest request) {
        ProductType productType = productTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_TYPE_NOT_FOUND));
        Category category = resolveActiveCategory(request.categoryId());
        String slug = normalizeSlug(request.slug());
        if (productTypeRepository.existsByCategoryIdAndSlugAndIdNot(category.getId(), slug, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PRODUCT_TYPE_SLUG);
        }

        productType.update(
                category,
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return ProductTypeResponse.from(productType);
    }

    private Category resolveActiveCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        if (!category.isActive()) {
            throw new BusinessException(ErrorCode.INVALID_CATALOG_REQUEST);
        }
        return category;
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase();
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private int defaultDisplayOrder(Integer displayOrder) {
        return displayOrder == null ? 0 : displayOrder;
    }

    private boolean defaultActive(Boolean active) {
        return active == null || active;
    }
}
