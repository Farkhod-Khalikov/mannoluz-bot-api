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

    doc.fontSize(20).text('Reconciliation Act', { align: 'center' }).moveDown();
    doc
      .fontSize(14)
      .text(`For the period: ${startDate} to ${endDate}`, { align: 'center' })
      .moveDown(2);

    // Table headers
    const headers = ['Date', 'InitBalance', 'Addition', 'Removal', 'Result'];
    const cellWidth = 100;
    const tableTop = doc.y;

    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .font('Helvetica-Bold')
        .text(header, x, tableTop, { width: cellWidth, align: 'center' })
        .rect(x, tableTop, cellWidth, 20)
        .stroke();
    });

    doc.moveDown();

    // Loop through rows and add them to the table
    let rowY = tableTop + 25;
    doc.font('Helvetica');
    tableRows.forEach((row) => {
      const rowYBefore = rowY;
      doc
        .text(row.dateRange, 50, rowY, { width: cellWidth, align: 'left' })
        .text(row.initBalance.toString(), 150, rowY, { width: cellWidth, align: 'right' })
        .text(row.addition.toString(), 250, rowY, { width: cellWidth, align: 'right' })
        .text(row.removal.toString(), 350, rowY, { width: cellWidth, align: 'right' })
        .text(row.result.toString(), 450, rowY, { width: cellWidth, align: 'right' });

      doc.rect(50, rowYBefore, cellWidth * headers.length, 20).stroke();
      rowY += 20;
    });

    // Total row
    doc
      .font('Helvetica-Bold')
      .text('Total', 50, rowY, { width: cellWidth, align: 'left' })
      .text(initBalance.toString(), 150, rowY, { width: cellWidth, align: 'right' })
      .text(sumOfAllPositives.toString(), 250, rowY, { width: cellWidth, align: 'right' })
      .text(sumOfAllNegatives.toString(), 350, rowY, { width: cellWidth, align: 'right' })
      .text((initBalance + sumOfAllPositives - sumOfAllNegatives).toString(), 450, rowY, {
        width: cellWidth,
        align: 'right',
      });

    doc.rect(50, rowY, cellWidth * headers.length, 20).stroke();

    // End and finalize the PDF document
    doc.end();
  });
};
