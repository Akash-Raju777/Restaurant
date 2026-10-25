package com.theember.controller;

import com.theember.dto.ContactRequest;
import com.theember.entity.ContactEnquiry;
import com.theember.repository.ContactEnquiryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private ContactEnquiryRepository contactEnquiryRepository;

    @PostMapping
    public ResponseEntity<?> submitContactEnquiry(@Valid @RequestBody ContactRequest request) {
        ContactEnquiry enquiry = new ContactEnquiry(
                request.getName(),
                request.getEmail(),
                request.getSubject(),
                request.getMessage()
        );
        contactEnquiryRepository.save(enquiry);
        return ResponseEntity.ok(Map.of("message", "Thank you for reaching out to The Ember. Our guest relations team will get back to you shortly."));
    }
}
