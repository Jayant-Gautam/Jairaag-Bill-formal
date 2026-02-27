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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('M/s A.D. TRADERS', pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('B 124 APEX GREEN APARTMENT', pageWidth / 2, 26, { align: 'center' });
  doc.text('SEC - 8, GT ROAD, SONEPAT - 131001 (HR)', pageWidth / 2, 30, { align: 'center' });
  doc.text('PH. NO. - 87088 98580', pageWidth / 2, 34, { align: 'center' });

  doc.setFontSize(8);
  doc.text('GSTIN: 06AAICA7330G1Z2', margin, 42);
  doc.text(`EMAIL: adtraders11922@gmail.com`, pageWidth - margin, 42, { align: 'right' });
  doc.text('FSSAI NO.: 10421012000122', margin, 46);

  doc.rect(margin, 50, (pageWidth - 2 * margin) / 2 - 2, 28);
  doc.rect((pageWidth - 2 * margin) / 2 + margin + 2, 50, (pageWidth - 2 * margin) / 2 - 2, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TO:', margin + 2, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const customerLines = doc.splitTextToSize(invoiceData.customer_name, 85);
  let yPos = 60;
  customerLines.forEach((line: string) => {
    doc.text(line, margin + 2, yPos);
    yPos += 4;
  });

  const addressLines = doc.splitTextToSize(invoiceData.customer_address, 85);
  addressLines.forEach((line: string) => {
    doc.text(line, margin + 2, yPos);
    yPos += 4;
  });

  doc.text(`Phone: ${invoiceData.customer_phone}`, margin + 2, yPos);
  if (invoiceData.customer_gstin) {
    doc.text(`GSTIN: ${invoiceData.customer_gstin}`, margin + 2, yPos + 4);
  }

  const rightBoxX = (pageWidth - 2 * margin) / 2 + margin + 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE NUMBER - ${invoiceData.invoice_number}`, rightBoxX, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Boxes - ${invoiceData.boxes}`, rightBoxX, 62);
  doc.text(`DATE - ${new Date(invoiceData.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-')}`, rightBoxX, 69);

  const tableStartY = 82;
  const isSGST = invoiceData.tax_type === 'SGST_CGST';

  const headers = [
    'S.NO',
    'PRODUCTS',
    'HSN',
    'QTY.',
    'UNIT PRICE',
    'NET VALUE'
  ];

  if (isSGST) {
    headers.push('SGST +\nCGST (%)');
    headers.push('IGST (%)');
  } else {
    headers.push('SGST +\nCGST (%)');
    headers.push('IGST (%)');
  }

  headers.push('TAX AMOUNT');

  const tableData = invoiceData.items.map((item, index) => {
    const row = [
      (index + 1).toString(),
      item.product_name,
      item.hsn,
      item.quantity.toString(),
      item.unit_price.toFixed(2),
      item.net_value.toFixed(2)
    ];

    if (isSGST) {
      row.push('5');
      row.push('');
    } else {
      row.push('');
      row.push('5');
    }

    row.push(item.tax_amount.toFixed(2));
    return row;
  });

  while (tableData.length < 10) {
    tableData.push(['', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 22, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BANK DETAILS', margin, finalY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('State Bank Of India', margin, finalY + 13);
  doc.text('AC No. 41687909184', margin, finalY + 17);
  doc.text('IFSC CODE : SBIN0061721', margin, finalY + 21);
  doc.text('Qmagh City, Sonepat', margin, finalY + 25);

  const totalsX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'bold');
  doc.text('SUB TOTAL', totalsX, finalY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.sub_total.toFixed(2), totalsX + 40, finalY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  const taxLabel = isSGST ? 'TOTAL TAX AMOUNT (SGST+CGST)' : 'TOTAL TAX AMOUNT (IGST)';
  doc.text(taxLabel, totalsX, finalY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.total_tax.toFixed(2), totalsX + 40, finalY + 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.rect(totalsX - 2, finalY + 16, 62, 7);
  doc.text('GRAND TOTAL', totalsX, finalY + 21);
  doc.text(`₹ ${invoiceData.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsX + 40, finalY + 21, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('For A.D. Traders', pageWidth - margin - 50, finalY + 35);
  doc.setFont('helvetica', 'italic');
  doc.text('Authorised Signatory', pageWidth - margin - 50, finalY + 48);

  doc.save(`Invoice-${invoiceData.invoice_number}.pdf`);
};
