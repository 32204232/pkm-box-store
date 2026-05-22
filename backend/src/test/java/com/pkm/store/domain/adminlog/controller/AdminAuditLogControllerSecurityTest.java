package com.pkm.store.domain.adminlog.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pkm.store.domain.adminlog.dto.AdminAuditLogResponse;
import com.pkm.store.domain.adminlog.service.AdminAuditLogService;
import com.pkm.store.domain.adminlog.type.AdminAuditActionType;
import com.pkm.store.domain.adminlog.type.AdminAuditTargetType;
import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import com.pkm.store.global.security.CustomUserDetailsService;
import com.pkm.store.global.security.SecurityConfig;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminAuditLogController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminAuditLogControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminAuditLogService adminAuditLogService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void getAuditLogsReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 401 && status != 403) {
                        throw new AssertionError("Expected 401 or 403 but was " + status);
                    }
                });
    }

    @Test
    void getAuditLogsReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAuditLogsIsAllowedWithAdminRole() throws Exception {
        given(adminAuditLogService.getRecentLogs()).willReturn(List.of(new AdminAuditLogResponse(
                1L,
                10L,
                "admin@example.com",
                AdminAuditActionType.PRODUCT_CREATED,
                AdminAuditTargetType.PRODUCT,
                100L,
                "상품 등록: Pokemon Card Box",
                LocalDateTime.of(2026, 5, 22, 10, 0)
        )));

        mockMvc.perform(get("/api/admin/audit-logs")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].actionType").value("PRODUCT_CREATED"));
    }
}
