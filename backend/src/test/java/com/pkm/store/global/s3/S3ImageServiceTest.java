package com.pkm.store.global.s3;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    void uploadAllowsJpg() {
        assertUploadAllowed("box.JpG", "image/jpeg", ".jpg");
    }

    @Test
    void uploadAllowsJpeg() {
        assertUploadAllowed("box.jpeg", "image/jpeg", ".jpeg");
    }

    @Test
    void uploadAllowsPng() {
        assertUploadAllowed("box.png", "image/png", ".png");
    }

    @Test
    void uploadAllowsWebp() {
        assertUploadAllowed("box.webp", "image/webp", ".webp");
    }

    @Test
    void uploadUsesUuidBasedProductsKeyInsteadOfOriginalFilename() {
        MockMultipartFile image = createImage("위험한 파일명 box @#$%.png", "image/png", "image-content".getBytes());
        givenPutObjectSuccess();
        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);

        String imageUrl = s3ImageService.upload(image);

        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));
        String key = captor.getValue().key();
        assertThat(key).matches("products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.png");
        assertThat(key).doesNotContain("위험한 파일명");
        assertThat(imageUrl).isEqualTo("https://test-bucket.s3.ap-northeast-2.amazonaws.com/" + key);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenFilenameHasNoExtension() {
        MockMultipartFile image = createImage("box", "image/png", "image-content".getBytes());

        assertInvalidImageFile(image);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenOriginalFilenameIsBlank() {
        MockMultipartFile image = createImage(" ", "image/png", "image-content".getBytes());

        assertInvalidImageFile(image);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenExtensionIsInvalid() {
        MockMultipartFile image = createImage("box.gif", "image/gif", "image-content".getBytes());

        assertInvalidImageFile(image);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenFileIsEmpty() {
        MockMultipartFile image = createImage("box.png", "image/png", new byte[0]);

        assertInvalidImageFile(image);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenFileIsTooLarge() {
        MockMultipartFile image = createImage("box.jpg", "image/jpeg", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> s3ImageService.upload(image))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.IMAGE_FILE_TOO_LARGE);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void uploadThrowsBusinessExceptionWhenMimeTypeIsNotAllowed() {
        MockMultipartFile image = createImage("box.jpg", "text/plain", "image-content".getBytes());

        assertInvalidImageFile(image);
    }

    @Test
    void uploadThrowsBusinessExceptionWhenExtensionAndMimeTypeDoNotMatch() {
        MockMultipartFile image = createImage("box.png", "image/jpeg", "image-content".getBytes());

        assertInvalidImageFile(image);
    }

    @Test
    void uploadChecksFinalExtensionAndMimeTypeWhenFilenameHasDoubleExtension() {
        MockMultipartFile image = createImage("box.exe.png", "image/png", "image-content".getBytes());
        givenPutObjectSuccess();

        String imageUrl = s3ImageService.upload(image);

        assertThat(imageUrl).endsWith(".png");
        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void uploadThrowsBusinessExceptionWhenS3BucketIsMissing() throws Exception {
        setField("bucket", "");
        MockMultipartFile image = createImage("box.png", "image/png", "image-content".getBytes());

        assertThatThrownBy(() -> s3ImageService.upload(image))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.IMAGE_UPLOAD_FAILED);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    private void setField(String name, String value) throws Exception {
        Field field = S3ImageService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(s3ImageService, value);
    }

    private void assertUploadAllowed(String filename, String contentType, String expectedExtension) {
        MockMultipartFile image = createImage(filename, contentType, "image-content".getBytes());
        givenPutObjectSuccess();
        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);

        String imageUrl = s3ImageService.upload(image);

        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));
        PutObjectRequest request = captor.getValue();
        assertThat(request.key()).startsWith("products/");
        assertThat(request.key()).endsWith(expectedExtension);
        assertThat(request.contentType()).isEqualTo(contentType);
        assertThat(imageUrl).isEqualTo("https://test-bucket.s3.ap-northeast-2.amazonaws.com/" + request.key());
    }

    private void assertInvalidImageFile(MockMultipartFile image) {
        assertThatThrownBy(() -> s3ImageService.upload(image))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_IMAGE_FILE);
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    private MockMultipartFile createImage(String filename, String contentType, byte[] content) {
        return new MockMultipartFile("image", filename, contentType, content);
    }

    private void givenPutObjectSuccess() {
        given(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .willReturn(PutObjectResponse.builder().build());
    }
}
