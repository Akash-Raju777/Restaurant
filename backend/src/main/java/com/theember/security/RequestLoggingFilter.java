package com.theember.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs incoming API requests for authentication debugging.
 * Logs method, path, and whether an Authorization header is present (never the token value).
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String authHeader = request.getHeader("Authorization");
        boolean hasAuth = authHeader != null && authHeader.startsWith("Bearer ");

        if (path.startsWith("/api/")) {
            logger.info("API_REQUEST method={} path={} hasAuthHeader={}", method, path, hasAuth);
        }

        filterChain.doFilter(request, response);
    }
}
