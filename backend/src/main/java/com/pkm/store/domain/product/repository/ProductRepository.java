package com.pkm.store.domain.product.repository;

import com.pkm.store.domain.product.entity.Product;
import com.pkm.store.domain.product.type.ProductStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByStatusNotOrderByCreatedAtDesc(ProductStatus status);

    Optional<Product> findByIdAndStatusNot(Long id, ProductStatus status);
}
