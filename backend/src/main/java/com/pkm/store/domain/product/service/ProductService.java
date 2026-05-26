package com.pkm.store.domain.product.service;

import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.domain.product.dto.AdminProductSearchCondition;
import com.pkm.store.domain.product.dto.ProductCreateRequest;
import com.pkm.store.domain.product.dto.ProductResponse;
import com.pkm.store.domain.product.dto.ProductSearchCondition;
import com.pkm.store.domain.product.dto.ProductUpdateRequest;
import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.repository.ProductRepository;
import com.pkm.store.domain.product.type.ProductStatus;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProductRepository productRepository;
    private final AdminAuditLogService adminAuditLogService;

    public List<ProductResponse> getProducts() {
        return getProducts(new ProductSearchCondition(null, null, null, null, false, "latest"));
    }

    public List<ProductResponse> getProducts(ProductSearchCondition condition) {
        return productRepository.searchProducts(
                        condition.keyword(),
                        condition.category(),
                        condition.series(),
                        condition.status(),
                        condition.inStockOnly(),
                        ProductStatus.HIDDEN,
                        sortBy(condition.sort())
                )
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    public List<ProductResponse> getAdminProducts() {
        return getAdminProducts(new AdminProductSearchCondition(null, null, null, null, false));
    }

    public List<ProductResponse> getAdminProducts(AdminProductSearchCondition condition) {
        return productRepository.searchAdminProducts(
                        condition.keyword(),
                        condition.category(),
                        condition.series(),
                        condition.status(),
                        condition.lowStockOnly(),
                        LOW_STOCK_THRESHOLD,
                        Sort.by(Sort.Direction.ASC, "stockQuantity").and(Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndStatusNot(id, ProductStatus.HIDDEN)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = Product.create(
                request.name(),
                request.description(),
                request.price(),
                request.category(),
                request.series(),
                request.releaseDate(),
                request.stockQuantity(),
                request.imageUrl(),
                request.status()
        );
        Product savedProduct = productRepository.save(product);
        adminAuditLogService.record(
                AdminAuditActionType.PRODUCT_CREATED,
                AdminAuditTargetType.PRODUCT,
                savedProduct.getId(),
                "상품 등록: " + savedProduct.getName()
        );
        return ProductResponse.from(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.update(
                request.name(),
                request.description(),
                request.price(),
                request.category(),
                request.series(),
                request.releaseDate(),
                request.stockQuantity(),
                request.imageUrl(),
                request.status()
        );
        adminAuditLogService.record(
                AdminAuditActionType.PRODUCT_UPDATED,
                AdminAuditTargetType.PRODUCT,
                product.getId(),
                "상품 수정: " + product.getName()
        );
        return ProductResponse.from(product);
    }

    @Transactional
    public void hideProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.hide();
        adminAuditLogService.record(
                AdminAuditActionType.PRODUCT_HIDDEN,
                AdminAuditTargetType.PRODUCT,
                product.getId(),
                "상품 숨김: " + product.getName()
        );
    }

    private Sort sortBy(String sort) {
        return switch (sort) {
            case "priceAsc" -> Sort.by(Sort.Direction.ASC, "price").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "priceDesc" -> Sort.by(Sort.Direction.DESC, "price").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "releaseDateDesc" -> Sort.by(Sort.Direction.DESC, "releaseDate").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "latest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
