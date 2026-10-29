package com.theember.controller;

import com.theember.dto.OrderCreateRequest;
import com.theember.dto.OrderResponse;
import com.theember.security.UserDetailsImpl;
import com.theember.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        throw new SecurityException("User not authenticated");
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderCreateRequest request) {
        try {
            Long userId = getAuthenticatedUserId();
            OrderResponse order = orderService.createOrder(userId, request);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        Long userId = getAuthenticatedUserId();
        return ResponseEntity.ok(orderService.getCustomerOrders(userId));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<?> getOrderDetails(@PathVariable String orderNumber) {
        try {
            Long userId = getAuthenticatedUserId();
            OrderResponse order = orderService.getCustomerOrder(orderNumber, userId);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderNumber) {
        try {
            Long userId = getAuthenticatedUserId();
            OrderResponse order = orderService.cancelCustomerOrder(orderNumber, userId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
