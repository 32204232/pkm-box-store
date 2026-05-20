package com.pkm.store.global.s3;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pkm.store.global.jwt.JwtAuthenticationFilter;
import com.pkm.store.global.jwt.JwtTokenProvider;
import com.pkm.store.global.security.CustomUserDetailsService;
import com.pkm.store.global.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

@WebMvcTest(ImageController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ImageControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private S3ImageService s3ImageService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void uploadImageReturnsUnauthorizedOrForbiddenWithoutAuthentication() throws Exception {
        mockMvc.perform(multipart("/api/admin/images").file(createImage()))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    if (status != 401 && status != 403) {
                        throw new AssertionError("Expected 401 or 403 but was " + status);
                    }
                });
    }

    @Test
    void uploadImageReturnsForbiddenWithMemberRole() throws Exception {
        mockMvc.perform(multipart("/api/admin/images")
                        .file(createImage())
                        .with(user("member@example.com").roles("MEMBER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void uploadImageIsAllowedWithAdminRole() throws Exception {
        given(s3ImageService.upload(any(MultipartFile.class))).willReturn("https://example.com/image.png");

        mockMvc.perform(multipart("/api/admin/images")
                        .file(createImage())
                        .with(user("admin@example.com").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    private MockMultipartFile createImage() {
        return new MockMultipartFile(
                "image",
                "box.png",
                "image/png",
                "image-content".getBytes()
        );
    }
}
