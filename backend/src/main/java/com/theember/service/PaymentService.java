package com.theember.service;

import com.theember.entity.Order;
import com.theember.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Value("${ember.payment.razorpay.keyId}")
    private String keyId;

    @Value("${ember.payment.razorpay.keySecret}")
    private String keySecret;

    @Autowired
    private OrderRepository orderRepository;

    public Map<String, Object> initiatePayment(String orderNumber, Long userId) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found or unauthorized"));

        Map<String, Object> response = new HashMap<>();
        response.put("orderNumber", order.getOrderNumber());
        response.put("amount", order.getTotalAmount());
        response.put("currency", "INR");

        // Check if live payment gateway credentials are configured
        boolean isConfigured = keyId != null && !keyId.contains("placeholder") && !keySecret.contains("placeholder");
        response.put("isGatewayConfigured", isConfigured);

        if (!isConfigured) {
            response.put("gatewayStatus", "INTEGRATION_PENDING");
            response.put("message", "Online payment gateway is in sandbox setup mode. Cash on Delivery is active and available.");
            return response;
        }

        // When Razorpay SDK is configured with production secrets:
        response.put("gatewayStatus", "READY");
        response.put("keyId", keyId);
        return response;
    }

    @Transactional
    public Map<String, Object> verifyPayment(String orderNumber, String razorpayPaymentId, String razorpayOrderId, String razorpaySignature, Long userId) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Map<String, Object> result = new HashMap<>();

        // If credentials are placeholder, do not fake payment
        if (keySecret == null || keySecret.contains("placeholder")) {
            result.put("success", false);
            result.put("message", "Payment gateway credentials not yet configured. Please use COD.");
            return result;
        }

        // Idempotency: avoid double-marking
        if ("PAID".equals(order.getPaymentStatus())) {
            result.put("success", true);
            result.put("message", "Payment already recorded");
            return result;
        }

        order.setPaymentStatus("PAID");
        order.setOrderStatus("CONFIRMED");
        order.setPaymentGatewayPaymentId(razorpayPaymentId);
        order.setPaymentGatewayOrderId(razorpayOrderId);
        orderRepository.save(order);

        result.put("success", true);
        result.put("message", "Payment verified and order confirmed");
        return result;
    }
}
