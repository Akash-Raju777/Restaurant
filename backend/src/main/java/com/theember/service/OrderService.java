package com.theember.service;

import com.theember.dto.OrderCreateRequest;
import com.theember.dto.OrderItemRequest;
import com.theember.dto.OrderResponse;
import com.theember.dto.StatusUpdateRequest;
import com.theember.entity.*;
import com.theember.repository.MenuItemRepository;
import com.theember.repository.OfferRepository;
import com.theember.repository.OrderRepository;
import com.theember.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OfferService offerService;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public OrderResponse createOrder(Long userId, OrderCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one food item.");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setDeliveryNotes(request.getDeliveryNotes());
        order.setPaymentMethod(request.getPaymentMethod().toUpperCase());
        order.setPaymentStatus("PENDING");
        order.setOrderStatus("PLACED");

        // Generate unique order number (e.g. ORD12389)
        String orderNumber = "ORD" + (10000 + random.nextInt(90000));
        order.setOrderNumber(orderNumber);

        // Fetch each item from the database to recalculate prices & verify availability
        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem dish = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemReq.getMenuItemId()));

            if (!dish.getIsAvailable()) {
                throw new IllegalStateException("Sorry, '" + dish.getName() + "' is currently unavailable.");
            }

            BigDecimal unitPrice = dish.getDiscountedPrice() != null ? dish.getDiscountedPrice() : dish.getPrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(dish);
            orderItem.setItemName(dish.getName());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setSubtotal(itemTotal);
            orderItem.setCustomizationNotes(itemReq.getCustomizationNotes());

            orderItems.add(orderItem);
        }

        order.setSubtotal(subtotal);

        // Coupon / Offer processing
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            var offerOpt = offerRepository.findByCodeIgnoreCase(request.getCouponCode().trim());
            if (offerOpt.isPresent()) {
                discount = offerService.calculateDiscount(offerOpt.get(), subtotal);
            }
        }
        order.setDiscountAmount(discount);

        // Free delivery above ₹499, otherwise standard ₹40
        BigDecimal deliveryFee = subtotal.compareTo(BigDecimal.valueOf(499)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(40.00);
        order.setDeliveryFee(deliveryFee);

        BigDecimal total = subtotal.subtract(discount).add(deliveryFee);
        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;
        order.setTotalAmount(total);

        order.setItems(orderItems);

        // Ensure the order is flushed to the database so that subsequent reads (e.g., admin queries) see the new record immediately
        Order saved = orderRepository.saveAndFlush(order);
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getCustomerOrder(String orderNumber, Long userId) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found or unauthorized"));
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrdersForAdmin(String status, String search, int page, int size) {
        // Normalize blank parameters to null to allow repository query to return all records when filters are omitted
        if (status != null && status.isBlank()) {
            status = null;
        }
        if (search != null && search.isBlank()) {
            search = null;
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.filterOrders(
                status,
                search != null ? search.trim() : null,
                pageable);

        // Eagerly resolve items for each order within the transaction to avoid lazy load issues
        List<OrderResponse> responseDTOs = orderPage.getContent().stream()
                .map(o -> {
                    // Access the items collection inside the transaction to force initialization
                    o.getItems().size();
                    return OrderResponse.from(o);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(responseDTOs, pageable, orderPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));
        // Force-initialize items within transaction
        order.getItems().size();
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, StatusUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));

        String currentStatus = order.getOrderStatus();
        String newStatus = (request.getOrderStatus() != null && !request.getOrderStatus().isBlank())
                ? request.getOrderStatus().trim().toUpperCase()
                : currentStatus;

        // Enforce valid state transitions only if status is changing
        if (!currentStatus.equals(newStatus)) {
            if ("DELIVERED".equals(currentStatus) && "CANCELLED".equals(newStatus)) {
                throw new IllegalStateException("Delivered orders cannot be cancelled.");
            }
            if ("CANCELLED".equals(currentStatus) && !"CANCELLED".equals(newStatus)) {
                throw new IllegalStateException("Cancelled orders cannot be reopened.");
            }
            order.setOrderStatus(newStatus);
        }

        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            String requestedPaymentStatus = request.getPaymentStatus().trim().toUpperCase();
            boolean isUpi = "ONLINE_UPI".equals(order.getPaymentMethod()) || "UPI".equals(order.getPaymentMethod());
            boolean hasVerifiedGatewayPayment = order.getPaymentGatewayPaymentId() != null
                    && !order.getPaymentGatewayPaymentId().isBlank();
            if ("PAID".equals(requestedPaymentStatus)
                    && !"PAID".equals(order.getPaymentStatus())
                    && isUpi
                    && !hasVerifiedGatewayPayment) {
                throw new IllegalStateException("UPI payments can only be marked PAID after gateway verification.");
            }
            order.setPaymentStatus(requestedPaymentStatus);
        } else if ("DELIVERED".equals(newStatus) && "COD".equals(order.getPaymentMethod())) {
            // Once COD order is delivered, payment is marked collected
            order.setPaymentStatus("PAID");
        }

        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        saved.getItems().size(); // force init
        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse cancelCustomerOrder(String orderNumber, Long userId) {
        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found or unauthorized"));

        if ("PREPARING".equals(order.getOrderStatus()) || "OUT_FOR_DELIVERY".equals(order.getOrderStatus()) || "DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalStateException("Order cannot be cancelled once preparation has begun. Please contact restaurant directly.");
        }

        order.setOrderStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        saved.getItems().size(); // force init
        return OrderResponse.from(saved);
    }
}
