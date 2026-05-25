package com.pkm.store.domain.member.dto;

import java.time.LocalDateTime;

public record EmailVerificationSendResponse(
        LocalDateTime expiresAt,
        LocalDateTime resendAvailableAt
) {
}
