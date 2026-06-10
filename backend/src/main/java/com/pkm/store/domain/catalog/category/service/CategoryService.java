package com.pkm.store.domain.catalog.category.service;

import com.pkm.store.domain.catalog.category.dto.CategoryCreateRequest;
import com.pkm.store.domain.catalog.category.dto.CategoryResponse;
import com.pkm.store.domain.catalog.category.dto.CategoryUpdateRequest;
import com.pkm.store.domain.catalog.category.entity.Category;
import com.pkm.store.domain.catalog.category.repository.CategoryRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public List<CategoryResponse> getAdminCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        String slug = normalizeSlug(request.slug());
        if (categoryRepository.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.DUPLICATE_CATEGORY_SLUG);
        }

        Category category = Category.create(
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        String slug = normalizeSlug(request.slug());
        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_CATEGORY_SLUG);
        }

        category.update(
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return CategoryResponse.from(category);
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
