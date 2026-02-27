import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../lib/supabase';

export const generateInvoicePDF = (invoiceData: Invoice) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  /* ================= HEADER ================= */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('M/s A.D. TRADERS', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('B 124 APEX GREEN APARTMENT', pageWidth / 2, 24, { align: 'center' });
  doc.text('SEC - 8, GT ROAD, SONEPAT - 131001 (HR)', pageWidth / 2, 28, { align: 'center' });
  doc.text('PH. NO. - 87088 98580', pageWidth / 2, 32, { align: 'center' });

  doc.line(margin, 36, pageWidth - margin, 36);

  doc.setFontSize(8);
  doc.text('GSTIN: 06AAICA7330G1Z2', margin, 41);
  doc.text('FSSAI NO.: 10421012000122', margin, 45);
  doc.text('Email: adtraders11922@gmail.com', pageWidth - margin, 41, { align: 'right' });

  /* ================= CUSTOMER BOX ================= */

  const boxTop = 48;
  const boxHeight = 30;
  const halfWidth = (pageWidth - 2 * margin) / 2;

  doc.rect(margin, boxTop, halfWidth, boxHeight);
  doc.rect(margin + halfWidth, boxTop, halfWidth, boxHeight);

  doc.setFontSize(8);
  doc.text('TO:', margin + 3, boxTop + 6);

  doc.text(invoiceData.customer_name || '', margin + 3, boxTop + 12);
  doc.text(invoiceData.customer_address || '', margin + 3, boxTop + 18);
  doc.text(`Phone: ${invoiceData.customer_phone || ''}`, margin + 3, boxTop + 24);

  const rightX = margin + halfWidth + 3;

  doc.text(`INVOICE NO: ${invoiceData.invoice_number}`, rightX, boxTop + 8);
  doc.text(`BOXES: ${invoiceData.boxes}`, rightX, boxTop + 16);
  doc.text(
    `DATE: ${new Date(invoiceData.invoice_date)
      .toLocaleDateString('en-GB')
      .replace(/\//g, '-')}`,
    rightX,
    boxTop + 24
  );

  /* ================= TABLE ================= */

  const isSGST = invoiceData.tax_type === 'SGST_CGST';

  const headers = [[
    'S.NO',
    'PRODUCTS',
    'HSN',
    'QTY',
    'UNIT PRICE',
    'NET VALUE',
    'SGST+CGST (%)',
    'IGST (%)',
    'TAX AMOUNT'
  ]];

  const rows = invoiceData.items.map((item, i) => [
    String(i + 1),
    item.product_name || '',
    item.hsn || '',
    String(item.quantity),
    item.unit_price.toFixed(2),
    item.net_value.toFixed(2),
    isSGST ? '5%' : '0%',
    !isSGST ? '5%' : '0%',
    item.tax_amount.toFixed(2)
  ]);

  // 🔹 Ensure minimum 10 rows
  while (rows.length < 10) {
    rows.push(['', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: boxTop + boxHeight + 5,
    head: headers,
    body: rows,
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 12 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 14 },
      8: { cellWidth: 20 }
    },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: false, // No color
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        data.cell.styles.fontStyle = 'bold'; // Bold products
      }
    }
  });

  const table = (doc as any).lastAutoTable;
  const tableEndY = table.finalY + 10;

  /* ================= BANK DETAILS ================= */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BANK DETAILS', margin, tableEndY);
  doc.text('State Bank Of India', margin, tableEndY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('A/C No: 41687909184', margin, tableEndY + 11);
  doc.text('IFSC: SBIN0061721', margin, tableEndY + 16);
  doc.text('Qmagh City, Sonepat', margin, tableEndY + 21);

  /* ================= ELEGANT TOTAL SECTION ================= */

  const totalsX = pageWidth - margin - 70;
  const lineSpacing = 7;

  doc.setFont('helvetica', 'bold');
  doc.text('SUB TOTAL', totalsX, tableEndY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.sub_total.toFixed(2), pageWidth - margin, tableEndY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(
    isSGST ? 'TOTAL TAX (SGST+CGST)' : 'TOTAL TAX (IGST)',
    totalsX,
    tableEndY + lineSpacing
  );
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.total_tax.toFixed(2), pageWidth - margin, tableEndY + lineSpacing, { align: 'right' });

  // Separator line
  doc.line(totalsX, tableEndY + lineSpacing + 4, pageWidth - margin, tableEndY + lineSpacing + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL', totalsX, tableEndY + lineSpacing + 11);

  doc.setFontSize(11);
  doc.text(
    `Rs. ${invoiceData.grand_total.toLocaleString('en-IN', {
      minimumFractionDigits: 2
    })}`,
    pageWidth - margin,
    tableEndY + lineSpacing + 11,
    { align: 'right' }
  );

  /* ================= SIGNATURE ================= */

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('For A.D. Traders', pageWidth - margin - 50, tableEndY + 35);

  doc.setFont('helvetica', 'italic');
  doc.text('Authorised Signatory', pageWidth - margin - 50, tableEndY + 45);

  doc.save(`Invoice-${invoiceData.invoice_number}.pdf`);
};