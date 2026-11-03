package com.theember.controller;

import com.theember.dto.OfferEvaluationResponse;
import com.theember.dto.OfferValidateRequest;
import com.theember.entity.Offer;
import com.theember.security.UserDetailsImpl;
import com.theember.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/offers")
public class OfferController {

    @Autowired
    private OfferService offerService;

    @GetMapping
    public ResponseEntity<List<Offer>> getActiveOffers() {
        return ResponseEntity.ok(offerService.getActiveOffers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Offer> getOfferById(@PathVariable Long id) {
        return ResponseEntity.ok(offerService.getOfferById(id));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateOffer(@Valid @RequestBody OfferValidateRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long userId = auth != null && auth.getPrincipal() instanceof UserDetailsImpl
                    ? ((UserDetailsImpl) auth.getPrincipal()).getId()
                    : null;
            OfferEvaluationResponse response = offerService.validateOffer(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }
}
