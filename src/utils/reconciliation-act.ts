import fs from 'fs';
import PDFDocument from 'pdfkit';
import i18n from './i18n';
import path from 'path'; 
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
    const fontPath = path.join(__dirname, '../../fonts/Times-Roman.ttf')
    doc.font(fontPath);
    const rowHeight = 20;
    const cellWidth = 100;
    const textOffset = 6; // Offset to center text vertically inside the row

    // Sort tableRows by dateRange (DD.MM.YYYY format)
    tableRows.sort((a, b) => {
      const [dayA, monthA, yearA] = a.dateRange.split('.').map(Number);
      const [dayB, monthB, yearB] = b.dateRange.split('.').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });

    // Title and Date Range
    doc
      .fontSize(20)
      .text(i18n.t('reconciliation_act'), { align: 'center' })
      .moveDown(3);
    doc
      .fontSize(14)
      .text(`${i18n.t('for_period')} ${startDate} - ${endDate}`, { align: 'center' })
      .moveDown(4);

    // Table headers
    const headers = [
      `${i18n.t('reconciliation_act_dates')}`,
      `${i18n.t('init_balance')}`,
      `${i18n.t('reconciliation_addition')}`,
      `${i18n.t('reconciliation_removal')}`,
      `${i18n.t('reconciliation_result')}`,
    ];
    const tableTop = doc.y + 20;

    // Draw table headers
    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .text(header, x, tableTop + textOffset, { width: cellWidth, align: 'center' })
        .rect(x, tableTop, cellWidth, rowHeight)
        .stroke();
    });

    doc.moveDown();

    let rowY = tableTop + rowHeight;

    let isFirstRow = true;

    const maxY = 700; // Maximum Y position before adding a new page

    // Loop through rows and populate the table
    tableRows.forEach((row) => {
      if (rowY > maxY) {
        doc.addPage();
        rowY = 50; // Reset Y for the new page
      }

      const displayInitBalance = isFirstRow ? initBalance : 0;
      isFirstRow = false;

      const displayResult = 0;

      doc
        .text(row.dateRange, 50, rowY + textOffset, { width: cellWidth, align: 'left' })
        .text(displayInitBalance.toString(), 150, rowY + textOffset, {
          width: cellWidth,
          align: 'center',
        })
        .text(row.addition.toString(), 250, rowY + textOffset, {
          width: cellWidth,
          align: 'center',
        })
        .text(row.removal.toString(), 350, rowY + textOffset, { width: cellWidth, align: 'center' })
        .text(displayResult.toString(), 450, rowY + textOffset, {
          width: cellWidth,
          align: 'center',
        });

      doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();
      rowY += rowHeight;
    });

    // Add the "Total" row and center the text
    doc
      .text(`${i18n.t('total')}`, 50, rowY + textOffset, { width: cellWidth, align: 'left' })
      .text(initBalance.toString(), 150, rowY + textOffset, { width: cellWidth, align: 'center' })
      .text(sumOfAllPositives.toString(), 250, rowY + textOffset, {
        width: cellWidth,
        align: 'center',
      })
      .text(sumOfAllNegatives.toString(), 350, rowY + textOffset, {
        width: cellWidth,
        align: 'center',
      })
      .text(
        (initBalance + sumOfAllPositives - sumOfAllNegatives).toString(),
        450,
        rowY + textOffset,
        {
          width: cellWidth,
          align: 'center',
        }
      );

    doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();

    // End and finalize the PDF document
    doc.end();
  });
};
