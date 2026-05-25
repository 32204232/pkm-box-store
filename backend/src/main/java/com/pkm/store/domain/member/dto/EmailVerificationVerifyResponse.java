package com.pkm.store.domain.member.dto;

import java.time.LocalDateTime;

public record EmailVerificationVerifyResponse(
        String verificationToken,
        LocalDateTime expiresAt
) {
}
