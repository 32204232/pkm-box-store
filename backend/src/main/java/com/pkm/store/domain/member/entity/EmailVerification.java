package com.pkm.store.domain.member.entity;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "email_verifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmailVerificationPurpose purpose;

    @Column(nullable = false, length = 255)
    private String codeHash;

    @Column(length = 255)
    private String verificationTokenHash;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime verifiedAt;

    private LocalDateTime usedAt;

    @Column(nullable = false)
    private int failedAttemptCount;

    @Column(nullable = false)
    private int sendCount;

    @Column(nullable = false)
    private LocalDateTime lastSentAt;

    @Column(nullable = false)
    private LocalDateTime resendAvailableAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private EmailVerification(
            String email,
            EmailVerificationPurpose purpose,
            String codeHash,
            LocalDateTime expiresAt,
            LocalDateTime lastSentAt,
            LocalDateTime resendAvailableAt
    ) {
        this.email = email;
        this.purpose = purpose;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.failedAttemptCount = 0;
        this.sendCount = 1;
        this.lastSentAt = lastSentAt;
        this.resendAvailableAt = resendAvailableAt;
    }

    public static EmailVerification create(
            String email,
            EmailVerificationPurpose purpose,
            String codeHash,
            LocalDateTime expiresAt,
            LocalDateTime lastSentAt,
            LocalDateTime resendAvailableAt
    ) {
        return new EmailVerification(email, purpose, codeHash, expiresAt, lastSentAt, resendAvailableAt);
    }

    public void replaceCode(
            String codeHash,
            LocalDateTime expiresAt,
            LocalDateTime lastSentAt,
            LocalDateTime resendAvailableAt,
            boolean resetSendWindow
    ) {
        this.codeHash = codeHash;
        this.verificationTokenHash = null;
        this.expiresAt = expiresAt;
        this.verifiedAt = null;
        this.usedAt = null;
        this.failedAttemptCount = 0;
        this.sendCount = resetSendWindow ? 1 : this.sendCount + 1;
        this.lastSentAt = lastSentAt;
        this.resendAvailableAt = resendAvailableAt;
    }

    public void increaseFailedAttemptCount() {
        this.failedAttemptCount++;
    }

    public void verify(String verificationTokenHash, LocalDateTime verifiedAt, LocalDateTime tokenExpiresAt) {
        this.verificationTokenHash = verificationTokenHash;
        this.verifiedAt = verifiedAt;
        this.expiresAt = tokenExpiresAt;
    }

    public void markUsed(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
