package com.theember;

import com.theember.dto.OrderCreateRequest;
import com.theember.dto.OrderItemRequest;
import com.theember.entity.MenuItem;
import com.theember.dto.OrderResponse;
import com.theember.dto.StatusUpdateRequest;
import com.theember.entity.Offer;
import com.theember.entity.OfferItem;
import com.theember.entity.Order;
import com.theember.entity.OrderItem;
import com.theember.entity.User;
import com.theember.repository.MenuItemRepository;
import com.theember.repository.OfferRepository;
import com.theember.repository.OrderRepository;
import com.theember.repository.UserRepository;
import com.theember.service.OrderExportFile;
import com.theember.service.OrderService;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void testComboOfferAddsFreeItemAndBackendCalculatesDiscount() {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        MenuItem requiredDish = menuItemRepository.findBySlug("butter-chicken").orElseThrow();
        MenuItem freeDish = menuItemRepository.findBySlug("garlic-naan").orElseThrow();
        createComboOffer("TESTCOMBO", requiredDish, freeDish, 100, 1);

        OrderCreateRequest req = new OrderCreateRequest();
        req.setCustomerName("Test Customer");
        req.setCustomerPhone("+91 99999 88888");
        req.setDeliveryAddress("123 Gourmet Lane, Food City");
        req.setPaymentMethod("COD");
        req.setCouponCode("TESTCOMBO");

        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(requiredDish.getId());
        item.setQuantity(1);
        req.setItems(List.of(item));

        OrderResponse response = orderService.createOrder(user.getId(), req);

        assertEquals(BigDecimal.valueOf(349.00).setScale(2), response.getSubtotal().setScale(2));
        assertEquals(BigDecimal.valueOf(100.00).setScale(2), response.getDiscountAmount().setScale(2));
        assertEquals(BigDecimal.valueOf(40.00).setScale(2), response.getDeliveryFee().setScale(2));
        assertEquals(BigDecimal.valueOf(289.00).setScale(2), response.getTotalAmount().setScale(2));
        assertEquals("TESTCOMBO", response.getCouponCode());
        assertEquals(2, response.getItems().size());
        assertTrue(response.getItems().stream().anyMatch(i ->
                Boolean.TRUE.equals(i.getIsFreeItem())
                        && "Garlic Naan".equals(i.getItemName())
                        && BigDecimal.ZERO.setScale(2).equals(i.getSubtotal().setScale(2))));
    }

    @Test
    void testComboOfferRequiresAllSelectedProducts() {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        MenuItem requiredDish = menuItemRepository.findBySlug("butter-chicken").orElseThrow();
        MenuItem freeDish = menuItemRepository.findBySlug("garlic-naan").orElseThrow();
        createComboOffer("REQUIREDCOMBO", requiredDish, freeDish, 100, 2);

        OrderCreateRequest req = new OrderCreateRequest();
        req.setCustomerName("Test Customer");
        req.setCustomerPhone("+91 99999 88888");
        req.setDeliveryAddress("123 Gourmet Lane, Food City");
        req.setPaymentMethod("COD");
        req.setCouponCode("REQUIREDCOMBO");

        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(menuItemRepository.findBySlug("veg-biryani").orElseThrow().getId());
        item.setQuantity(1);
        req.setItems(List.of(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(user.getId(), req));
        assertTrue(exception.getMessage().contains("Add 2 x Butter Chicken"));
    }

    @Test
    void testDateRangeFilterAndExcelExportUseOnlyMatchingOrders() throws Exception {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        Order matching = createPersistedOrder(user, LocalDateTime.of(2099, 5, 15, 12, 30),
                new BigDecimal("349.00"));
        createPersistedOrder(user, LocalDateTime.of(2099, 5, 16, 12, 30), new BigDecimal("199.00"));

        Page<OrderResponse> page = orderService.getAllOrdersForAdmin(
                null, null, null, null,
                LocalDate.of(2099, 5, 15), LocalDate.of(2099, 5, 15), null, null,
                0, 20);

        assertEquals(1, page.getTotalElements());
        assertEquals(matching.getOrderNumber(), page.getContent().get(0).getOrderNumber());

        OrderExportFile file = orderService.exportOrdersByDateRange(
                LocalDate.of(2099, 5, 15), LocalDate.of(2099, 5, 15));

        assertTrue(file.filename().endsWith(".xlsx"));
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.content()))) {
            var ordersSheet = workbook.getSheet("Orders");
            var itemsSheet = workbook.getSheet("Order Items");
            assertNotNull(ordersSheet);
            assertNotNull(itemsSheet);
            assertEquals("Order ID", ordersSheet.getRow(12).getCell(0).getStringCellValue());
            assertEquals("Order Status", ordersSheet.getRow(12).getCell(17).getStringCellValue());
            assertEquals(1.0, ordersSheet.getRow(6).getCell(0).getNumericCellValue());
            assertEquals(389.0, ordersSheet.getRow(6).getCell(4).getNumericCellValue());
            assertEquals(matching.getOrderNumber(), ordersSheet.getRow(13).getCell(0).getStringCellValue());
            assertNull(ordersSheet.getRow(14));
            assertEquals(matching.getOrderNumber(), itemsSheet.getRow(4).getCell(0).getStringCellValue());
            assertEquals("Butter Chicken", itemsSheet.getRow(4).getCell(5).getStringCellValue());
        }
    }

    @Test
    void testMonthExportIncludesLastDayAndExcludesNextMonth() throws Exception {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        Order lastDayOfMay = createPersistedOrder(user, LocalDateTime.of(2099, 5, 31, 23, 59),
                new BigDecimal("100.00"));
        createPersistedOrder(user, LocalDateTime.of(2099, 6, 1, 0, 0), new BigDecimal("100.00"));

        OrderExportFile file = orderService.exportOrdersByMonth(5, 2099);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.content()))) {
            var sheet = workbook.getSheet("Orders");
            assertEquals(1.0, sheet.getRow(6).getCell(0).getNumericCellValue());
            assertEquals(lastDayOfMay.getOrderNumber(), sheet.getRow(13).getCell(0).getStringCellValue());
            assertNull(sheet.getRow(14));
        }
    }

    @Test
    void testInvalidReportDateRangeIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> orderService.exportOrdersByDateRange(
                LocalDate.of(2099, 5, 16), LocalDate.of(2099, 5, 15)));
        assertThrows(IllegalArgumentException.class, () -> orderService.exportOrdersByMonth(13, 2099));
    }

    private Order createPersistedOrder(User user, LocalDateTime createdAt, BigDecimal amount) {
        Order order = new Order();
        order.setOrderNumber("TEST" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        order.setUser(user);
        order.setCustomerName(user.getFullName());
        order.setCustomerPhone("9999988888");
        order.setDeliveryAddress("123 Report Test Lane");
        order.setSubtotal(amount);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setDeliveryFee(new BigDecimal("40.00"));
        order.setTotalAmount(amount.add(new BigDecimal("40.00")));
        order.setPaymentMethod("COD");
        order.setPaymentStatus("PENDING");
        order.setOrderStatus("PLACED");
        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setItemName("Butter Chicken");
        item.setUnitPrice(amount);
        item.setQuantity(1);
        item.setSubtotal(amount);
        item.setIsFreeItem(false);
        order.getItems().add(item);

        return orderRepository.saveAndFlush(order);
    }

    private void createComboOffer(String code, MenuItem requiredDish, MenuItem freeDish,
                                  int discount, int requiredQuantity) {
        Offer offer = new Offer();
        offer.setTitle(code + " Combo");
        offer.setDescription("Test combo");
        offer.setCode(code);
        offer.setDiscountType("COMBO");
        offer.setDiscountValue(BigDecimal.valueOf(discount));
        offer.setMinOrderAmount(BigDecimal.ZERO);
        offer.setStartDate(LocalDateTime.now().minusDays(1));
        offer.setExpiryDate(LocalDateTime.now().plusDays(30));
        offer.setIsActive(true);
        offer.setTimesUsed(0);
        offer.setPerUserLimit(10);

        OfferItem required = new OfferItem();
        required.setOffer(offer);
        required.setMenuItem(requiredDish);
        required.setQuantity(requiredQuantity);
        required.setIsFree(false);
        offer.getItems().add(required);

        OfferItem free = new OfferItem();
        free.setOffer(offer);
        free.setMenuItem(freeDish);
        free.setQuantity(1);
        free.setIsFree(true);
        offer.getItems().add(free);

        offerRepository.save(offer);
    }

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

        OrderResponse response = orderService.createOrder(user.getId(), req);

        assertNotNull(response.getOrderNumber());
        assertEquals("PLACED", response.getOrderStatus());
        assertEquals("PENDING", response.getPaymentStatus());
        // 2 * 349.00 = 698.00 (Free delivery over 499)
        assertEquals(BigDecimal.valueOf(698.00).setScale(2), response.getSubtotal().setScale(2));
        assertEquals(BigDecimal.valueOf(698.00).setScale(2), response.getTotalAmount().setScale(2));
    }

    @Test
    void testUpiOrderCannotBeMarkedPaidWithoutGatewayVerification() {
        User user = userRepository.findByEmail("customer@theember.com").orElseThrow();
        MenuItem dish = menuItemRepository.findBySlug("butter-chicken").orElseThrow();

        OrderCreateRequest createRequest = new OrderCreateRequest();
        createRequest.setCustomerName("Test Customer");
        createRequest.setCustomerPhone("+91 99999 88888");
        createRequest.setDeliveryAddress("123 Gourmet Lane, Food City");
        createRequest.setPaymentMethod("ONLINE_UPI");

        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(dish.getId());
        item.setQuantity(1);
        createRequest.setItems(List.of(item));

        OrderResponse order = orderService.createOrder(user.getId(), createRequest);

        StatusUpdateRequest statusRequest = new StatusUpdateRequest();
        statusRequest.setPaymentStatus("PAID");

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                orderService.updateOrderStatus(order.getId(), statusRequest));
        assertTrue(exception.getMessage().contains("gateway verification"));
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
