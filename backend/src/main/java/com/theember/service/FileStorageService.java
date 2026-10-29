package com.theember.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    @Value("${ember.upload.dir:uploads}")
    private String uploadDir;

    public String storeMenuImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose an image file.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image must be 5 MB or smaller.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = StringUtils.getFilenameExtension(originalName);
        extension = extension != null ? extension.toLowerCase(Locale.ROOT) : "";

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Supported image formats: JPG, PNG, WEBP, GIF.");
        }

        try {
            Path menuDirectory = Paths.get(uploadDir, "menu").toAbsolutePath().normalize();
            Files.createDirectories(menuDirectory);

            String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
            Path target = menuDirectory.resolve(filename).normalize();
            if (!target.startsWith(menuDirectory)) {
                throw new IllegalArgumentException("Invalid image file name.");
            }

            file.transferTo(target.toFile());
            return "/uploads/menu/" + filename;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store image. Please try again.", exception);
        }
    }
}
