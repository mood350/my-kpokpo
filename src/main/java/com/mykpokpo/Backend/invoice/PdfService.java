package com.mykpokpo.Backend.invoice;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
class PdfService {

    private static final DeviceRgb PRIMARY    = new DeviceRgb(30, 64, 120);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(245, 245, 245);
    private static final DeviceRgb WHITE      = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb BLACK      = new DeviceRgb(0, 0, 0);
    private static final DeviceRgb DARK_GRAY  = new DeviceRgb(80, 80, 80);
    private static final DeviceRgb GRAY       = new DeviceRgb(150, 150, 150);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    byte[] generate(Invoice invoice) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document doc = new Document(pdfDoc, PageSize.A4);
        doc.setMargins(40, 50, 40, 50);

        addHeader(doc, invoice);
        addParties(doc, invoice);
        doc.add(new Paragraph("\n"));
        addLinesTable(doc, invoice);
        addTotals(doc, invoice);
        addFooter(doc, invoice);

        doc.close();
        return baos.toByteArray();
    }

    private void addHeader(Document doc, Invoice invoice) {
        String label = invoice.getType() == InvoiceType.FACTURE ? "FACTURE" : "DEVIS";

        Table header = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100));

        // Garage name (left)
        Cell garageCell = new Cell()
                .add(new Paragraph(invoice.getGarage().getName())
                        .setFontSize(18).setBold().setFontColor(PRIMARY))
                .add(new Paragraph(nullSafe(invoice.getGarage().getAddress()))
                        .setFontSize(9).setFontColor(DARK_GRAY))
                .add(new Paragraph(nullSafe(invoice.getGarage().getPhone()))
                        .setFontSize(9).setFontColor(DARK_GRAY))
                .add(new Paragraph(nullSafe(invoice.getGarage().getEmail()))
                        .setFontSize(9).setFontColor(DARK_GRAY))
                .setBorder(Border.NO_BORDER);

        // Document type + number (right)
        Cell docCell = new Cell()
                .add(new Paragraph(label).setFontSize(22).setBold()
                        .setFontColor(PRIMARY).setTextAlignment(TextAlignment.RIGHT))
                .add(new Paragraph("N° " + invoice.getInvoiceNumber())
                        .setFontSize(10).setTextAlignment(TextAlignment.RIGHT))
                .add(new Paragraph("Date : " + invoice.getIssueDate().format(DATE_FMT))
                        .setFontSize(9).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER);

        if (invoice.getDueDate() != null) {
            docCell.add(new Paragraph("Échéance : " + invoice.getDueDate().format(DATE_FMT))
                    .setFontSize(9).setTextAlignment(TextAlignment.RIGHT));
        }

        header.addCell(garageCell);
        header.addCell(docCell);
        doc.add(header);
        doc.add(new Paragraph("\n"));
    }

    private void addParties(Document doc, Invoice invoice) {
        Table parties = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100));

        // Left: vehicle info
        Cell vehicleCell = new Cell()
                .add(new Paragraph("VÉHICULE").setBold().setFontSize(9).setFontColor(PRIMARY))
                .add(new Paragraph(invoice.getVehicle().getBrand() + " " + invoice.getVehicle().getModel())
                        .setFontSize(10))
                .add(new Paragraph("Immatriculation : " + invoice.getVehicle().getLicensePlate())
                        .setFontSize(9))
                .setBackgroundColor(LIGHT_GRAY).setPadding(8).setBorder(Border.NO_BORDER);

        // Right: client info
        Cell clientCell = new Cell()
                .add(new Paragraph("FACTURÉ À").setBold().setFontSize(9).setFontColor(PRIMARY))
                .add(new Paragraph(invoice.getClient().fullName()).setFontSize(10))
                .add(new Paragraph(invoice.getClient().getEmail()).setFontSize(9))
                .setBackgroundColor(LIGHT_GRAY).setPadding(8).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);

        parties.addCell(vehicleCell);
        parties.addCell(clientCell);
        doc.add(parties);
    }

    private void addLinesTable(Document doc, Invoice invoice) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{50, 12, 19, 19}))
                .setWidth(UnitValue.createPercentValue(100));

        // Header row
        for (String h : new String[]{"Description", "Qté", "Prix HT", "Total HT"}) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setBold().setFontSize(9).setFontColor(WHITE))
                    .setBackgroundColor(PRIMARY).setPadding(6).setBorder(Border.NO_BORDER));
        }

        // Data rows
        boolean odd = true;
        for (InvoiceLine line : invoice.getLines()) {
            DeviceRgb bg = odd ? WHITE : LIGHT_GRAY;
            table.addCell(styledCell(line.getDescription(), bg, TextAlignment.LEFT));
            table.addCell(styledCell(String.valueOf(line.getQuantity()), bg, TextAlignment.CENTER));
            table.addCell(styledCell(formatAmount(line.getUnitPrice()), bg, TextAlignment.RIGHT));
            table.addCell(styledCell(formatAmount(line.getTotalPrice()), bg, TextAlignment.RIGHT));
            odd = !odd;
        }

        doc.add(table);
    }

    private void addTotals(Document doc, Invoice invoice) {
        doc.add(new Paragraph("\n"));

        Table totals = new Table(UnitValue.createPercentArray(new float[]{65, 35}))
                .setWidth(UnitValue.createPercentValue(100));

        BigDecimal taxPercent = invoice.getTaxRate().multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal taxAmount = invoice.getTotalTTC().subtract(invoice.getTotalHT());

        addTotalRow(totals, "Total HT", formatAmount(invoice.getTotalHT()), false);
        addTotalRow(totals, "TVA (" + taxPercent + " %)", formatAmount(taxAmount), false);
        addTotalRow(totals, "Total TTC", formatAmount(invoice.getTotalTTC()), true);

        doc.add(totals);
    }

    private void addTotalRow(Table table, String label, String value, boolean highlight) {
        DeviceRgb bg = highlight ? PRIMARY : LIGHT_GRAY;
        DeviceRgb fg = highlight ? WHITE : BLACK;

        table.addCell(new Cell()
                .add(new Paragraph(label).setFontSize(9).setFontColor(fg))
                .setBackgroundColor(bg).setPadding(5)
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT));

        table.addCell(new Cell()
                .add(new Paragraph(value).setBold().setFontSize(10).setFontColor(fg))
                .setBackgroundColor(bg).setPadding(5)
                .setBorderTop(new SolidBorder(LIGHT_GRAY, 0.5f))
                .setBorderBottom(Border.NO_BORDER)
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private void addFooter(Document doc, Invoice invoice) {
        doc.add(new Paragraph("\n\n"));
        doc.add(new Paragraph("Statut : " + invoice.getStatus())
                .setFontSize(8).setFontColor(GRAY));
        doc.add(new Paragraph("Document généré par Kpokpo — " + invoice.getGarage().getName())
                .setFontSize(7).setFontColor(LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER));
    }

    private Cell styledCell(String text, DeviceRgb bg, TextAlignment align) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(9))
                .setBackgroundColor(bg).setPadding(5)
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(align);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0 FCFA";
        NumberFormat nf = NumberFormat.getIntegerInstance(Locale.FRANCE);
        return nf.format(amount.setScale(0, RoundingMode.HALF_UP)) + " FCFA";
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
