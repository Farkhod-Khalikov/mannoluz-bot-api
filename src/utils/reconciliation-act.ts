import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export const generateReconciliationPDF = async (startDate: string, endDate: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    // Handle stream 'finish' event to ensure the PDF is fully written
    stream.on('finish', resolve);
    stream.on('error', reject);

    // Pipe the PDF into the file
    doc.pipe(stream);

    // Add a title to the document
    doc
      .fontSize(20)
      .text('Reconciliation Act', { align: 'center' })
      .moveDown();

    // Add a subtitle with date range
    doc
      .fontSize(14)
      .text(`For the period: ${startDate} to ${endDate}`, { align: 'center' })
      .moveDown(2);

    // Table headers
    doc.fontSize(12);
    const tableTop = doc.y;

    // Draw header cells with borders
    const headers = ['Dates', 'InitBalance', 'Addition', 'Removal', 'Result'];
    const cellWidth = 100; // Width of each cell
    const headerY = tableTop; // Y position for headers

    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .font('Helvetica-Bold')
        .text(header, x, headerY, { width: cellWidth, align: 'center' })
        .rect(x, headerY, cellWidth, 20) // Draw header cell border
        .stroke();
    });

    // Move down slightly before adding rows
    doc.moveDown();

    // Example table data
    const tableRows = [
      { dateRange: `${startDate} - ${endDate}`, initBalance: '1000', addition: '200', removal: '150', result: '1050' },
    ];

    // Define the position for the rows
    let rowY = tableTop + 25;
    doc.font('Helvetica');

    // Loop through rows and add them to the table
    tableRows.forEach(row => {
      const rowYBefore = rowY; // Y position before drawing the row
      doc
        .text(row.dateRange, 50, rowY, { width: cellWidth, align: 'left' })
        .text(row.initBalance, 150, rowY, { width: cellWidth, align: 'right' })
        .text(row.addition, 250, rowY, { width: cellWidth, align: 'right' })
        .text(row.removal, 350, rowY, { width: cellWidth, align: 'right' })
        .text(row.result, 450, rowY, { width: cellWidth, align: 'right' });

      // Draw row borders
      doc.rect(50, rowYBefore, cellWidth * headers.length, 20) // Draw row border
        .stroke();
      
      rowY += 20; // Move down for next row
    });

    // End and finalize the PDF document
    doc.end();
  });
};
