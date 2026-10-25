package com.theember.service;

import com.theember.dto.OrderCreateRequest;
import com.theember.dto.OrderItemRequest;
import com.theember.dto.StatusUpdateRequest;
import com.theember.entity.*;
import com.theember.repository.MenuItemRepository;
import com.theember.repository.OfferRepository;
import com.theember.repository.OrderRepository;
import com.theember.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    public Order createOrder(Long userId, OrderCreateRequest request) {
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

        return orderRepository.save(order);
    }

    public List<Order> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Order getCustomerOrder(String orderNumber, Long userId) {
        return orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found or unauthorized"));
    }

    public Page<Order> getAllOrdersForAdmin(String status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepository.filterOrders(status, (search != null && !search.isBlank()) ? search.trim() : null, pageable);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));
    }

    @Transactional
    public Order updateOrderStatus(Long id, StatusUpdateRequest request) {
        Order order = getOrderById(id);
        String currentStatus = order.getOrderStatus();
        String newStatus = request.getOrderStatus().toUpperCase();

        // Enforce valid state transitions
        if ("DELIVERED".equals(currentStatus) && "CANCELLED".equals(newStatus)) {
            throw new IllegalStateException("Delivered orders cannot be cancelled.");
        }
        if ("CANCELLED".equals(currentStatus) && !"CANCELLED".equals(newStatus)) {
            throw new IllegalStateException("Cancelled orders cannot be reopened.");
        }

        order.setOrderStatus(newStatus);
        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            order.setPaymentStatus(request.getPaymentStatus().toUpperCase());
        } else if ("DELIVERED".equals(newStatus) && "COD".equals(order.getPaymentMethod())) {
            // Once COD order is delivered, payment is marked collected
            order.setPaymentStatus("PAID");
        }

        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelCustomerOrder(String orderNumber, Long userId) {
        Order order = getCustomerOrder(orderNumber, userId);
        if ("PREPARING".equals(order.getOrderStatus()) || "OUT_FOR_DELIVERY".equals(order.getOrderStatus()) || "DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalStateException("Order cannot be cancelled once preparation has begun. Please contact restaurant directly.");
        }

        order.setOrderStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }
}
