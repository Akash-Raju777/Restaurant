package com.theember.dto;

import com.theember.entity.OrderItem;
import java.math.BigDecimal;

/**
 * Safe DTO for returning order item data without circular JPA entity references.
 */
public class OrderItemResponse {

    private Long id;
    private String itemName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private String customizationNotes;

    public OrderItemResponse() {}

    public static OrderItemResponse from(OrderItem item) {
        OrderItemResponse dto = new OrderItemResponse();
        dto.setId(item.getId());
        dto.setItemName(item.getItemName());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setQuantity(item.getQuantity());
        dto.setSubtotal(item.getSubtotal());
        dto.setCustomizationNotes(item.getCustomizationNotes());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getCustomizationNotes() { return customizationNotes; }
    public void setCustomizationNotes(String customizationNotes) { this.customizationNotes = customizationNotes; }
}
