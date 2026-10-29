package com.theember.dto;

import jakarta.validation.constraints.NotBlank;

public class StatusUpdateRequest {

    private String orderStatus; // PLACED, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

    private String paymentStatus; // PENDING, PAID, FAILED, REFUNDED

    private String adminNotes;

    public StatusUpdateRequest() {}

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
}
