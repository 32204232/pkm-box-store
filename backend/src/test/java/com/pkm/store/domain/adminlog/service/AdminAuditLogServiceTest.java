package com.pkm.store.domain.adminlog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.domain.adminlog.dto.AdminAuditLogResponse;
import com.pkm.store.domain.adminlog.entity.AdminAuditLog;
import com.pkm.store.domain.adminlog.repository.AdminAuditLogRepository;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.repository.MemberRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminAuditLogServiceTest {

    private static final String ADMIN_EMAIL = "admin@example.com";

    @Mock
    private AdminAuditLogRepository adminAuditLogRepository;

    @Mock
    private MemberRepository memberRepository;

    private AdminAuditLogService adminAuditLogService;
    private Member admin;

    @BeforeEach
    void setUp() {
        adminAuditLogService = new AdminAuditLogService(adminAuditLogRepository, memberRepository);
        admin = Member.create(ADMIN_EMAIL, "encoded-password", "Admin");
        ReflectionTestUtils.setField(admin, "id", 1L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ADMIN_EMAIL, null)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordSavesCurrentAdminInfo() {
        given(memberRepository.findByEmail(ADMIN_EMAIL)).willReturn(Optional.of(admin));
        ArgumentCaptor<AdminAuditLog> captor = ArgumentCaptor.forClass(AdminAuditLog.class);

        adminAuditLogService.record(
                AdminAuditActionType.PRODUCT_CREATED,
                AdminAuditTargetType.PRODUCT,
                10L,
                "상품 등록: Pokemon Card Box"
        );

        verify(adminAuditLogRepository).save(captor.capture());
        AdminAuditLog log = captor.getValue();
        assertThat(log.getAdminId()).isEqualTo(1L);
        assertThat(log.getAdminEmail()).isEqualTo(ADMIN_EMAIL);
        assertThat(log.getActionType()).isEqualTo(AdminAuditActionType.PRODUCT_CREATED);
        assertThat(log.getTargetType()).isEqualTo(AdminAuditTargetType.PRODUCT);
        assertThat(log.getTargetId()).isEqualTo(10L);
        assertThat(log.getDescription()).isEqualTo("상품 등록: Pokemon Card Box");
    }

    @Test
    void getRecentLogsReturnsTop100ByCreatedAtDesc() {
        AdminAuditLog latest = createLog(2L, LocalDateTime.of(2026, 5, 22, 10, 0));
        AdminAuditLog previous = createLog(1L, LocalDateTime.of(2026, 5, 21, 10, 0));
        given(adminAuditLogRepository.findTop100ByOrderByCreatedAtDesc()).willReturn(List.of(latest, previous));

        List<AdminAuditLogResponse> responses = adminAuditLogService.getRecentLogs();

        assertThat(responses).extracting(AdminAuditLogResponse::id).containsExactly(2L, 1L);
        verify(adminAuditLogRepository).findTop100ByOrderByCreatedAtDesc();
    }

    private AdminAuditLog createLog(Long id, LocalDateTime createdAt) {
        AdminAuditLog log = AdminAuditLog.create(
                1L,
                ADMIN_EMAIL,
                AdminAuditActionType.PRODUCT_CREATED,
                AdminAuditTargetType.PRODUCT,
                10L,
                "상품 등록: Pokemon Card Box"
        );
        ReflectionTestUtils.setField(log, "id", id);
        ReflectionTestUtils.setField(log, "createdAt", createdAt);
        return log;
    }
}
