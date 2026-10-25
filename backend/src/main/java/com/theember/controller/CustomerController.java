package com.theember.controller;

import com.theember.dto.UserProfileUpdateRequest;
import com.theember.entity.Address;
import com.theember.entity.User;
import com.theember.security.UserDetailsImpl;
import com.theember.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new SecurityException("User not authenticated");
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Long userId = getAuthenticatedUserId();
        User user = customerService.getProfile(userId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("fullName", user.getFullName());
        resp.put("email", user.getEmail());
        resp.put("phoneNumber", user.getPhoneNumber());
        resp.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
        Long userId = getAuthenticatedUserId();
        User user = customerService.updateProfile(userId, request);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "fullName", user.getFullName(), "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : ""));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<Address>> getAddresses() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(customerService.getAddresses(userId));
    }

    @PostMapping("/addresses")
    public ResponseEntity<Address> addAddress(@RequestBody Address address) {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(customerService.addAddress(userId, address));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        try {
            customerService.deleteAddress(userId, id);
            return ResponseEntity.ok(Map.of("message", "Address deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
