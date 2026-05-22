package com.pkm.store.domain.adminlog.service;

import com.pkm.store.domain.adminlog.dto.AdminAuditLogResponse;
import com.pkm.store.domain.adminlog.entity.AdminAuditLog;
import com.pkm.store.domain.adminlog.repository.AdminAuditLogRepository;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAuditLogService {

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void record(
            AdminAuditActionType actionType,
            AdminAuditTargetType targetType,
            Long targetId,
            String description
    ) {
        Member admin = getCurrentAdmin();
        adminAuditLogRepository.save(AdminAuditLog.create(
                admin.getId(),
                admin.getEmail(),
                actionType,
                targetType,
                targetId,
                description
        ));
    }

    public List<AdminAuditLogResponse> getRecentLogs() {
        return adminAuditLogRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .map(AdminAuditLogResponse::from)
                .toList();
    }

    private Member getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
