package com.pkm.store.domain.catalog.controller;

import com.pkm.store.domain.catalog.category.dto.CategoryCreateRequest;
import com.pkm.store.domain.catalog.category.dto.CategoryResponse;
import com.pkm.store.domain.catalog.category.dto.CategoryUpdateRequest;
import com.pkm.store.domain.catalog.category.service.CategoryService;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeCreateRequest;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeResponse;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeUpdateRequest;
import com.pkm.store.domain.catalog.producttype.service.ProductTypeService;
import com.pkm.store.domain.catalog.series.dto.SeriesCreateRequest;
import com.pkm.store.domain.catalog.series.dto.SeriesResponse;
import com.pkm.store.domain.catalog.series.dto.SeriesUpdateRequest;
import com.pkm.store.domain.catalog.series.service.SeriesService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminCatalogController {

    private final CategoryService categoryService;
    private final ProductTypeService productTypeService;
    private final SeriesService seriesService;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(categoryService.getAdminCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.created(URI.create("/api/admin/categories/" + response.id())).body(response);
    }

    @PatchMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @GetMapping("/product-types")
    public ResponseEntity<List<ProductTypeResponse>> getProductTypes() {
        return ResponseEntity.ok(productTypeService.getAdminProductTypes());
    }

    @PostMapping("/product-types")
    public ResponseEntity<ProductTypeResponse> createProductType(@Valid @RequestBody ProductTypeCreateRequest request) {
        ProductTypeResponse response = productTypeService.createProductType(request);
        return ResponseEntity.created(URI.create("/api/admin/product-types/" + response.id())).body(response);
    }

    @PatchMapping("/product-types/{id}")
    public ResponseEntity<ProductTypeResponse> updateProductType(
            @PathVariable Long id,
            @Valid @RequestBody ProductTypeUpdateRequest request
    ) {
        return ResponseEntity.ok(productTypeService.updateProductType(id, request));
    }

    @GetMapping("/series")
    public ResponseEntity<List<SeriesResponse>> getSeries() {
        return ResponseEntity.ok(seriesService.getAdminSeries());
    }

    @PostMapping("/series")
    public ResponseEntity<SeriesResponse> createSeries(@Valid @RequestBody SeriesCreateRequest request) {
        SeriesResponse response = seriesService.createSeries(request);
        return ResponseEntity.created(URI.create("/api/admin/series/" + response.id())).body(response);
    }

    @PatchMapping("/series/{id}")
    public ResponseEntity<SeriesResponse> updateSeries(
            @PathVariable Long id,
            @Valid @RequestBody SeriesUpdateRequest request
    ) {
        return ResponseEntity.ok(seriesService.updateSeries(id, request));
    }
}
