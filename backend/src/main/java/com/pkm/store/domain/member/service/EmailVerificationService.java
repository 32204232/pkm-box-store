package com.pkm.store.domain.member.service;

import com.pkm.store.domain.member.config.EmailVerificationProperties;
import com.pkm.store.domain.member.dto.EmailVerificationSendRequest;
import com.pkm.store.domain.member.dto.EmailVerificationSendResponse;
import com.pkm.store.domain.member.dto.EmailVerificationVerifyRequest;
import com.pkm.store.domain.member.dto.EmailVerificationVerifyResponse;
import com.pkm.store.domain.member.entity.EmailVerification;
import com.pkm.store.domain.member.repository.EmailVerificationRepository;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import com.pkm.store.global.mail.VerificationEmailSender;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmailVerificationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailVerificationRepository emailVerificationRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationEmailSender verificationEmailSender;
    private final EmailVerificationProperties properties;

    @Transactional
    public EmailVerificationSendResponse send(EmailVerificationSendRequest request) {
        String email = normalizeEmail(request.email());
        EmailVerificationPurpose purpose = request.purpose();
        LocalDateTime now = LocalDateTime.now();

        if (purpose == EmailVerificationPurpose.SIGNUP && memberRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        LocalDateTime expiresAt = now.plusSeconds(properties.getCodeTtlSeconds());
        LocalDateTime resendAvailableAt = now.plusSeconds(properties.getResendCooldownSeconds());

        if (purpose == EmailVerificationPurpose.PASSWORD_RESET && !memberRepository.existsByEmail(email)) {
            return new EmailVerificationSendResponse(expiresAt, resendAvailableAt);
        }

        String code = createCode();
        EmailVerification verification = prepareVerification(
                email,
                purpose,
                passwordEncoder.encode(code),
                now,
                expiresAt,
                resendAvailableAt
        );

        emailVerificationRepository.save(verification);
        verificationEmailSender.sendVerificationCode(email, purpose, code);
        return new EmailVerificationSendResponse(expiresAt, resendAvailableAt);
    }

    @Transactional
    public EmailVerificationVerifyResponse verify(EmailVerificationVerifyRequest request) {
        String email = normalizeEmail(request.email());
        EmailVerification verification = emailVerificationRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, request.purpose())
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_VERIFICATION_REQUIRED));
        LocalDateTime now = LocalDateTime.now();

        if (verification.getUsedAt() != null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_USED);
        }
        if (verification.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED);
        }
        if (verification.getFailedAttemptCount() >= properties.getMaxFailedAttempts()) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS);
        }
        if (!passwordEncoder.matches(request.code(), verification.getCodeHash())) {
            verification.increaseFailedAttemptCount();
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        String verificationToken = createVerificationToken();
        LocalDateTime tokenExpiresAt = now.plusSeconds(properties.getTokenTtlSeconds());
        verification.verify(passwordEncoder.encode(verificationToken), now, tokenExpiresAt);
        return new EmailVerificationVerifyResponse(verificationToken, tokenExpiresAt);
    }

    @Transactional
    public void consumeVerificationToken(String email, EmailVerificationPurpose purpose, String verificationToken) {
        String normalizedEmail = normalizeEmail(email);
        LocalDateTime now = LocalDateTime.now();

        EmailVerification verification = emailVerificationRepository
                .findAllByEmailAndPurposeOrderByCreatedAtDesc(normalizedEmail, purpose)
                .stream()
                .filter(candidate -> candidate.getVerificationTokenHash() != null)
                .filter(candidate -> passwordEncoder.matches(verificationToken, candidate.getVerificationTokenHash()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

        if (verification.getUsedAt() != null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_USED);
        }
        if (verification.getVerifiedAt() == null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
        }
        if (verification.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
        }

        verification.markUsed(now);
    }

    private EmailVerification prepareVerification(
            String email,
            EmailVerificationPurpose purpose,
            String codeHash,
            LocalDateTime now,
            LocalDateTime expiresAt,
            LocalDateTime resendAvailableAt
    ) {
        return emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .map(verification -> {
                    if (shouldResetSendWindow(verification, now)) {
                        return EmailVerification.create(email, purpose, codeHash, expiresAt, now, resendAvailableAt);
                    }
                    validateCanResend(verification, now);
                    verification.replaceCode(
                            codeHash,
                            expiresAt,
                            now,
                            resendAvailableAt,
                            false
                    );
                    return verification;
                })
                .orElseGet(() -> EmailVerification.create(
                        email,
                        purpose,
                        codeHash,
                        expiresAt,
                        now,
                        resendAvailableAt
                ));
    }

    private void validateCanResend(EmailVerification verification, LocalDateTime now) {
        if (verification.getResendAvailableAt().isAfter(now)) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_RESEND_TOO_SOON);
        }
        if (!shouldResetSendWindow(verification, now)
                && verification.getSendCount() >= properties.getMaxSendsPerWindow()) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS);
        }
    }

    private boolean shouldResetSendWindow(EmailVerification verification, LocalDateTime now) {
        return verification.getCreatedAt() != null
                && verification.getCreatedAt().isBefore(now.minusSeconds(properties.getSendWindowSeconds()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String createCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String createVerificationToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
