package com.pkm.store.domain.catalog.producttype.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductTypeUpdateRequest(
        @NotNull
        Long categoryId,

        @NotBlank
        @Size(max = 100)
        String name,

        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$")
        String slug,

        @Size(max = 500)
        String description,

        Integer displayOrder,

        Boolean active
) {
}
