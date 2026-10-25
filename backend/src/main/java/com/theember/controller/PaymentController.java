package com.theember.controller;

import com.theember.security.UserDetailsImpl;
import com.theember.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new SecurityException("User not authenticated");
    }

    @PostMapping("/initiate/{orderNumber}")
    public ResponseEntity<?> initiatePayment(@PathVariable String orderNumber) {
        try {
            Long userId = getAuthenticatedUserId();
            Map<String, Object> result = paymentService.initiatePayment(orderNumber, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify/{orderNumber}")
    public ResponseEntity<?> verifyPayment(
            @PathVariable String orderNumber,
            @RequestBody Map<String, String> payload) {
        try {
            Long userId = getAuthenticatedUserId();
            String paymentId = payload.get("razorpay_payment_id");
            String orderId = payload.get("razorpay_order_id");
            String signature = payload.get("razorpay_signature");

            Map<String, Object> result = paymentService.verifyPayment(orderNumber, paymentId, orderId, signature, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
