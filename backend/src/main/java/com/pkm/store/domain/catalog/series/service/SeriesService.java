package com.pkm.store.domain.catalog.series.service;

import com.pkm.store.domain.catalog.series.dto.SeriesCreateRequest;
import com.pkm.store.domain.catalog.series.dto.SeriesResponse;
import com.pkm.store.domain.catalog.series.dto.SeriesUpdateRequest;
import com.pkm.store.domain.catalog.series.entity.Series;
import com.pkm.store.domain.catalog.series.repository.SeriesRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeriesService {

    private final SeriesRepository seriesRepository;

    public List<SeriesResponse> getActiveSeries() {
        return seriesRepository.findAllByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(SeriesResponse::from)
                .toList();
    }

    public List<SeriesResponse> getAdminSeries() {
        return seriesRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream()
                .map(SeriesResponse::from)
                .toList();
    }

    @Transactional
    public SeriesResponse createSeries(SeriesCreateRequest request) {
        String slug = normalizeSlug(request.slug());
        if (seriesRepository.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.DUPLICATE_SERIES_SLUG);
        }

        Series series = Series.create(
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return SeriesResponse.from(seriesRepository.save(series));
    }

    @Transactional
    public SeriesResponse updateSeries(Long id, SeriesUpdateRequest request) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SERIES_NOT_FOUND));
        String slug = normalizeSlug(request.slug());
        if (seriesRepository.existsBySlugAndIdNot(slug, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_SERIES_SLUG);
        }

        series.update(
                request.name().trim(),
                slug,
                normalizeNullableText(request.description()),
                defaultDisplayOrder(request.displayOrder()),
                defaultActive(request.active())
        );
        return SeriesResponse.from(series);
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
