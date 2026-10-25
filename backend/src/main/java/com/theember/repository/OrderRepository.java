package com.theember.repository;

import com.theember.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByUserIdAndOrderStatusOrderByCreatedAtDesc(Long userId, String orderStatus);
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.orderStatus = :status) AND " +
           "(:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR o.customerPhone LIKE CONCAT('%', :search, '%'))")
    Page<Order> filterOrders(
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    long countByOrderStatus(String orderStatus);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startOfDay")
    long countOrdersToday(@Param("startOfDay") LocalDateTime startOfDay);

    // Verified revenue: only count orders where payment is PAID or (COD and DELIVERED)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.paymentStatus = 'PAID' OR (o.paymentMethod = 'COD' AND o.orderStatus = 'DELIVERED')")
    BigDecimal calculateVerifiedRevenue();
}
