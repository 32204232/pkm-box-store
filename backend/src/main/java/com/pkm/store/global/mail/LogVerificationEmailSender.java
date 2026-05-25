package com.pkm.store.global.mail;

import com.pkm.store.domain.member.type.EmailVerificationPurpose;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "mail", name = "mode", havingValue = "LOG", matchIfMissing = true)
public class LogVerificationEmailSender implements VerificationEmailSender {

    @Override
    public void sendVerificationCode(String email, EmailVerificationPurpose purpose, String code) {
        log.info("[EMAIL_VERIFICATION] purpose={}, email={}, code={}", purpose, email, code);
    }
}
