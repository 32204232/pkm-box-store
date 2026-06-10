package com.pkm.store.domain.catalog.series.repository;

import com.pkm.store.domain.catalog.series.entity.Series;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeriesRepository extends JpaRepository<Series, Long> {

    List<Series> findAllByActiveTrueOrderByDisplayOrderAscIdAsc();

    List<Series> findAllByOrderByDisplayOrderAscIdAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
