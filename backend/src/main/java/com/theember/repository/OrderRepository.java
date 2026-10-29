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

    // Customer: fetch orders with items eagerly using JOIN FETCH to avoid LazyInitializationException
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    List<Order> findByUserIdAndOrderStatusOrderByCreatedAtDesc(Long userId, String orderStatus);

    // Fetch single order with items eagerly
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumber(@Param("orderNumber") String orderNumber);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber AND o.user.id = :userId")
    Optional<Order> findByOrderNumberAndUserId(@Param("orderNumber") String orderNumber, @Param("userId") Long userId);

    // Admin paginated query — uses native SQL with explicit ::text casts to avoid
    // PostgreSQL "function lower(bytea) does not exist" error when parameters are null.
    @Query(
        value = "SELECT * FROM orders o WHERE " +
                "(:status IS NULL OR o.order_status = :status) AND " +
                "(:search IS NULL OR LOWER(o.order_number) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(o.customer_name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR o.customer_phone LIKE CONCAT('%', :search, '%')) " +
                "ORDER BY o.created_at DESC",
        countQuery = "SELECT COUNT(*) FROM orders o WHERE " +
                "(:status IS NULL OR o.order_status = :status) AND " +
                "(:search IS NULL OR LOWER(o.order_number) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(o.customer_name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR o.customer_phone LIKE CONCAT('%', :search, '%'))",
        nativeQuery = true
    )
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
