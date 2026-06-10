package com.pkm.store.domain.catalog.controller;

import com.pkm.store.domain.catalog.category.dto.CategoryResponse;
import com.pkm.store.domain.catalog.category.service.CategoryService;
import com.pkm.store.domain.catalog.producttype.dto.ProductTypeResponse;
import com.pkm.store.domain.catalog.producttype.service.ProductTypeService;
import com.pkm.store.domain.catalog.series.dto.SeriesResponse;
import com.pkm.store.domain.catalog.series.service.SeriesService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CatalogController {

    private final CategoryService categoryService;
    private final ProductTypeService productTypeService;
    private final SeriesService seriesService;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    @GetMapping("/product-types")
    public ResponseEntity<List<ProductTypeResponse>> getProductTypes(
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(productTypeService.getActiveProductTypes(categoryId));
    }

    @GetMapping("/series")
    public ResponseEntity<List<SeriesResponse>> getSeries() {
        return ResponseEntity.ok(seriesService.getActiveSeries());
    }
}
