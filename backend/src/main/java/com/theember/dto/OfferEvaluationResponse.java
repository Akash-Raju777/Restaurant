package com.theember.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class OfferEvaluationResponse {

    private Long offerId;
    private String title;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal minimumOrderAmount;
    private List<FreeItem> freeItems = new ArrayList<>();
    private String message;

    public OfferEvaluationResponse() {}

    public Long getOfferId() { return offerId; }
    public void setOfferId(Long offerId) { this.offerId = offerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getMinimumOrderAmount() { return minimumOrderAmount; }
    public void setMinimumOrderAmount(BigDecimal minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }

    public List<FreeItem> getFreeItems() { return freeItems; }
    public void setFreeItems(List<FreeItem> freeItems) { this.freeItems = freeItems; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static class FreeItem {
        private Long menuItemId;
        private String name;
        private Integer quantity;
        private String imageUrl;

        public FreeItem() {}

        public FreeItem(Long menuItemId, String name, Integer quantity, String imageUrl) {
            this.menuItemId = menuItemId;
            this.name = name;
            this.quantity = quantity;
            this.imageUrl = imageUrl;
        }

        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }
}
