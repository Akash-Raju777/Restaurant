package com.theember.service;

import com.theember.dto.OfferEvaluationResponse;
import com.theember.dto.OfferItemRequest;
import com.theember.dto.OfferRequest;
import com.theember.dto.OfferValidateRequest;
import com.theember.entity.MenuItem;
import com.theember.entity.Offer;
import com.theember.entity.OfferItem;
import com.theember.repository.MenuItemRepository;
import com.theember.repository.OfferRepository;
import com.theember.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OfferService {

    private static final Set<String> SUPPORTED_TYPES = Set.of("PERCENTAGE", "FIXED_AMOUNT", "COMBO");

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<Offer> getActiveOffers() {
        return offerRepository.findCurrentActiveOffers(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<Offer> getAllOffersForAdmin() {
        return offerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Offer getOfferById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found with ID: " + id));
    }

    public BigDecimal calculateDiscount(Offer offer, BigDecimal subtotal) {
        validateOfferWindow(offer);
        validateMinimum(offer, subtotal);
        return computeDiscount(offer, subtotal);
    }

    public OfferEvaluation evaluateOffer(String couponCode, Long userId, Map<Long, Integer> cartQuantities,
                                         BigDecimal subtotal, boolean lockForUpdate) {
        if (couponCode == null || couponCode.isBlank()) {
            throw new IllegalArgumentException("Coupon code is required.");
        }

        String normalizedCode = couponCode.trim();
        Offer offer = (lockForUpdate
                ? offerRepository.findByCodeIgnoreCaseForUpdate(normalizedCode)
                : offerRepository.findByCodeIgnoreCase(normalizedCode))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired coupon code."));

        validateOfferWindow(offer);
        validateUsage(offer, userId);
        validateMinimum(offer, subtotal);
        validateRequiredItems(offer, cartQuantities);

        return new OfferEvaluation(offer, computeDiscount(offer, subtotal), freeItems(offer));
    }

    @Transactional(readOnly = true)
    public OfferEvaluationResponse validateOffer(Long userId, OfferValidateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Add at least one item before applying an offer.");
        }

        Map<Long, Integer> quantities = new HashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OfferValidateRequest.Item line : request.getItems()) {
            MenuItem item = menuItemRepository.findById(line.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + line.getMenuItemId()));
            if (Boolean.FALSE.equals(item.getIsAvailable())) {
                throw new IllegalStateException("'" + item.getName() + "' is currently unavailable.");
            }
            int quantity = line.getQuantity() == null ? 0 : line.getQuantity();
            if (quantity < 1) {
                throw new IllegalArgumentException("Item quantity must be at least 1.");
            }
            quantities.merge(item.getId(), quantity, Integer::sum);
            BigDecimal price = item.getDiscountedPrice() != null ? item.getDiscountedPrice() : item.getPrice();
            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(quantity)));
        }

        OfferEvaluation evaluation = evaluateOffer(request.getCouponCode(), userId, quantities, subtotal, false);
        return evaluation.toResponse();
    }

    @Transactional
    public Offer createOffer(OfferRequest request) {
        Offer offer = new Offer();
        applyRequest(offer, request, true);
        offer.setTimesUsed(0);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer updateOffer(Long id, OfferRequest request) {
        Offer offer = getOfferById(id);
        applyRequest(offer, request, false);
        return offerRepository.save(offer);
    }

    @Transactional
    public void deleteOffer(Long id) {
        Offer offer = getOfferById(id);
        offerRepository.delete(offer);
    }

    private void applyRequest(Offer offer, OfferRequest request, boolean creating) {
        String type = request.getDiscountType() == null
                ? ""
                : request.getDiscountType().trim().toUpperCase();
        if (!SUPPORTED_TYPES.contains(type)) {
            throw new IllegalArgumentException("Unsupported discount type. Use PERCENTAGE, FIXED_AMOUNT or COMBO.");
        }
        if (request.getDiscountValue() == null || request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Discount value must be greater than zero.");
        }
        if ("PERCENTAGE".equals(type) && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%.");
        }
        if (request.getStartDate() == null || request.getExpiryDate() == null) {
            throw new IllegalArgumentException("Start date and expiry date are required.");
        }
        if (!request.getExpiryDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Expiry date must be after the start date.");
        }

        String code = normalizeCode(request.getCode());
        if (code != null) {
            offerRepository.findByCodeIgnoreCase(code).ifPresent(existing -> {
                if (creating || !existing.getId().equals(offer.getId())) {
                    throw new IllegalArgumentException("Coupon code is already in use.");
                }
            });
        }

        offer.setTitle(request.getTitle().trim());
        offer.setDescription(request.getDescription());
        offer.setCode(code);
        offer.setDiscountType(type);
        offer.setDiscountValue(request.getDiscountValue());
        offer.setMinOrderAmount(request.getMinOrderAmount() != null
                ? request.getMinOrderAmount()
                : BigDecimal.ZERO);
        offer.setMaxDiscountAmount(request.getMaxDiscountAmount());
        offer.setComboItems(request.getComboItems());
        offer.setBannerImageUrl(request.getBannerImageUrl());
        offer.setStartDate(request.getStartDate());
        offer.setExpiryDate(request.getExpiryDate());
        offer.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        offer.setUsageLimit(request.getUsageLimit());
        offer.setPerUserLimit(request.getPerUserLimit());

        replaceItems(offer, request.getItems());
    }

    private void replaceItems(Offer offer, List<OfferItemRequest> itemRequests) {
        Map<Long, OfferItem> existingByMenuItem = new HashMap<>();
        for (OfferItem existing : offer.getItems()) {
            if (existing.getMenuItem() != null) {
                existingByMenuItem.put(existing.getMenuItem().getId(), existing);
            }
        }

        if (itemRequests == null || itemRequests.isEmpty()) {
            offer.getItems().clear();
            return;
        }

        Set<Long> seen = new HashSet<>();
        List<OfferItem> replacement = new ArrayList<>();
        for (OfferItemRequest itemRequest : itemRequests) {
            if (itemRequest.getMenuItemId() == null) {
                throw new IllegalArgumentException("Every offer product must reference a menu item.");
            }
            if (!seen.add(itemRequest.getMenuItemId())) {
                throw new IllegalArgumentException("Each menu item can only appear once in an offer.");
            }
            int quantity = itemRequest.getQuantity() == null ? 1 : itemRequest.getQuantity();
            if (quantity < 1) {
                throw new IllegalArgumentException("Offer item quantity must be at least 1.");
            }
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Menu item not found: " + itemRequest.getMenuItemId()));

            OfferItem offerItem = existingByMenuItem.remove(itemRequest.getMenuItemId());
            if (offerItem == null) {
                offerItem = new OfferItem();
                offerItem.setOffer(offer);
                offerItem.setMenuItem(menuItem);
            }
            offerItem.setQuantity(quantity);
            offerItem.setIsFree(Boolean.TRUE.equals(itemRequest.getIsFree()));
            replacement.add(offerItem);
        }

        offer.getItems().clear();
        offer.getItems().addAll(replacement);
    }

    private void validateOfferWindow(Offer offer) {
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(offer.getIsActive())) {
            throw new IllegalArgumentException("This offer is currently inactive.");
        }
        if (offer.getStartDate() != null && now.isBefore(offer.getStartDate())) {
            throw new IllegalArgumentException("This offer has not started yet.");
        }
        if (offer.getExpiryDate() != null && now.isAfter(offer.getExpiryDate())) {
            throw new IllegalArgumentException("This offer has expired.");
        }
    }

    private void validateUsage(Offer offer, Long userId) {
        if (offer.getUsageLimit() != null
                && offer.getTimesUsed() != null
                && offer.getTimesUsed() >= offer.getUsageLimit()) {
            throw new IllegalArgumentException("This offer has reached its usage limit.");
        }
        if (userId != null && offer.getPerUserLimit() != null) {
            long usedByUser = orderRepository.countByUserIdAndAppliedOfferId(userId, offer.getId());
            if (usedByUser >= offer.getPerUserLimit()) {
                throw new IllegalArgumentException("You have already used this offer the maximum number of times.");
            }
        }
    }

    private void validateMinimum(Offer offer, BigDecimal subtotal) {
        if (offer.getMinOrderAmount() != null && subtotal.compareTo(offer.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order of \u20B9" + offer.getMinOrderAmount()
                    + " required for this offer.");
        }
    }

    private void validateRequiredItems(Offer offer, Map<Long, Integer> cartQuantities) {
        if (offer.getItems() == null) {
            return;
        }
        for (OfferItem offerItem : offer.getItems()) {
            if (Boolean.TRUE.equals(offerItem.getIsFree())) {
                continue;
            }
            int required = offerItem.getQuantity() == null ? 1 : offerItem.getQuantity();
            int inCart = cartQuantities == null || offerItem.getMenuItem() == null
                    ? 0
                    : cartQuantities.getOrDefault(offerItem.getMenuItem().getId(), 0);
            if (inCart < required) {
                throw new IllegalArgumentException("Add " + required + " x "
                        + offerItem.getMenuItem().getName() + " to use this combo offer.");
            }
        }
    }

    private BigDecimal computeDiscount(Offer offer, BigDecimal subtotal) {
        BigDecimal discount = BigDecimal.ZERO;
        String type = offer.getDiscountType() == null ? "" : offer.getDiscountType().toUpperCase();

        if ("PERCENTAGE".equals(type)) {
            discount = subtotal.multiply(offer.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (offer.getMaxDiscountAmount() != null && discount.compareTo(offer.getMaxDiscountAmount()) > 0) {
                discount = offer.getMaxDiscountAmount();
            }
        } else if ("FIXED_AMOUNT".equals(type) || "COMBO".equals(type)) {
            discount = offer.getDiscountValue();
            if (offer.getMaxDiscountAmount() != null && discount.compareTo(offer.getMaxDiscountAmount()) > 0) {
                discount = offer.getMaxDiscountAmount();
            }
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return discount.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private List<OfferItem> freeItems(Offer offer) {
        List<OfferItem> free = new ArrayList<>();
        if (offer.getItems() == null) {
            return free;
        }
        for (OfferItem offerItem : offer.getItems()) {
            if (Boolean.TRUE.equals(offerItem.getIsFree())) {
                free.add(offerItem);
            }
        }
        return free;
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().toUpperCase();
    }

    public static class OfferEvaluation {
        private final Offer offer;
        private final BigDecimal discountAmount;
        private final List<OfferItem> freeItems;

        public OfferEvaluation(Offer offer, BigDecimal discountAmount, List<OfferItem> freeItems) {
            this.offer = offer;
            this.discountAmount = discountAmount;
            this.freeItems = freeItems;
        }

        public Offer getOffer() { return offer; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public List<OfferItem> getFreeItems() { return freeItems; }

        public OfferEvaluationResponse toResponse() {
            OfferEvaluationResponse response = new OfferEvaluationResponse();
            response.setOfferId(offer.getId());
            response.setTitle(offer.getTitle());
            response.setCode(offer.getCode());
            response.setDiscountType(offer.getDiscountType());
            response.setDiscountValue(offer.getDiscountValue());
            response.setDiscountAmount(discountAmount);
            response.setMinimumOrderAmount(offer.getMinOrderAmount());
            response.setMessage(freeItems.isEmpty()
                    ? "Offer applied successfully."
                    : "Offer applied. Complimentary items will be added to your order.");

            List<OfferEvaluationResponse.FreeItem> freeItemResponses = new ArrayList<>();
            for (OfferItem item : freeItems) {
                MenuItem menuItem = item.getMenuItem();
                if (menuItem != null) {
                    freeItemResponses.add(new OfferEvaluationResponse.FreeItem(
                            menuItem.getId(),
                            menuItem.getName(),
                            item.getQuantity(),
                            menuItem.getImageUrl()
                    ));
                }
            }
            response.setFreeItems(freeItemResponses);
            return response;
        }
    }
}
