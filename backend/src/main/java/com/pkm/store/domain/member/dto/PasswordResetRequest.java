package com.pkm.store.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        String verificationToken,

        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword
) {
}
