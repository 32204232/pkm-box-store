package com.pkm.store.domain.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

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
import com.pkm.store.global.mail.VerificationEmailSender;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private VerificationEmailSender verificationEmailSender;

    private EmailVerificationProperties properties;

    private EmailVerificationService emailVerificationService;

    @BeforeEach
    void setUp() {
        properties = new EmailVerificationProperties();
        emailVerificationService = new EmailVerificationService(
                emailVerificationRepository,
                memberRepository,
                passwordEncoder,
                verificationEmailSender,
                properties
        );
    }

    @Test
    void sendSignupVerificationSucceeds() {
        EmailVerificationSendRequest request = new EmailVerificationSendRequest(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        );
        given(memberRepository.existsByEmail(request.email())).willReturn(false);
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                request.email(),
                request.purpose()
        )).willReturn(Optional.empty());
        given(passwordEncoder.encode(any())).willReturn("code-hash");

        EmailVerificationSendResponse response = emailVerificationService.send(request);

        assertThat(response.expiresAt()).isAfter(LocalDateTime.now());
        assertThat(response.resendAvailableAt()).isAfter(LocalDateTime.now());
        verify(emailVerificationRepository).save(any(EmailVerification.class));
        verify(verificationEmailSender).sendVerificationCode(eq(request.email()), eq(request.purpose()), any());
    }

    @Test
    void verifyCodeSucceeds() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(Optional.of(verification));
        given(passwordEncoder.matches("123456", "code-hash")).willReturn(true);
        given(passwordEncoder.encode(any())).willReturn("token-hash");

        EmailVerificationVerifyResponse response = emailVerificationService.verify(
                new EmailVerificationVerifyRequest("member@example.com", EmailVerificationPurpose.SIGNUP, "123456")
        );

        assertThat(response.verificationToken()).isNotBlank();
        assertThat(verification.getVerifiedAt()).isNotNull();
        assertThat(verification.getVerificationTokenHash()).isEqualTo("token-hash");
    }

    @Test
    void verifyCodeFailsWhenExpired() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "code-hash",
                LocalDateTime.now().minusSeconds(1),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(Optional.of(verification));

        assertThatThrownBy(() -> emailVerificationService.verify(
                new EmailVerificationVerifyRequest("member@example.com", EmailVerificationPurpose.SIGNUP, "123456")
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void verifyCodeFailsWhenInvalid() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(Optional.of(verification));
        given(passwordEncoder.matches("000000", "code-hash")).willReturn(false);

        assertThatThrownBy(() -> emailVerificationService.verify(
                new EmailVerificationVerifyRequest("member@example.com", EmailVerificationPurpose.SIGNUP, "000000")
        )).isInstanceOf(BusinessException.class);
        assertThat(verification.getFailedAttemptCount()).isEqualTo(1);
    }

    @Test
    void verifyCodeFailsWhenFailedAttemptsExceeded() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        for (int i = 0; i < properties.getMaxFailedAttempts(); i++) {
            verification.increaseFailedAttemptCount();
        }
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(Optional.of(verification));

        assertThatThrownBy(() -> emailVerificationService.verify(
                new EmailVerificationVerifyRequest("member@example.com", EmailVerificationPurpose.SIGNUP, "123456")
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void sendFailsWhenResendTooSoon() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now().plusSeconds(30)
        );
        given(memberRepository.existsByEmail("member@example.com")).willReturn(false);
        given(emailVerificationRepository.findFirstByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(Optional.of(verification));

        assertThatThrownBy(() -> emailVerificationService.send(
                new EmailVerificationSendRequest("member@example.com", EmailVerificationPurpose.SIGNUP)
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void consumeTokenFailsWhenPurposeDoesNotMatch() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.PASSWORD_RESET,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        verification.verify("token-hash", LocalDateTime.now(), LocalDateTime.now().plusMinutes(10));
        given(emailVerificationRepository.findAllByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP
        )).willReturn(java.util.List.of());

        assertThatThrownBy(() -> emailVerificationService.consumeVerificationToken(
                "member@example.com",
                EmailVerificationPurpose.SIGNUP,
                "token"
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void consumeTokenSucceedsAndMarksUsed() {
        EmailVerification verification = EmailVerification.create(
                "member@example.com",
                EmailVerificationPurpose.PASSWORD_RESET,
                "code-hash",
                LocalDateTime.now().plusMinutes(5),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        verification.verify("token-hash", LocalDateTime.now(), LocalDateTime.now().plusMinutes(10));
        given(emailVerificationRepository.findAllByEmailAndPurposeOrderByCreatedAtDesc(
                "member@example.com",
                EmailVerificationPurpose.PASSWORD_RESET
        )).willReturn(java.util.List.of(verification));
        given(passwordEncoder.matches("token", "token-hash")).willReturn(true);

        emailVerificationService.consumeVerificationToken(
                "member@example.com",
                EmailVerificationPurpose.PASSWORD_RESET,
                "token"
        );

        assertThat(verification.getUsedAt()).isNotNull();
    }
}
