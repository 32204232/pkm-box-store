package com.pkm.store.global.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "mail", name = "mode", havingValue = "LOG", matchIfMissing = true)
public class LogCustomerEmailSender implements CustomerEmailSender {

    @Override
    public void send(String to, String subject, String text) {
        log.info("[CUSTOMER_EMAIL] to={}, subject={}, text={}", to, subject, text);
    }
}
