package com.theember.controller;

import com.theember.dto.MenuItemRequest;
import com.theember.dto.OfferRequest;
import com.theember.dto.StatusUpdateRequest;
import com.theember.entity.MenuItem;
import com.theember.entity.Offer;
import com.theember.entity.Order;
import com.theember.entity.User;
import com.theember.security.UserDetailsImpl;
import com.theember.service.AdminService;
import com.theember.service.MenuService;
import com.theember.service.OfferService;
import com.theember.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private MenuService menuService;

    @Autowired
    private OfferService offerService;

    @Autowired
    private OrderService orderService;

    private Long getAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getId();
        }
        return null;
    }

    // Dashboard Overview Stats
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // Menu Management (CRUD)
    @PostMapping("/menu")
    public ResponseEntity<MenuItem> createMenuItem(@Valid @RequestBody MenuItemRequest request, HttpServletRequest httpRequest) {
        MenuItem item = menuService.createDish(request);
        adminService.recordAudit(getAdminId(), "CREATE_MENU_ITEM", "Created dish: " + item.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(item);
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @Valid @RequestBody MenuItemRequest request, HttpServletRequest httpRequest) {
        MenuItem item = menuService.updateDish(id, request);
        adminService.recordAudit(getAdminId(), "UPDATE_MENU_ITEM", "Updated dish ID: " + id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id, HttpServletRequest httpRequest) {
        menuService.deleteDish(id);
        adminService.recordAudit(getAdminId(), "DELETE_MENU_ITEM", "Deleted dish ID: " + id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Menu item deleted successfully"));
    }

    @PatchMapping("/menu/{id}/availability")
    public ResponseEntity<MenuItem> toggleDishAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return ResponseEntity.ok(menuService.toggleAvailability(id, available));
    }

    // Offer Management
    @GetMapping("/offers")
    public ResponseEntity<?> getAllOffers() {
        return ResponseEntity.ok(offerService.getAllOffersForAdmin());
    }

    @PostMapping("/offers")
    public ResponseEntity<Offer> createOffer(@Valid @RequestBody OfferRequest request, HttpServletRequest httpRequest) {
        Offer offer = offerService.createOffer(request);
        adminService.recordAudit(getAdminId(), "CREATE_OFFER", "Created offer: " + offer.getTitle(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(offer);
    }

    @PutMapping("/offers/{id}")
    public ResponseEntity<Offer> updateOffer(@PathVariable Long id, @Valid @RequestBody OfferRequest request, HttpServletRequest httpRequest) {
        Offer offer = offerService.updateOffer(id, request);
        adminService.recordAudit(getAdminId(), "UPDATE_OFFER", "Updated offer ID: " + id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(offer);
    }

    @DeleteMapping("/offers/{id}")
    public ResponseEntity<?> deleteOffer(@PathVariable Long id, HttpServletRequest httpRequest) {
        offerService.deleteOffer(id);
        adminService.recordAudit(getAdminId(), "DELETE_OFFER", "Deleted offer ID: " + id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Offer deleted successfully"));
    }

    // Order Management
    @GetMapping("/orders")
    public ResponseEntity<Page<Order>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin(status, search, page, size));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            HttpServletRequest httpRequest) {
        Order order = orderService.updateOrderStatus(id, request);
        adminService.recordAudit(getAdminId(), "UPDATE_ORDER_STATUS", "Order " + order.getOrderNumber() + " -> " + request.getOrderStatus(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(order);
    }

    // Customer Management
    @GetMapping("/customers")
    public ResponseEntity<Page<User>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getCustomers(page, size));
    }

    @PatchMapping("/customers/{id}/status")
    public ResponseEntity<User> toggleCustomerStatus(
            @PathVariable Long id,
            @RequestParam boolean isActive,
            HttpServletRequest httpRequest) {
        User user = adminService.toggleCustomerStatus(id, isActive);
        adminService.recordAudit(getAdminId(), "TOGGLE_CUSTOMER_STATUS", "Customer " + user.getEmail() + " active=" + isActive, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(user);
    }
}
