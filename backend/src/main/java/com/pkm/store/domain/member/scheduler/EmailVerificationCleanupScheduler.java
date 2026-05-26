package com.pkm.store.domain.member.scheduler;

import com.pkm.store.domain.member.config.EmailVerificationProperties;
import com.pkm.store.domain.member.repository.EmailVerificationRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailVerificationCleanupScheduler {

    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailVerificationProperties properties;

    @Scheduled(cron = "${email.verification.cleanup-cron:0 20 3 * * *}")
    @Transactional
    public void cleanupExpiredOrUsedVerifications() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(properties.getCleanupRetentionDays());
        int deletedCount = emailVerificationRepository.deleteExpiredOrUsedBefore(threshold);
        if (deletedCount > 0) {
            log.info("Cleaned up {} email verification records before {}", deletedCount, threshold);
        }
    }
}
