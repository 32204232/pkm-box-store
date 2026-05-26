package com.pkm.store.domain.member.repository;

import com.pkm.store.domain.member.entity.EmailVerification;
import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findFirstByEmailAndPurposeOrderByCreatedAtDesc(
            String email,
            EmailVerificationPurpose purpose
    );

    List<EmailVerification> findAllByEmailAndPurposeOrderByCreatedAtDesc(
            String email,
            EmailVerificationPurpose purpose
    );

    @Modifying
    @Query("""
            delete from EmailVerification verification
            where verification.updatedAt < :threshold
              and (verification.usedAt is not null or verification.expiresAt < :threshold)
            """)
    int deleteExpiredOrUsedBefore(@Param("threshold") LocalDateTime threshold);
}
