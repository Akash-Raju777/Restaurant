package com.theember.service;

import com.theember.dto.OfferRequest;
import com.theember.entity.Offer;
import com.theember.repository.OfferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OfferService {

    @Autowired
    private OfferRepository offerRepository;

    public List<Offer> getActiveOffers() {
        return offerRepository.findCurrentActiveOffers(LocalDateTime.now());
    }

    public List<Offer> getAllOffersForAdmin() {
        return offerRepository.findAll();
    }

    public Offer getOfferById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found with ID: " + id));
    }

    public BigDecimal calculateDiscount(Offer offer, BigDecimal subtotal) {
        if (!offer.getIsActive() ||
                LocalDateTime.now().isBefore(offer.getStartDate()) ||
                LocalDateTime.now().isAfter(offer.getExpiryDate())) {
            throw new IllegalArgumentException("This offer has expired or is inactive.");
        }

        if (offer.getMinOrderAmount() != null && subtotal.compareTo(offer.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order of ₹" + offer.getMinOrderAmount() + " required for this offer.");
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(offer.getDiscountType())) {
            discount = subtotal.multiply(offer.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (offer.getMaxDiscountAmount() != null && discount.compareTo(offer.getMaxDiscountAmount()) > 0) {
                discount = offer.getMaxDiscountAmount();
            }
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(offer.getDiscountType()) || "COMBO".equalsIgnoreCase(offer.getDiscountType())) {
            discount = offer.getDiscountValue();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        return discount;
    }

    @Transactional
    public Offer createOffer(OfferRequest request) {
        Offer offer = new Offer();
        offer.setTitle(request.getTitle());
        offer.setDescription(request.getDescription());
        offer.setCode(request.getCode() != null ? request.getCode().trim().toUpperCase() : null);
        offer.setDiscountType(request.getDiscountType());
        offer.setDiscountValue(request.getDiscountValue());
        offer.setMinOrderAmount(request.getMinOrderAmount());
        offer.setMaxDiscountAmount(request.getMaxDiscountAmount());
        offer.setComboItems(request.getComboItems());
        offer.setBannerImageUrl(request.getBannerImageUrl());
        offer.setStartDate(request.getStartDate());
        offer.setExpiryDate(request.getExpiryDate());
        offer.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return offerRepository.save(offer);
    }

    @Transactional
    public Offer updateOffer(Long id, OfferRequest request) {
        Offer offer = getOfferById(id);
        offer.setTitle(request.getTitle());
        offer.setDescription(request.getDescription());
        if (request.getCode() != null) offer.setCode(request.getCode().trim().toUpperCase());
        offer.setDiscountType(request.getDiscountType());
        offer.setDiscountValue(request.getDiscountValue());
        offer.setMinOrderAmount(request.getMinOrderAmount());
        offer.setMaxDiscountAmount(request.getMaxDiscountAmount());
        offer.setComboItems(request.getComboItems());
        if (request.getBannerImageUrl() != null) offer.setBannerImageUrl(request.getBannerImageUrl());
        offer.setStartDate(request.getStartDate());
        offer.setExpiryDate(request.getExpiryDate());
        if (request.getIsActive() != null) offer.setIsActive(request.getIsActive());

        return offerRepository.save(offer);
    }

    @Transactional
    public void deleteOffer(Long id) {
        Offer offer = getOfferById(id);
        offerRepository.delete(offer);
    }
}
