package com.theember.controller;

import com.theember.dto.MenuItemRequest;
import com.theember.dto.OfferRequest;
import com.theember.dto.OrderResponse;
import com.theember.dto.PagedResponse;
import com.theember.dto.StatusUpdateRequest;
import com.theember.entity.MenuItem;
import com.theember.entity.Offer;
import com.theember.entity.User;
import com.theember.security.UserDetailsImpl;
import com.theember.service.AdminService;
import com.theember.service.FileStorageService;
import com.theember.service.MenuService;
import com.theember.service.OfferService;
import com.theember.service.OrderExportFile;
import com.theember.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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

    @Autowired
    private FileStorageService fileStorageService;

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
    @GetMapping("/menu")
    public ResponseEntity<Page<MenuItem>> getMenuItems(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(menuService.getDishesForAdmin(search, page, size));
    }

    @PostMapping("/menu/image")
    public ResponseEntity<?> uploadMenuImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileStorageService.storeMenuImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.internalServerError().body(Map.of("error", exception.getMessage()));
        }
    }

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
    @PostMapping("/offers/image")
    public ResponseEntity<?> uploadOfferImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileStorageService.storeOfferImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.internalServerError().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/offers")
    public ResponseEntity<?> getAllOffers() {
        return ResponseEntity.ok(offerService.getAllOffersForAdmin());
    }

    @PostMapping("/offers")
    public ResponseEntity<?> createOffer(@Valid @RequestBody OfferRequest request, HttpServletRequest httpRequest) {
        try {
            Offer offer = offerService.createOffer(request);
            adminService.recordAudit(getAdminId(), "CREATE_OFFER", "Created offer: " + offer.getTitle(), httpRequest.getRemoteAddr());
            return ResponseEntity.ok(offer);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PutMapping("/offers/{id}")
    public ResponseEntity<?> updateOffer(@PathVariable Long id, @Valid @RequestBody OfferRequest request, HttpServletRequest httpRequest) {
        try {
            Offer offer = offerService.updateOffer(id, request);
            adminService.recordAudit(getAdminId(), "UPDATE_OFFER", "Updated offer ID: " + id, httpRequest.getRemoteAddr());
            return ResponseEntity.ok(offer);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @DeleteMapping("/offers/{id}")
    public ResponseEntity<?> deleteOffer(@PathVariable Long id, HttpServletRequest httpRequest) {
        try {
            offerService.deleteOffer(id);
            adminService.recordAudit(getAdminId(), "DELETE_OFFER", "Deleted offer ID: " + id, httpRequest.getRemoteAddr());
            return ResponseEntity.ok(Map.of("message", "Offer deleted successfully"));
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    // Order Management
    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(PagedResponse.from(orderService.getAllOrdersForAdmin(
                    status, search, paymentMethod, paymentStatus,
                    startDate, endDate, month, year, page, size)));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/orders/export/all")
    public ResponseEntity<?> exportAllOrders() {
        try {
            return excelResponse(orderService.exportAllOrders());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.internalServerError().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/orders/export/date-range")
    public ResponseEntity<?> exportOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            return excelResponse(orderService.exportOrdersByDateRange(startDate, endDate));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.internalServerError().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/orders/export/month")
    public ResponseEntity<?> exportOrdersByMonth(
            @RequestParam Integer month,
            @RequestParam Integer year) {
        try {
            return excelResponse(orderService.exportOrdersByMonth(month, year));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.internalServerError().body(Map.of("error", exception.getMessage()));
        }
    }

    private ResponseEntity<byte[]> excelResponse(OrderExportFile file) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(file.filename())
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file.content());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            HttpServletRequest httpRequest) {
        OrderResponse order = orderService.updateOrderStatus(id, request);
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
