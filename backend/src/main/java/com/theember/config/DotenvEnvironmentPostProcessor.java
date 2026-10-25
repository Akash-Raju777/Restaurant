package com.theember.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads configuration properties from a local .env file when present.
 *
 * Property priority (highest to lowest):
 *   1. OS environment variables / JVM system properties
 *   2. .env file values (this processor)
 *   3. application.yml placeholder defaults
 *
 * Only variables NOT already set in OS/JVM environment will be loaded from .env.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    private static final Logger logger = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Search relative to CWD (mvn spring-boot:run runs from backend/)
        String[] candidatePaths = {
                "../.env",   // Correct relative path when CWD is backend/
                ".env",      // Fallback if CWD is project root
        };

        File envFile = null;
        for (String path : candidatePaths) {
            File candidate = new File(path).getAbsoluteFile();
            if (candidate.exists() && candidate.isFile()) {
                envFile = candidate;
                break;
            }
        }

        if (envFile == null) {
            return; // No .env file found — rely on OS environment variables
        }

        Map<String, Object> envMap = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eqIdx = line.indexOf('=');
                if (eqIdx <= 0) {
                    continue;
                }
                String key = line.substring(0, eqIdx).trim();
                String val = line.substring(eqIdx + 1).trim();
                // Strip surrounding quotes if present
                if (val.length() >= 2) {
                    char first = val.charAt(0);
                    char last = val.charAt(val.length() - 1);
                    if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                        val = val.substring(1, val.length() - 1);
                    }
                }
                // Only add if not already overridden by OS environment variable
                if (!environment.containsProperty(key) || environment.getProperty(key, "").isEmpty()) {
                    envMap.put(key, val);
                }
            }
        } catch (IOException e) {
            logger.warn("Could not read local .env file at {}: {}", envFile.getAbsolutePath(), e.getMessage());
            return;
        }

        if (!envMap.isEmpty()) {
            // Add after system env so OS env variables still take precedence
            MapPropertySource dotenvSource = new MapPropertySource("theEmberDotenvProperties", envMap);
            if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
                environment.getPropertySources().addAfter(
                        StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                        dotenvSource
                );
            } else {
                environment.getPropertySources().addFirst(dotenvSource);
            }
            logger.info("[Ember] Loaded {} properties from local .env file: {}", envMap.size(), envFile.getName());
        }
    }

    @Override
    public int getOrder() {
        // Run before ConfigDataEnvironmentPostProcessor (HIGHEST_PRECEDENCE + 10)
        // so that placeholders in application.yml resolve against .env values
        return Ordered.HIGHEST_PRECEDENCE + 5;
    }
}
