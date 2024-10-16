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

    // Shifted title and period text lower for better spacing
    doc.fontSize(20).text('Reconciliation Act', { align: 'center' }).moveDown(3); // Increased space
    doc
      .fontSize(14)
      .text(`For the period: ${startDate} to ${endDate}`, { align: 'center' })
      .moveDown(4); // Increased space between title and period

    // Table headers
    const headers = ['Date', 'InitBalance', 'Addition', 'Removal', 'Result'];
    const cellWidth = 100;

    // Shifted table a bit lower
    const tableTop = doc.y + 20; // Extra space above the table

    // Draw table headers
    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .font('Helvetica-Bold')
        .text(header, x, tableTop, { width: cellWidth, align: 'center' })
        .rect(x, tableTop, cellWidth, 20)
        .stroke();
    });

    doc.moveDown();

    // Table rows data
    let rowY = tableTop + 25;
    doc.font('Helvetica');

    // Flag to track if it's the first row (where we show the initBalance)
    let isFirstRow = true;

    // Loop through rows and populate the table
    tableRows.forEach((row, index) => {
      const rowYBefore = rowY;

      // Only display initBalance on the first row, 0 for other dates
      const displayInitBalance = isFirstRow ? initBalance : 0;
      isFirstRow = false; // Set the flag to false after the first iteration

      // Result should be 0 for all dates except the total row
      const displayResult = 0;

      // Draw the row
      doc
        .text(row.dateRange, 50, rowY, { width: cellWidth, align: 'left' })
        .text(displayInitBalance.toString(), 150, rowY, { width: cellWidth, align: 'center' })
        .text(row.addition.toString(), 250, rowY, { width: cellWidth, align: 'center' })
        .text(row.removal.toString(), 350, rowY, { width: cellWidth, align: 'center' })
        .text(displayResult.toString(), 450, rowY, { width: cellWidth, align: 'center' });

      doc.rect(50, rowYBefore, cellWidth * headers.length, 20).stroke();
      rowY += 20;
    });

    // Add the "Total" row
    doc
      .font('Helvetica-Bold')
      .text('Total', 50, rowY, { width: cellWidth, align: 'left' })
      .text(initBalance.toString(), 150, rowY, { width: cellWidth, align: 'center' })
      .text(sumOfAllPositives.toString(), 250, rowY, { width: cellWidth, align: 'center' })
      .text(sumOfAllNegatives.toString(), 350, rowY, { width: cellWidth, align: 'center' })
      .text((initBalance + sumOfAllPositives - sumOfAllNegatives).toString(), 450, rowY, {
        width: cellWidth,
        align: 'center',
      });

    doc.rect(50, rowY, cellWidth * headers.length, 20).stroke();

    // End and finalize the PDF document
    doc.end();
  });
};
