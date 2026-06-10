package com.pkm.store.domain.catalog.category.repository;

import com.pkm.store.domain.catalog.category.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<Category> findAllByOrderByDisplayOrderAscIdAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
