package com.pkm.store.global.s3;

import com.pkm.store.global.exception.BusinessException;
import com.pkm.store.global.exception.ErrorCode;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class S3ImageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Map<String, String> ALLOWED_CONTENT_TYPES_BY_EXTENSION = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp"
    );

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.region}")
    private String region;

    public String upload(MultipartFile image) {
        validateImage(image);
        validateS3Properties();

        String originalFilename = image.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String key = "products/" + UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(image.getContentType())
                    .contentLength(image.getSize())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(image.getInputStream(), image.getSize()));
            return createImageUrl(key);
        } catch (IOException | RuntimeException exception) {
            throw new BusinessException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty() || image.getSize() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_FILE);
        }
        if (image.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.IMAGE_FILE_TOO_LARGE);
        }

        String extension = getExtension(image.getOriginalFilename());
        String allowedContentType = ALLOWED_CONTENT_TYPES_BY_EXTENSION.get(extension);
        if (allowedContentType == null || !allowedContentType.equals(image.getContentType())) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_FILE);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.isBlank() || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_FILE);
        }

        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (extension.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE_FILE);
        }

        return extension;
    }

    private String createImageUrl(String key) {
        validateS3Properties();
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    private void validateS3Properties() {
        if (bucket == null || bucket.isBlank() || region == null || region.isBlank()) {
            throw new BusinessException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }
}
