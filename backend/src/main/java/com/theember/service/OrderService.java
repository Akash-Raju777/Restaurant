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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final LocalDateTime ALL_ORDERS_FROM = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final LocalDateTime ALL_ORDERS_TO = LocalDateTime.of(3000, 1, 1, 0, 0);

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

    @Autowired
    private OrderReportRangeResolver orderReportRangeResolver;

    @Autowired
    private OrderExcelExportService orderExcelExportService;

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
        Map<Long, Integer> cartQuantities = new HashMap<>();

        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setDeliveryNotes(request.getDeliveryNotes());
        order.setPaymentMethod(request.getPaymentMethod().toUpperCase());
        order.setPaymentStatus("PENDING");
        order.setOrderStatus("PLACED");

        // Generate unique order number (e.g. ORD202610311430220001)
        // Timestamp-based with a random suffix to guarantee uniqueness across
        // rapid consecutive orders placed by the same or different customers.
        String orderNumber = null;
        boolean unique = false;
        for (int attempt = 0; attempt < 10 && !unique; attempt++) {
            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
            String suffix = String.format("%04d", random.nextInt(10000));
            orderNumber = "ORD" + timestamp + suffix;
            if (!orderRepository.existsByOrderNumber(orderNumber)) {
                unique = true;
            }
        }
        if (!unique) {
            throw new IllegalStateException("Unable to generate a unique order number. Please try again.");
        }
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
            cartQuantities.merge(dish.getId(), itemReq.getQuantity(), Integer::sum);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(dish);
            orderItem.setItemName(dish.getName());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setSubtotal(itemTotal);
            orderItem.setCustomizationNotes(itemReq.getCustomizationNotes());
            orderItem.setIsFreeItem(false);

            orderItems.add(orderItem);
        }

        order.setSubtotal(subtotal);

        // Coupon / Offer processing. The backend is the source of truth for eligibility and pricing.
        BigDecimal discount = BigDecimal.ZERO;
        OfferService.OfferEvaluation evaluation = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            evaluation = offerService.evaluateOffer(
                    request.getCouponCode(),
                    userId,
                    cartQuantities,
                    subtotal,
                    true
            );
            discount = evaluation.getDiscountAmount();
            order.setCouponCode(evaluation.getOffer().getCode());
            order.setAppliedOfferId(evaluation.getOffer().getId());
            order.setAppliedOfferTitle(evaluation.getOffer().getTitle());
        }
        order.setDiscountAmount(discount);

        // Add complimentary offer items as explicit zero-priced order lines.
        if (evaluation != null) {
            for (OfferItem offerItem : evaluation.getFreeItems()) {
                MenuItem freeDish = offerItem.getMenuItem();
                if (freeDish == null || Boolean.FALSE.equals(freeDish.getIsAvailable())) {
                    throw new IllegalStateException("A complimentary item in this offer is currently unavailable.");
                }
                OrderItem freeOrderItem = new OrderItem();
                freeOrderItem.setOrder(order);
                freeOrderItem.setMenuItem(freeDish);
                freeOrderItem.setItemName(freeDish.getName());
                freeOrderItem.setUnitPrice(BigDecimal.ZERO.setScale(2));
                freeOrderItem.setQuantity(offerItem.getQuantity() != null ? offerItem.getQuantity() : 1);
                freeOrderItem.setSubtotal(BigDecimal.ZERO.setScale(2));
                freeOrderItem.setCustomizationNotes("Complimentary with " + evaluation.getOffer().getTitle());
                freeOrderItem.setIsFreeItem(true);
                orderItems.add(freeOrderItem);
            }
            Offer usedOffer = evaluation.getOffer();
            usedOffer.setTimesUsed((usedOffer.getTimesUsed() == null ? 0 : usedOffer.getTimesUsed()) + 1);
            offerRepository.save(usedOffer);
        }

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
    public Page<OrderResponse> getAllOrdersForAdmin(
            String status,
            String search,
            String paymentMethod,
            String paymentStatus,
            LocalDate startDate,
            LocalDate endDate,
            Integer month,
            Integer year,
            int page,
            int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative.");
        }
        if (size < 1 || size > 200) {
            throw new IllegalArgumentException("Page size must be between 1 and 200.");
        }

        OrderReportRange range = orderReportRangeResolver.resolve(startDate, endDate, month, year);
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orderPage = orderRepository.filterOrders(
                normalizeUpper(status),
                normalizePaymentMethod(paymentMethod),
                normalizeUpper(paymentStatus),
                normalizeText(search),
                queryFrom(range),
                queryTo(range),
                pageable);

        List<Order> orders = orderPage.getContent();
        Map<Long, Order> ordersWithItems = loadOrdersWithItems(orders);
        List<OrderResponse> responseDTOs = orders.stream()
                .map(order -> OrderResponse.from(ordersWithItems.getOrDefault(order.getId(), order)))
                .collect(Collectors.toList());

        return new PageImpl<>(responseDTOs, pageable, orderPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OrderExportFile exportAllOrders() {
        OrderReportRange range = orderReportRangeResolver.all();
        return exportOrders(range, "TheEmber_All_Orders_" + orderReportRangeResolver.today() + ".xlsx");
    }

    @Transactional(readOnly = true)
    public OrderExportFile exportOrdersByDateRange(LocalDate startDate, LocalDate endDate) {
        OrderReportRange range = orderReportRangeResolver.dateRange(startDate, endDate);
        String filename = "TheEmber_Orders_" + startDate + "_to_" + endDate + ".xlsx";
        return exportOrders(range, filename);
    }

    @Transactional(readOnly = true)
    public OrderExportFile exportOrdersByMonth(Integer month, Integer year) {
        OrderReportRange range = orderReportRangeResolver.monthRange(month, year);
        String monthName = range.startDate().format(DateTimeFormatter.ofPattern("MMMM_yyyy", Locale.ENGLISH));
        return exportOrders(range, "TheEmber_Orders_" + monthName + ".xlsx");
    }

    private OrderExportFile exportOrders(OrderReportRange range, String filename) {
        List<Order> orders = orderRepository.findOrdersForExport(queryFrom(range), queryTo(range));
        byte[] content = orderExcelExportService.createWorkbook(orders, range);
        return new OrderExportFile(content, filename);
    }

    private LocalDateTime queryFrom(OrderReportRange range) {
        return range.fromInclusive() != null ? range.fromInclusive() : ALL_ORDERS_FROM;
    }

    private LocalDateTime queryTo(OrderReportRange range) {
        return range.toExclusive() != null ? range.toExclusive() : ALL_ORDERS_TO;
    }

    private Map<Long, Order> loadOrdersWithItems(List<Order> orders) {
        Collection<Long> orderIds = orders.stream()
                .map(Order::getId)
                .toList();
        if (orderIds.isEmpty()) {
            return Map.of();
        }
        return orderRepository.findWithItemsByIds(orderIds).stream()
                .collect(Collectors.toMap(Order::getId, Function.identity(), (first, second) -> first));
    }

    private String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeUpper(String value) {
        String normalized = normalizeText(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.ENGLISH);
    }

    private String normalizePaymentMethod(String value) {
        String normalized = normalizeUpper(value);
        return "UPI".equals(normalized) ? "ONLINE_UPI" : normalized;
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
