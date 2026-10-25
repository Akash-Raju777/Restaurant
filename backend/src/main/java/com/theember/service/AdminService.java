package com.theember.service;

import com.theember.entity.AuditLog;
import com.theember.entity.User;
import com.theember.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalOrders = orderRepository.count();
        long ordersToday = orderRepository.countOrdersToday(LocalDate.now().atStartOfDay());
        long pendingOrders = orderRepository.countByOrderStatus("PLACED") +
                orderRepository.countByOrderStatus("CONFIRMED") +
                orderRepository.countByOrderStatus("PREPARING") +
                orderRepository.countByOrderStatus("OUT_FOR_DELIVERY");
        long completedOrders = orderRepository.countByOrderStatus("DELIVERED");
        long cancelledOrders = orderRepository.countByOrderStatus("CANCELLED");

        BigDecimal totalRevenue = orderRepository.calculateVerifiedRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        long activeMenuItems = menuItemRepository.countByIsAvailableTrue();
        long activeOffers = offerRepository.countByIsActiveTrue();
        long registeredCustomers = userRepository.countByRole("ROLE_CUSTOMER");

        stats.put("totalOrders", totalOrders);
        stats.put("ordersToday", ordersToday);
        stats.put("pendingOrders", pendingOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("totalRevenue", totalRevenue);
        stats.put("activeMenuItems", activeMenuItems);
        stats.put("activeOffers", activeOffers);
        stats.put("registeredCustomers", registeredCustomers);

        return stats;
    }

    public Page<User> getCustomers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional
    public User toggleCustomerStatus(Long customerId, boolean isActive) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        if ("ROLE_ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Cannot deactivate administrator accounts directly.");
        }

        user.setIsActive(isActive);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public void recordAudit(Long userId, String action, String details, String ip) {
        AuditLog log = new AuditLog(userId, action, details, ip);
        auditLogRepository.save(log);
    }
}
