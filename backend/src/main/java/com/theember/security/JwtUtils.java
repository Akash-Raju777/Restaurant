package com.theember.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${ember.app.jwtSecret:}")
    private String jwtSecret;

    @Value("${ember.app.jwtExpirationMs:86400000}")
    private int jwtExpirationMs;

    @PostConstruct
    public void validateConfiguration() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            logger.error("CRITICAL SECURITY NOTICE: 'JWT_SECRET' is not configured. JWT signing will be disabled until configured.");
        } else {
            try {
                byte[] decoded = Decoders.BASE64.decode(jwtSecret.trim());
                if (decoded.length < 32) {
                    logger.warn("SECURITY WARNING: JWT_SECRET decoded length is {} bytes. For HS256 security, at least 32 bytes (256 bits) is required.", decoded.length);
                }
            } catch (Exception e) {
                logger.error("SECURITY WARNING: JWT_SECRET could not be decoded as Base64: {}", e.getMessage());
            }
        }
    }

    private SecretKey key() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT signing secret is not configured. Please supply a valid JWT_SECRET environment variable.");
        }
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret.trim()));
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("id", userPrincipal.getId())
                .claim("role", userPrincipal.getAuthorities().iterator().next().getAuthority())
                .claim("fullName", userPrincipal.getFullName())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        } catch (IllegalStateException e) {
            logger.error("JWT verification failed due to missing configuration: {}", e.getMessage());
        }
        return false;
    }
}
