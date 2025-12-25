package com.kyc.automation.service.impl;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.kyc.automation.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Paths;

import java.io.IOException;
import java.util.UUID;

@Service
@Primary
public class GcpStorageService implements StorageService {

    private final Storage storage;
    private final String bucketName;

    public GcpStorageService(@Value("${gcp.storage.bucket-name}") String bucketName) {
        this.storage = StorageOptions.getDefaultInstance().getService();
        this.bucketName = bucketName;
    }

    @Override
    public void init() {
        // No init needed for GCS usually, handled by client lib
    }

    @Override
    public String store(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Use UUID for unique filename to prevent overwrites
        String fileName = UUID.randomUUID().toString() + extension;

        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        // Upload to GCS
        // Note: This relies on Application Default Credentials (gcloud auth
        // application-default login)
        storage.create(blobInfo, file.getBytes());

        // Return the Public URL
        return String.format("https://storage.googleapis.com/%s/%s", bucketName, fileName);
    }
}
