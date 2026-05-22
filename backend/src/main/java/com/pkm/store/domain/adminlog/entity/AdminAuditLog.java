package com.pkm.store.domain.adminlog.entity;

import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "admin_audit_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long adminId;

    @Column(nullable = false, length = 255)
    private String adminEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AdminAuditActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AdminAuditTargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private AdminAuditLog(
            Long adminId,
            String adminEmail,
            AdminAuditActionType actionType,
            AdminAuditTargetType targetType,
            Long targetId,
            String description
    ) {
        this.adminId = adminId;
        this.adminEmail = adminEmail;
        this.actionType = actionType;
        this.targetType = targetType;
        this.targetId = targetId;
        this.description = description;
    }

    public static AdminAuditLog create(
            Long adminId,
            String adminEmail,
            AdminAuditActionType actionType,
            AdminAuditTargetType targetType,
            Long targetId,
            String description
    ) {
        return new AdminAuditLog(adminId, adminEmail, actionType, targetType, targetId, description);
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
