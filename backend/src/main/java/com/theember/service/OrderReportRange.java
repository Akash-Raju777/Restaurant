package com.theember.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OrderReportRange(
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime fromInclusive,
        LocalDateTime toExclusive,
        String label,
        String zoneId) {

    public boolean isFiltered() {
        return startDate != null;
    }
}
