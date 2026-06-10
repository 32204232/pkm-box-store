package com.pkm.store.domain.catalog.series.dto;

import com.pkm.store.domain.catalog.series.entity.Series;

public record SeriesResponse(
        Long id,
        String name,
        String slug,
        String description,
        int displayOrder,
        boolean active
) {

    public static SeriesResponse from(Series series) {
        return new SeriesResponse(
                series.getId(),
                series.getName(),
                series.getSlug(),
                series.getDescription(),
                series.getDisplayOrder(),
                series.isActive()
        );
    }
}
