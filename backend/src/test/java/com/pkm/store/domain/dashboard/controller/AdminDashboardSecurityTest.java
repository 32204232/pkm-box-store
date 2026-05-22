package com.pkm.store.domain.dashboard.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pkm.store.domain.dashboard.dto.AdminDashboardResponse;
import com.pkm.store.domain.dashboard.service.AdminDashboardService;
import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import com.pkm.store.global.security.CustomUserDetailsService;
import com.pkm.store.global.security.SecurityConfig;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminDashboardController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminDashboardSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminDashboardService adminDashboardService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void getDashboardReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 401 && status != 403) {
                        throw new AssertionError("Expected 401 or 403 but was " + status);
                    }
                });
    }

    @Test
    void getDashboardReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDashboardIsAllowedWithAdminRole() throws Exception {
        given(adminDashboardService.getDashboard()).willReturn(new AdminDashboardResponse(
                0,
                BigDecimal.ZERO,
                0,
                0,
                0,
                0,
                0,
                List.of(),
                List.of()
        ));

        mockMvc.perform(get("/api/admin/dashboard")
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }
}
