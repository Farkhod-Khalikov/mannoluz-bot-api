import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export const generateReconciliationPDF = async (
  startDate: string,
  endDate: string,
  outputPath: string,
  tableRows: {
    dateRange: string;
    initBalance: number;
    addition: number;
    removal: number;
    result: number;
  }[],
  initBalance: number,
  sumOfAllPositives: number,
  sumOfAllNegatives: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    const rowHeight = 20;
    const cellWidth = 100;
    const textOffset = 6; // Offset to center text vertically inside the row

    // Title and Date Range
    doc.fontSize(20).text('Reconciliation Act', { align: 'center' }).moveDown(3);
    doc
      .fontSize(14)
      .text(`For the period: ${startDate} to ${endDate}`, { align: 'center' })
      .moveDown(4);

    // Table headers
    const headers = ['Date', 'InitBalance', 'Addition', 'Removal', 'Result'];

    // Table top position
    const tableTop = doc.y + 20;

    // Draw table headers
    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .font('Helvetica-Bold')
        .text(header, x, tableTop + textOffset, { width: cellWidth, align: 'center' })
        .rect(x, tableTop, cellWidth, rowHeight)
        .stroke();
    });

    doc.moveDown();

    // Table rows data
    let rowY = tableTop + rowHeight;
    doc.font('Helvetica');

    let isFirstRow = true;

    // Loop through rows and populate the table
    tableRows.forEach((row) => {
      const displayInitBalance = isFirstRow ? initBalance : 0;
      isFirstRow = false;

      const displayResult = 0;

      // Draw the row and center the text vertically
      doc
        .text(row.dateRange, 50, rowY + textOffset, { width: cellWidth, align: 'left' })
        .text(displayInitBalance.toString(), 150, rowY + textOffset, { width: cellWidth, align: 'center' })
        .text(row.addition.toString(), 250, rowY + textOffset, { width: cellWidth, align: 'center' })
        .text(row.removal.toString(), 350, rowY + textOffset, { width: cellWidth, align: 'center' })
        .text(displayResult.toString(), 450, rowY + textOffset, { width: cellWidth, align: 'center' });

      doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();
      rowY += rowHeight;
    });

    // Add the "Total" row and center the text
    doc
      .font('Helvetica-Bold')
      .text('Total', 50, rowY + textOffset, { width: cellWidth, align: 'left' })
      .text(initBalance.toString(), 150, rowY + textOffset, { width: cellWidth, align: 'center' })
      .text(sumOfAllPositives.toString(), 250, rowY + textOffset, { width: cellWidth, align: 'center' })
      .text(sumOfAllNegatives.toString(), 350, rowY + textOffset, { width: cellWidth, align: 'center' })
      .text((initBalance + sumOfAllPositives - sumOfAllNegatives).toString(), 450, rowY + textOffset, {
        width: cellWidth,
        align: 'center',
      });

    doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();

    // End and finalize the PDF document
    doc.end();
  });
};
