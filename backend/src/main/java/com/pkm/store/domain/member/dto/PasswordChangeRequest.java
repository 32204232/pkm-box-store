package com.pkm.store.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
        @NotBlank
        @Size(max = 100)
        String currentPassword,

        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword
) {
}
