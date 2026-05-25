package com.pkm.store.domain.member.dto;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmailVerificationVerifyRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotNull
        EmailVerificationPurpose purpose,

        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String code
) {
}
