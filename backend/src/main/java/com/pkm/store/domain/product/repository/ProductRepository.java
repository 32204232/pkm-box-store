package com.pkm.store.domain.product.repository;

import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByStatusNotOrderByCreatedAtDesc(ProductStatus status);

    Optional<Product> findByIdAndStatusNot(Long id, ProductStatus status);

    long countByStockQuantityLessThanEqualAndStatusNot(int stockQuantity, ProductStatus status);

    List<Product> findAllByStockQuantityLessThanEqualAndStatusNotOrderByStockQuantityAscCreatedAtDesc(
            int stockQuantity,
            ProductStatus status
    );

    @Query("""
            select p
            from Product p
            left join p.categoryMaster cm
            left join p.productType pt
            left join p.seriesMaster sm
            where p.status <> :hiddenStatus
              and (:keyword is null
                   or lower(p.name) like lower(concat('%', :keyword, '%'))
                   or lower(p.description) like lower(concat('%', :keyword, '%')))
              and (:category is null or p.category = :category)
              and (:series is null or p.series = :series)
              and (:categoryId is null or cm.id = :categoryId)
              and (:productTypeId is null or pt.id = :productTypeId)
              and (:seriesId is null or sm.id = :seriesId)
              and (:status is null or p.status = :status)
              and (:inStockOnly = false or p.stockQuantity > 0)
            """)
    List<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("series") String series,
            @Param("categoryId") Long categoryId,
            @Param("productTypeId") Long productTypeId,
            @Param("seriesId") Long seriesId,
            @Param("status") ProductStatus status,
            @Param("inStockOnly") boolean inStockOnly,
            @Param("hiddenStatus") ProductStatus hiddenStatus,
            org.springframework.data.domain.Sort sort
    );

    @Query("""
            select p
            from Product p
            left join p.categoryMaster cm
            left join p.productType pt
            left join p.seriesMaster sm
            where (:keyword is null
                   or lower(p.name) like lower(concat('%', :keyword, '%'))
                   or lower(p.description) like lower(concat('%', :keyword, '%')))
              and (:category is null or p.category = :category)
              and (:series is null or p.series = :series)
              and (:categoryId is null or cm.id = :categoryId)
              and (:productTypeId is null or pt.id = :productTypeId)
              and (:seriesId is null or sm.id = :seriesId)
              and (:status is null or p.status = :status)
              and (:lowStockOnly = false or p.stockQuantity <= :lowStockThreshold)
            """)
    List<Product> searchAdminProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("series") String series,
            @Param("categoryId") Long categoryId,
            @Param("productTypeId") Long productTypeId,
            @Param("seriesId") Long seriesId,
            @Param("status") ProductStatus status,
            @Param("lowStockOnly") boolean lowStockOnly,
            @Param("lowStockThreshold") int lowStockThreshold,
            org.springframework.data.domain.Sort sort
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdWithPessimisticWriteLock(@Param("id") Long id);
}
