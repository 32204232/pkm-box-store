package com.pkm.store.domain.adminlog.controller;

import com.pkm.store.domain.adminlog.dto.AdminAuditLogResponse;
import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {

    private final AdminAuditLogService adminAuditLogService;

    @GetMapping
    public ResponseEntity<List<AdminAuditLogResponse>> getAuditLogs() {
        return ResponseEntity.ok(adminAuditLogService.getRecentLogs());
    }
}
