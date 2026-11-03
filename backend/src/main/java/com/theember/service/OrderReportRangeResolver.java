package com.theember.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class OrderReportRangeResolver {

    private static final DateTimeFormatter RANGE_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final ZoneId zoneId;

    public OrderReportRangeResolver(@Value("${ember.app.timeZone:Asia/Kolkata}") String zoneId) {
        this.zoneId = ZoneId.of(zoneId);
    }

    public OrderReportRange all() {
        return new OrderReportRange(null, null, null, null, "All Orders", zoneId.getId());
    }

    public OrderReportRange resolve(LocalDate startDate, LocalDate endDate, Integer month, Integer year) {
        boolean hasStart = startDate != null;
        boolean hasEnd = endDate != null;
        boolean hasMonth = month != null;
        boolean hasYear = year != null;

        if ((hasStart || hasEnd) && (hasMonth || hasYear)) {
            throw new IllegalArgumentException("Use either a date range or a month filter, not both.");
        }

        if (hasStart != hasEnd) {
            throw new IllegalArgumentException("Both startDate and endDate are required for a date range.");
        }

        if (hasMonth != hasYear) {
            throw new IllegalArgumentException("Both month and year are required for a month filter.");
        }

        if (hasStart) {
            return dateRange(startDate, endDate);
        }

        if (hasMonth) {
            return monthRange(month, year);
        }

        return all();
    }

    public OrderReportRange dateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Both startDate and endDate are required for a date range.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after the start date.");
        }

        return new OrderReportRange(
                startDate,
                endDate,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay(),
                startDate.format(RANGE_DATE_FORMAT) + " to " + endDate.format(RANGE_DATE_FORMAT),
                zoneId.getId());
    }

    public OrderReportRange monthRange(Integer month, Integer year) {
        if (month == null || year == null) {
            throw new IllegalArgumentException("Both month and year are required for a month filter.");
        }
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12.");
        }
        if (year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Year must be between 2000 and 2100.");
        }

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        String label = start.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));

        return new OrderReportRange(
                start,
                end,
                start.atStartOfDay(),
                start.plusMonths(1).atStartOfDay(),
                label,
                zoneId.getId());
    }

    public LocalDate today() {
        return LocalDate.now(zoneId);
    }

    public ZoneId getZoneId() {
        return zoneId;
    }
}
