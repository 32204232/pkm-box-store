package com.pkm.store.global.s3;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.pkm.store.global.exception.BusinessException;
import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@ExtendWith(MockitoExtension.class)
class S3ImageServiceTest {

    @Mock
    private S3Client s3Client;

    private S3ImageService s3ImageService;

    @BeforeEach
    void setUp() throws Exception {
        s3ImageService = new S3ImageService(s3Client);
        setField("bucket", "test-bucket");
        setField("region", "ap-northeast-2");
    }

    @Test
    void uploadSucceeds() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "box.png",
                "image/png",
                "image-content".getBytes()
        );
        given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .willReturn(PutObjectResponse.builder().build());

        String imageUrl = s3ImageService.upload(image);

        assertThat(imageUrl).startsWith("https://test-bucket.s3.ap-northeast-2.amazonaws.com/images/");
        assertThat(imageUrl).endsWith(".png");
        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void uploadThrowsBusinessExceptionWhenExtensionIsInvalid() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "box.gif",
                "image/gif",
                "image-content".getBytes()
        );

        assertThatThrownBy(() -> s3ImageService.upload(image))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenFileIsTooLarge() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "box.jpg",
                "image/jpeg",
                new byte[5 * 1024 * 1024 + 1]
        );

        assertThatThrownBy(() -> s3ImageService.upload(image))
                .isInstanceOf(BusinessException.class);
    }

    private void setField(String name, String value) throws Exception {
        Field field = S3ImageService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(s3ImageService, value);
    }
}
