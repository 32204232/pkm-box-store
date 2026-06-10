package com.pkm.store.domain.catalog.producttype.repository;

import com.pkm.store.domain.catalog.producttype.entity.ProductType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {

    List<ProductType> findAllByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<ProductType> findAllByCategoryIdAndActiveTrueOrderByDisplayOrderAscIdAsc(Long categoryId);

    List<ProductType> findAllByOrderByDisplayOrderAscIdAsc();

    boolean existsByCategoryIdAndSlug(Long categoryId, String slug);

    boolean existsByCategoryIdAndSlugAndIdNot(Long categoryId, String slug, Long id);
}
