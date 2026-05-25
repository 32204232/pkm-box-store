package com.pkm.store.domain.member.dto;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmailVerificationSendRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotNull
        EmailVerificationPurpose purpose
) {
}
