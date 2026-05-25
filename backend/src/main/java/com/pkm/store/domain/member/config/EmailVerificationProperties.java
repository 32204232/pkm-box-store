package com.pkm.store.domain.member.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "email.verification")
public class EmailVerificationProperties {

    private long codeTtlSeconds = 300;
    private long tokenTtlSeconds = 600;
    private long resendCooldownSeconds = 60;
    private int maxFailedAttempts = 5;
    private int maxSendsPerWindow = 5;
    private long sendWindowSeconds = 3600;

    public long getCodeTtlSeconds() {
        return codeTtlSeconds;
    }

    public void setCodeTtlSeconds(long codeTtlSeconds) {
        this.codeTtlSeconds = codeTtlSeconds;
    }

    public long getTokenTtlSeconds() {
        return tokenTtlSeconds;
    }

    public void setTokenTtlSeconds(long tokenTtlSeconds) {
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    public long getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    public void setResendCooldownSeconds(long resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public int getMaxFailedAttempts() {
        return maxFailedAttempts;
    }

    public void setMaxFailedAttempts(int maxFailedAttempts) {
        this.maxFailedAttempts = maxFailedAttempts;
    }

    public int getMaxSendsPerWindow() {
        return maxSendsPerWindow;
    }

    public void setMaxSendsPerWindow(int maxSendsPerWindow) {
        this.maxSendsPerWindow = maxSendsPerWindow;
    }

    public long getSendWindowSeconds() {
        return sendWindowSeconds;
    }

    public void setSendWindowSeconds(long sendWindowSeconds) {
        this.sendWindowSeconds = sendWindowSeconds;
    }
}
