package com.pkm.store.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemberProfileUpdateRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @Size(max = 500)
        String profileImageUrl,

        @Size(max = 300)
        String bio
) {
}
