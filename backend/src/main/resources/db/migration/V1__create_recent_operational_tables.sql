CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    description VARCHAR(500) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_admin_audit_logs_created_at (created_at),
    INDEX idx_admin_audit_logs_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    verification_token_hash VARCHAR(255),
    expires_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6),
    used_at DATETIME(6),
    failed_attempt_count INT NOT NULL,
    send_count INT NOT NULL,
    last_sent_at DATETIME(6) NOT NULL,
    resend_available_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_email_verifications_email_purpose_created_at (email, purpose, created_at),
    INDEX idx_email_verifications_email_purpose_used_expires (email, purpose, used_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
