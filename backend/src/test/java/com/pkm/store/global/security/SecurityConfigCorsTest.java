package com.pkm.store.global.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pkm.store.domain.product.controller.ProductController;
import com.pkm.store.domain.product.service.ProductService;
import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

class SecurityConfigCorsTest {

    @Nested
    @WebMvcTest(ProductController.class)
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class})
    class DefaultCorsAllowedOriginsTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private ProductService productService;

        @MockBean
        private JwtTokenProvider jwtTokenProvider;

        @MockBean
        private CustomUserDetailsService customUserDetailsService;

        @Test
        void defaultOriginAllowsLocalhost3000() throws Exception {
            mockMvc.perform(options("/api/products")
                            .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"));
        }
    }

    @Nested
    @WebMvcTest(ProductController.class)
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class})
    @TestPropertySource(properties = "cors.allowed-origins=http://localhost:3000, https://pkm-box-store.com, ,https://www.pkm-box-store.com")
    class MultipleCorsAllowedOriginsTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private ProductService productService;

        @MockBean
        private JwtTokenProvider jwtTokenProvider;

        @MockBean
        private CustomUserDetailsService customUserDetailsService;

        @Test
        void commaSeparatedOriginsAreTrimmedAndAllowed() throws Exception {
            mockMvc.perform(options("/api/products")
                            .header(HttpHeaders.ORIGIN, "https://pkm-box-store.com")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://pkm-box-store.com"));

            mockMvc.perform(options("/api/products")
                            .header(HttpHeaders.ORIGIN, "https://www.pkm-box-store.com")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://www.pkm-box-store.com"));
        }

        @Test
        void disallowedOriginDoesNotReceiveCorsResponse() throws Exception {
            mockMvc.perform(options("/api/products")
                            .header(HttpHeaders.ORIGIN, "https://evil.example.com")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andExpect(status().isForbidden())
                    .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        }
    }
}
