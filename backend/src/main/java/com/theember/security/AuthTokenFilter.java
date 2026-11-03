package com.theember.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String jwt = parseJwt(request);

        if (jwt == null) {
            logger.debug("AUTH_FILTER path={} no Authorization Bearer token found", path);
            filterChain.doFilter(request, response);
            return;
        }

        logger.debug("AUTH_FILTER path={} Bearer token present, validating...", path);

        try {
            if (!jwtUtils.validateJwtToken(jwt)) {
                logger.warn("AUTH_FILTER path={} JWT validation failed (expired, malformed, or bad signature)",
                        path);
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            String username = jwtUtils.getUserNameFromJwtToken(jwt);
            logger.debug("AUTH_FILTER path={} JWT valid, subject={}", path, username);

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            logger.debug("AUTH_FILTER path={} user loaded: {} authorities={}",
                    path, userDetails.getUsername(), userDetails.getAuthorities());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.debug("AUTH_FILTER path={} authentication set for {}", path, username);

        } catch (Exception e) {
            logger.error("AUTH_FILTER path={} Cannot set user authentication: {}",
                    path, e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
