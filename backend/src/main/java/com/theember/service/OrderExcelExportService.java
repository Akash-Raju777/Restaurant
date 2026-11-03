package com.theember.service;

import com.theember.entity.Order;
import com.theember.entity.OrderItem;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderExcelExportService {

    private static final String CURRENCY_FORMAT = "\"₹\"#,##0.00";
    private static final DateTimeFormatter GENERATED_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH);
    private static final List<String> ORDER_STATUSES = List.of(
            "PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED");

    private static final String[] ORDER_HEADERS = {
            "Order ID", "Order Date", "Order Time", "Customer Name", "Customer Email",
            "Customer Phone", "Delivery Address", "Ordered Food Items", "Item Quantities",
            "Item Unit Prices", "Item Subtotals", "Applied Offer / Coupon", "Discount Amount",
            "Delivery Fee", "Total Amount", "Payment Method", "Payment Status", "Order Status"
    };

    private static final String[] ITEM_HEADERS = {
            "Order ID", "Order Date", "Order Time", "Customer Name", "Customer Email",
            "Item Name", "Quantity", "Unit Price", "Subtotal", "Free Item", "Customization Notes"
    };

    public byte[] createWorkbook(List<Order> orders, OrderReportRange range) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Styles styles = new Styles(workbook);
            createOrdersSheet(workbook, styles, orders, range);
            createItemsSheet(workbook, styles, orders, range);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to generate the Excel report.", exception);
        }
    }

    private void createOrdersSheet(XSSFWorkbook workbook, Styles styles, List<Order> orders, OrderReportRange range) {
        Sheet sheet = workbook.createSheet("Orders");
        sheet.setDisplayGridlines(false);
        sheet.setPrintGridlines(false);
        sheet.getPrintSetup().setLandscape(true);
        sheet.setFitToPage(true);
        sheet.getPrintSetup().setFitWidth((short) 1);

        setColumnWidths(sheet, new int[]{
                6600, 4300, 3800, 7300, 9300, 5000, 13500, 15500, 7800,
                9000, 9000, 10000, 5000, 4700, 5200, 6000, 5500, 6000
        });

        addTitleBlock(sheet, styles, range, 18);
        addSummary(sheet, styles, orders);

        Row headerRow = sheet.createRow(12);
        headerRow.setHeightInPoints(34);
        for (int index = 0; index < ORDER_HEADERS.length; index++) {
            headerRow.createCell(index).setCellValue(ORDER_HEADERS[index]);
            headerRow.getCell(index).setCellStyle(styles.tableHeader);
        }

        int rowIndex = 13;
        if (orders.isEmpty()) {
            Row emptyRow = sheet.createRow(rowIndex);
            emptyRow.setHeightInPoints(28);
            emptyRow.createCell(0).setCellValue("No orders found for the selected period.");
            emptyRow.getCell(0).setCellStyle(styles.message);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, ORDER_HEADERS.length - 1));
        } else {
            for (Order order : orders) {
                Row row = sheet.createRow(rowIndex++);
                row.setHeightInPoints(54);
                writeOrderRow(row, styles, order);
            }
        }

        sheet.createFreezePane(0, 13);
        sheet.setAutoFilter(new CellRangeAddress(12, Math.max(12, rowIndex - 1), 0, ORDER_HEADERS.length - 1));
        sheet.setRepeatingRows(new CellRangeAddress(12, 12, 0, ORDER_HEADERS.length - 1));
        sheet.getFooter().setCenter("The Ember Restaurant | Confidential order report");
    }

    private void createItemsSheet(XSSFWorkbook workbook, Styles styles, List<Order> orders, OrderReportRange range) {
        Sheet sheet = workbook.createSheet("Order Items");
        sheet.setDisplayGridlines(false);
        sheet.setPrintGridlines(false);
        sheet.getPrintSetup().setLandscape(true);
        sheet.setFitToPage(true);
        sheet.getPrintSetup().setFitWidth((short) 1);

        setColumnWidths(sheet, new int[]{6600, 4300, 3800, 7300, 9300, 11000, 3800, 4800, 5000, 3800, 15000});

        addTitleBlock(sheet, styles, range, ITEM_HEADERS.length);

        Row headerRow = sheet.createRow(3);
        headerRow.setHeightInPoints(32);
        for (int index = 0; index < ITEM_HEADERS.length; index++) {
            headerRow.createCell(index).setCellValue(ITEM_HEADERS[index]);
            headerRow.getCell(index).setCellStyle(styles.tableHeader);
        }

        int rowIndex = 4;
        int itemRowCount = 0;
        for (Order order : orders) {
            List<OrderItem> items = sortedItems(order);
            for (OrderItem item : items) {
                Row row = sheet.createRow(rowIndex++);
                itemRowCount++;
                row.setHeightInPoints(36);
                setText(row, 0, order.getOrderNumber(), styles.text);
                if (order.getCreatedAt() != null) {
                    setDateTime(row, 1, order.getCreatedAt(), styles.date);
                    setDateTime(row, 2, order.getCreatedAt(), styles.time);
                } else {
                    setText(row, 1, "", styles.text);
                    setText(row, 2, "", styles.text);
                }
                setText(row, 3, order.getCustomerName(), styles.text);
                setText(row, 4, customerEmail(order), styles.text);
                setText(row, 5, item.getItemName(), styles.textWrap);
                setNumber(row, 6, item.getQuantity() == null ? 0 : item.getQuantity(), styles.number);
                setCurrency(row, 7, money(item.getUnitPrice()), styles.currency);
                setCurrency(row, 8, money(item.getSubtotal()), styles.currency);
                setText(row, 9, Boolean.TRUE.equals(item.getIsFreeItem()) ? "Yes" : "No", styles.textCentered);
                setText(row, 10, safe(item.getCustomizationNotes()), styles.textWrap);
            }
        }

        if (itemRowCount == 0) {
            Row emptyRow = sheet.createRow(rowIndex);
            emptyRow.setHeightInPoints(28);
            emptyRow.createCell(0).setCellValue("No order items found for the selected period.");
            emptyRow.getCell(0).setCellStyle(styles.message);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, ITEM_HEADERS.length - 1));
            rowIndex++;
        }

        sheet.createFreezePane(0, 4);
        sheet.setAutoFilter(new CellRangeAddress(3, Math.max(3, rowIndex - 1), 0, ITEM_HEADERS.length - 1));
        sheet.getFooter().setCenter("The Ember Restaurant | Confidential order report");
    }

    private void addTitleBlock(Sheet sheet, Styles styles, OrderReportRange range, int columnCount) {
        Row titleRow = sheet.createRow(0);
        titleRow.setHeightInPoints(34);
        titleRow.createCell(0).setCellValue("THE EMBER RESTAURANT | ORDER REPORT");
        titleRow.getCell(0).setCellStyle(styles.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, columnCount - 1));

        Row periodRow = sheet.createRow(1);
        periodRow.setHeightInPoints(24);
        periodRow.createCell(0).setCellValue("Reporting period: " + range.label());
        periodRow.getCell(0).setCellStyle(styles.subtitle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, columnCount - 1));

        Row generatedRow = sheet.createRow(2);
        generatedRow.setHeightInPoints(24);
        generatedRow.createCell(0).setCellValue(
                "Generated: " + LocalDateTime.now(ZoneId.of(range.zoneId())).format(GENERATED_FORMAT)
                        + " (" + range.zoneId() + ")");
        generatedRow.getCell(0).setCellStyle(styles.subtitle);
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, columnCount - 1));
    }

    private void addSummary(Sheet sheet, Styles styles, List<Order> orders) {
        BigDecimal totalValue = orders.stream()
                .map(order -> money(order.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal verifiedSales = orders.stream()
                .filter(this::isVerifiedSale)
                .map(order -> money(order.getTotalAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDiscount = orders.stream()
                .map(order -> money(order.getDiscountAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long codOrders = orders.stream()
                .filter(order -> "COD".equalsIgnoreCase(order.getPaymentMethod()))
                .count();
        long upiOrders = orders.stream()
                .filter(order -> "ONLINE_UPI".equalsIgnoreCase(order.getPaymentMethod())
                        || "UPI".equalsIgnoreCase(order.getPaymentMethod()))
                .count();

        Row sectionRow = sheet.createRow(4);
        sectionRow.setHeightInPoints(24);
        sectionRow.createCell(0).setCellValue("REPORT SUMMARY");
        sectionRow.getCell(0).setCellStyle(styles.section);
        sheet.addMergedRegion(new CellRangeAddress(4, 4, 0, 17));

        Row labelRow = sheet.createRow(5);
        Row valueRow = sheet.createRow(6);
        labelRow.setHeightInPoints(22);
        valueRow.setHeightInPoints(28);

        addNumericMetric(sheet, labelRow, valueRow, 0, 3, "TOTAL ORDERS", orders.size(), styles);
        addCurrencyMetric(sheet, labelRow, valueRow, 4, 7, "TOTAL ORDER VALUE", totalValue, styles);
        addCurrencyMetric(sheet, labelRow, valueRow, 8, 11, "VERIFIED SALES", verifiedSales, styles);
        addCurrencyMetric(sheet, labelRow, valueRow, 12, 15, "TOTAL DISCOUNTS", totalDiscount, styles);
        addMetric(sheet, labelRow, valueRow, 16, 17, "COD / UPI", codOrders + " / " + upiOrders, styles);

        Row statusSectionRow = sheet.createRow(7);
        statusSectionRow.setHeightInPoints(22);
        statusSectionRow.createCell(0).setCellValue("ORDER STATUS BREAKDOWN");
        statusSectionRow.getCell(0).setCellStyle(styles.section);
        sheet.addMergedRegion(new CellRangeAddress(7, 7, 0, 17));

        Row statusLabelRow = sheet.createRow(8);
        Row statusValueRow = sheet.createRow(9);
        statusLabelRow.setHeightInPoints(20);
        statusValueRow.setHeightInPoints(24);
        Map<String, Long> statusCounts = orders.stream()
                .filter(order -> order.getOrderStatus() != null)
                .collect(Collectors.groupingBy(
                        order -> order.getOrderStatus().toUpperCase(Locale.ENGLISH),
                        Collectors.counting()));

        for (int index = 0; index < ORDER_STATUSES.size(); index++) {
            int startColumn = index * 3;
            int endColumn = startColumn + 2;
            String status = ORDER_STATUSES.get(index);
            addNumericMetric(sheet, statusLabelRow, statusValueRow, startColumn, endColumn,
                    readable(status), statusCounts.getOrDefault(status, 0L), styles);
        }
    }

    private void addMetric(Sheet sheet, Row labelRow, Row valueRow, int startColumn, int endColumn,
                           String label, String value, Styles styles) {
        labelRow.createCell(startColumn).setCellValue(label);
        labelRow.getCell(startColumn).setCellStyle(styles.summaryLabel);
        valueRow.createCell(startColumn).setCellValue(value);
        valueRow.getCell(startColumn).setCellStyle(styles.summaryValue);
        sheet.addMergedRegion(new CellRangeAddress(labelRow.getRowNum(), labelRow.getRowNum(), startColumn, endColumn));
        sheet.addMergedRegion(new CellRangeAddress(valueRow.getRowNum(), valueRow.getRowNum(), startColumn, endColumn));
    }

    private void addNumericMetric(Sheet sheet, Row labelRow, Row valueRow, int startColumn, int endColumn,
                                  String label, Number value, Styles styles) {
        labelRow.createCell(startColumn).setCellValue(label);
        labelRow.getCell(startColumn).setCellStyle(styles.summaryLabel);
        valueRow.createCell(startColumn).setCellValue(value.doubleValue());
        valueRow.getCell(startColumn).setCellStyle(styles.summaryNumber);
        sheet.addMergedRegion(new CellRangeAddress(labelRow.getRowNum(), labelRow.getRowNum(), startColumn, endColumn));
        sheet.addMergedRegion(new CellRangeAddress(valueRow.getRowNum(), valueRow.getRowNum(), startColumn, endColumn));
    }

    private void addCurrencyMetric(Sheet sheet, Row labelRow, Row valueRow, int startColumn, int endColumn,
                                   String label, BigDecimal value, Styles styles) {
        labelRow.createCell(startColumn).setCellValue(label);
        labelRow.getCell(startColumn).setCellStyle(styles.summaryLabel);
        valueRow.createCell(startColumn).setCellValue(value.doubleValue());
        valueRow.getCell(startColumn).setCellStyle(styles.summaryCurrency);
        sheet.addMergedRegion(new CellRangeAddress(labelRow.getRowNum(), labelRow.getRowNum(), startColumn, endColumn));
        sheet.addMergedRegion(new CellRangeAddress(valueRow.getRowNum(), valueRow.getRowNum(), startColumn, endColumn));
    }

    private void writeOrderRow(Row row, Styles styles, Order order) {
        List<OrderItem> items = sortedItems(order);

        setText(row, 0, order.getOrderNumber(), styles.text);
        if (order.getCreatedAt() != null) {
            setDateTime(row, 1, order.getCreatedAt(), styles.date);
            setDateTime(row, 2, order.getCreatedAt(), styles.time);
        } else {
            setText(row, 1, "", styles.text);
            setText(row, 2, "", styles.text);
        }
        setText(row, 3, order.getCustomerName(), styles.text);
        setText(row, 4, customerEmail(order), styles.text);
        setText(row, 5, order.getCustomerPhone(), styles.text);
        setText(row, 6, order.getDeliveryAddress(), styles.textWrap);
        setText(row, 7, itemNames(items), styles.textWrap);
        setText(row, 8, quantities(items), styles.textWrap);
        setText(row, 9, unitPrices(items), styles.textWrap);
        setText(row, 10, subtotals(items), styles.textWrap);
        setText(row, 11, offerLabel(order), styles.textWrap);
        setCurrency(row, 12, money(order.getDiscountAmount()), styles.currency);
        setCurrency(row, 13, money(order.getDeliveryFee()), styles.currency);
        setCurrency(row, 14, money(order.getTotalAmount()), styles.currency);
        setText(row, 15, paymentMethod(order.getPaymentMethod()), styles.text);
        setText(row, 16, readable(order.getPaymentStatus()), styles.text);
        setText(row, 17, readable(order.getOrderStatus()), styles.text);
    }

    private boolean isVerifiedSale(Order order) {
        return "PAID".equalsIgnoreCase(order.getPaymentStatus())
                || ("COD".equalsIgnoreCase(order.getPaymentMethod())
                && "DELIVERED".equalsIgnoreCase(order.getOrderStatus()));
    }

    private List<OrderItem> sortedItems(Order order) {
        return order.getItems().stream()
                .sorted(Comparator.comparing(OrderItem::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private String itemNames(List<OrderItem> items) {
        return items.stream()
                .map(item -> safe(item.getItemName())
                        + (Boolean.TRUE.equals(item.getIsFreeItem()) ? " (Free)" : ""))
                .collect(Collectors.joining("; "));
    }

    private String quantities(List<OrderItem> items) {
        return items.stream()
                .map(item -> String.valueOf(item.getQuantity() == null ? 0 : item.getQuantity()))
                .collect(Collectors.joining("; "));
    }

    private String unitPrices(List<OrderItem> items) {
        return items.stream()
                .map(item -> formatCurrency(money(item.getUnitPrice())))
                .collect(Collectors.joining("; "));
    }

    private String subtotals(List<OrderItem> items) {
        return items.stream()
                .map(item -> formatCurrency(money(item.getSubtotal())))
                .collect(Collectors.joining("; "));
    }

    private String offerLabel(Order order) {
        String couponCode = safe(order.getCouponCode()).trim();
        String offerTitle = safe(order.getAppliedOfferTitle()).trim();
        if (!couponCode.isEmpty() && !offerTitle.isEmpty() && !couponCode.equalsIgnoreCase(offerTitle)) {
            return couponCode + " (" + offerTitle + ")";
        }
        if (!couponCode.isEmpty()) {
            return couponCode;
        }
        return offerTitle;
    }

    private String customerEmail(Order order) {
        return order.getUser() == null ? "" : safe(order.getUser().getEmail());
    }

    private String paymentMethod(String method) {
        if ("COD".equalsIgnoreCase(method)) {
            return "COD";
        }
        if ("ONLINE_UPI".equalsIgnoreCase(method) || "UPI".equalsIgnoreCase(method)) {
            return "UPI";
        }
        return readable(method);
    }

    private String readable(String value) {
        String safeValue = safe(value);
        if (safeValue.isBlank()) {
            return "";
        }
        String normalized = safeValue.trim().replace('_', ' ').toLowerCase(Locale.ENGLISH);
        StringBuilder result = new StringBuilder();
        for (String word : normalized.split("\\s+")) {
            if (!result.isEmpty()) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return result.toString();
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatCurrency(BigDecimal value) {
        DecimalFormat format = new DecimalFormat("₹#,##0.00");
        return format.format(value);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private void setText(Row row, int index, String value, CellStyle style) {
        row.createCell(index).setCellValue(safe(value));
        row.getCell(index).setCellStyle(style);
    }

    private void setNumber(Row row, int index, Number value, CellStyle style) {
        row.createCell(index).setCellValue(value == null ? 0 : value.doubleValue());
        row.getCell(index).setCellStyle(style);
    }

    private void setCurrency(Row row, int index, BigDecimal value, CellStyle style) {
        row.createCell(index).setCellValue(value.doubleValue());
        row.getCell(index).setCellStyle(style);
    }

    private void setDateTime(Row row, int index, LocalDateTime value, CellStyle style) {
        row.createCell(index).setCellValue(value);
        row.getCell(index).setCellStyle(style);
    }

    private void setColumnWidths(Sheet sheet, int[] widths) {
        for (int index = 0; index < widths.length; index++) {
            sheet.setColumnWidth(index, widths[index]);
        }
    }

    private static final class Styles {
        private final CellStyle title;
        private final CellStyle subtitle;
        private final CellStyle section;
        private final CellStyle summaryLabel;
        private final CellStyle summaryValue;
        private final CellStyle summaryNumber;
        private final CellStyle summaryCurrency;
        private final CellStyle tableHeader;
        private final CellStyle text;
        private final CellStyle textCentered;
        private final CellStyle textWrap;
        private final CellStyle number;
        private final CellStyle currency;
        private final CellStyle date;
        private final CellStyle time;
        private final CellStyle message;

        private Styles(XSSFWorkbook workbook) {
            XSSFFont titleFont = font(workbook, 18, true, new byte[]{(byte) 246, (byte) 241, (byte) 232});
            XSSFFont subtitleFont = font(workbook, 10, false, new byte[]{(byte) 217, (byte) 164, (byte) 65});
            XSSFFont sectionFont = font(workbook, 10, true, new byte[]{(byte) 25, (byte) 23, (byte) 20});
            XSSFFont headerFont = font(workbook, 10, true, new byte[]{(byte) 255, (byte) 255, (byte) 255});
            XSSFFont bodyFont = font(workbook, 10, false, new byte[]{(byte) 45, (byte) 45, (byte) 45});
            XSSFFont bodyBoldFont = font(workbook, 10, true, new byte[]{(byte) 25, (byte) 23, (byte) 20});

            title = styled(workbook, titleFont, new byte[]{(byte) 25, (byte) 23, (byte) 20},
                    HorizontalAlignment.LEFT, false);
            subtitle = styled(workbook, subtitleFont, new byte[]{(byte) 25, (byte) 23, (byte) 20},
                    HorizontalAlignment.LEFT, false);
            section = styled(workbook, sectionFont, new byte[]{(byte) 217, (byte) 164, (byte) 65},
                    HorizontalAlignment.LEFT, false);
            summaryLabel = styled(workbook, subtitleFont, new byte[]{(byte) 245, (byte) 240, (byte) 232},
                    HorizontalAlignment.LEFT, false);
            summaryValue = styled(workbook, bodyBoldFont, new byte[]{(byte) 245, (byte) 240, (byte) 232},
                    HorizontalAlignment.LEFT, false);
            summaryNumber = styled(workbook, bodyBoldFont, new byte[]{(byte) 245, (byte) 240, (byte) 232},
                    HorizontalAlignment.LEFT, false);
            summaryNumber.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
            summaryCurrency = styled(workbook, bodyBoldFont, new byte[]{(byte) 245, (byte) 240, (byte) 232},
                    HorizontalAlignment.LEFT, false);
            summaryCurrency.setDataFormat(workbook.createDataFormat().getFormat(CURRENCY_FORMAT));

            tableHeader = styled(workbook, headerFont, new byte[]{(byte) 25, (byte) 23, (byte) 20},
                    HorizontalAlignment.CENTER, true);
            text = dataStyle(workbook, bodyFont, HorizontalAlignment.LEFT, false);
            textCentered = dataStyle(workbook, bodyFont, HorizontalAlignment.CENTER, false);
            textWrap = dataStyle(workbook, bodyFont, HorizontalAlignment.LEFT, true);
            number = dataStyle(workbook, bodyFont, HorizontalAlignment.CENTER, false);
            number.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
            currency = dataStyle(workbook, bodyFont, HorizontalAlignment.RIGHT, false);
            currency.setDataFormat(workbook.createDataFormat().getFormat(CURRENCY_FORMAT));
            date = dataStyle(workbook, bodyFont, HorizontalAlignment.CENTER, false);
            date.setDataFormat(workbook.createDataFormat().getFormat("dd mmm yyyy"));
            time = dataStyle(workbook, bodyFont, HorizontalAlignment.CENTER, false);
            time.setDataFormat(workbook.createDataFormat().getFormat("hh:mm AM/PM"));
            message = dataStyle(workbook, bodyFont, HorizontalAlignment.LEFT, false);
        }

        private static XSSFFont font(XSSFWorkbook workbook, int size, boolean bold, byte[] color) {
            XSSFFont font = workbook.createFont();
            font.setFontName("Calibri");
            font.setFontHeightInPoints((short) size);
            font.setBold(bold);
            font.setColor(new XSSFColor(color, null));
            return font;
        }

        private static XSSFCellStyle styled(XSSFWorkbook workbook, XSSFFont font, byte[] fill,
                                            HorizontalAlignment alignment, boolean wrap) {
            XSSFCellStyle style = workbook.createCellStyle();
            style.setFont(font);
            style.setAlignment(alignment);
            style.setVerticalAlignment(VerticalAlignment.CENTER);
            style.setWrapText(wrap);
            if (fill != null) {
                style.setFillForegroundColor(new XSSFColor(fill, null));
                style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            }
            return style;
        }

        private static XSSFCellStyle dataStyle(XSSFWorkbook workbook, XSSFFont font,
                                               HorizontalAlignment alignment, boolean wrap) {
            XSSFCellStyle style = styled(workbook, font, new byte[]{(byte) 255, (byte) 255, (byte) 255},
                    alignment, wrap);
            style.setBorderTop(BorderStyle.THIN);
            style.setBorderBottom(BorderStyle.THIN);
            style.setBorderLeft(BorderStyle.THIN);
            style.setBorderRight(BorderStyle.THIN);
            style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
            return style;
        }
    }
}
