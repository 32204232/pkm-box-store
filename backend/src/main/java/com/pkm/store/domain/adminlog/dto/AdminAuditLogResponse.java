package com.pkm.store.domain.adminlog.dto;

import com.pkm.store.domain.adminlog.entity.AdminAuditLog;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import java.time.LocalDateTime;

public record AdminAuditLogResponse(
        Long id,
        Long adminId,
        String adminEmail,
        AdminAuditActionType actionType,
        AdminAuditTargetType targetType,
        Long targetId,
        String description,
        LocalDateTime createdAt
) {

    public static AdminAuditLogResponse from(AdminAuditLog log) {
        return new AdminAuditLogResponse(
                log.getId(),
                log.getAdminId(),
                log.getAdminEmail(),
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getDescription(),
                log.getCreatedAt()
        );
    }
}
