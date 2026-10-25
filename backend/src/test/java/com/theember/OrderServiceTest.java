package com.theember;

import com.theember.dto.OrderCreateRequest;
import com.theember.dto.OrderItemRequest;
import com.theember.entity.MenuItem;
import com.theember.entity.Order;
import com.theember.entity.User;
import com.theember.repository.MenuItemRepository;
import com.theember.repository.UserRepository;
import com.theember.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class OrderServiceTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Test
    void testOrderCreationRecalculatesPriceFromDatabase() {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        MenuItem dish = menuItemRepository.findBySlug("butter-chicken").orElseThrow();

        OrderCreateRequest req = new OrderCreateRequest();
        req.setCustomerName("Test Customer");
        req.setCustomerPhone("+91 99999 88888");
        req.setDeliveryAddress("123 Gourmet Lane, Food City");
        req.setPaymentMethod("COD");

        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(dish.getId());
        item.setQuantity(2);
        req.setItems(List.of(item));

        Order order = orderService.createOrder(user.getId(), req);

        assertNotNull(order.getOrderNumber());
        assertEquals("PLACED", order.getOrderStatus());
        assertEquals("PENDING", order.getPaymentStatus());
        // 2 * 349.00 = 698.00 (Free delivery over 499)
        assertEquals(BigDecimal.valueOf(698.00).setScale(2), order.getSubtotal().setScale(2));
        assertEquals(BigDecimal.valueOf(698.00).setScale(2), order.getTotalAmount().setScale(2));
    }

    @Test
    void testOrderFailsWhenItemIsUnavailable() {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        MenuItem dish = menuItemRepository.findBySlug("butter-chicken").orElseThrow();
        dish.setIsAvailable(false);
        menuItemRepository.save(dish);

        OrderCreateRequest req = new OrderCreateRequest();
        req.setCustomerName("Test Customer");
        req.setCustomerPhone("+91 99999 88888");
        req.setDeliveryAddress("123 Gourmet Lane, Food City");
        req.setPaymentMethod("COD");

        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(dish.getId());
        item.setQuantity(1);
        req.setItems(List.of(item));

        assertThrows(IllegalStateException.class, () -> {
            orderService.createOrder(user.getId(), req);
        });
    }
}
