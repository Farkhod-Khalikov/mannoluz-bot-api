import fs from "fs";
import PDFDocument from "pdfkit";
import i18n from "./i18n";
import path from "path";

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
  sumOfAllNegatives: number,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.pipe(stream);

    const fontPath = path.join(__dirname, "../../fonts/Times-Roman.ttf");
    doc.font(fontPath);

    const rowHeight = 20;
    const cellWidth = 100;
    const textOffset = 6;

    // Sort tableRows by dateRange (DD.MM.YYYY format)
    tableRows.sort((a, b) => {
      const [dayA, monthA, yearA] = a.dateRange.split(".").map(Number);
      const [dayB, monthB, yearB] = b.dateRange.split(".").map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });

    // Title and Date Range
    doc.fontSize(20).text(i18n.t("reconciliation_act"), { align: "center" }).moveDown(3);
    doc
      .fontSize(14)
      .text(`${i18n.t("for_period")} ${startDate} - ${endDate}`, {
        align: "center",
      })
      .moveDown(4);

    // Table headers
    const headers = [
      `${i18n.t("reconciliation_act_dates")}`,
      `${i18n.t("init_balance")}`,
      `${i18n.t("reconciliation_addition")}`,
      `${i18n.t("reconciliation_removal")}`,
      `${i18n.t("reconciliation_result")}`,
    ];

    const tableTop = doc.y + 20;
    const headerRowHeight = rowHeight * 2;
    const headerY = tableTop;

    // Draw table headers
    headers.forEach((header, index) => {
      const x = 50 + index * cellWidth;
      doc
        .fontSize(10)
        .text(header, x, headerY + textOffset, {
          width: cellWidth,
          align: "center",
        })
        .rect(x, headerY, cellWidth, headerRowHeight)
        .stroke();
    });

    let rowY = headerY + headerRowHeight;
    const maxY = 700; // Maximum Y position before adding a new page
    let isFirstRow = true;

    // Loop through rows and populate the table
    tableRows.forEach((row) => {
      if (rowY > maxY) {
        doc.addPage();
        rowY = 50; // Reset Y for the new page
      }

      // Display initBalance only for the first row
      const displayInitBalance = isFirstRow ? initBalance : 0;
      isFirstRow = false;

      // Set result column to 0 for all rows except the total row
      const displayResult = 0;

      doc
        .text(row.dateRange, 50, rowY + textOffset, {
          width: cellWidth,
          align: "left",
        })
        .text(displayInitBalance.toString(), 150, rowY + textOffset, {
          width: cellWidth,
          align: "center",
        })
        .text(row.addition.toString(), 250, rowY + textOffset, {
          width: cellWidth,
          align: "center",
        })
        .text(row.removal.toString(), 350, rowY + textOffset, {
          width: cellWidth,
          align: "center",
        })
        .text(displayResult.toString(), 450, rowY + textOffset, {
          width: cellWidth,
          align: "center",
        });

      doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();
      rowY += rowHeight;
    });

    // Add the "Total" row and include the actual result
    const totalResult = initBalance + sumOfAllPositives - sumOfAllNegatives;

    doc
      .text(`${i18n.t("total")}`, 50, rowY + textOffset, {
        width: cellWidth,
        align: "left",
      })
      .text(initBalance.toString(), 150, rowY + textOffset, {
        width: cellWidth,
        align: "center",
      })
      .text(sumOfAllPositives.toString(), 250, rowY + textOffset, {
        width: cellWidth,
        align: "center",
      })
      .text(sumOfAllNegatives.toString(), 350, rowY + textOffset, {
        width: cellWidth,
        align: "center",
      })
      .text(totalResult.toString(), 450, rowY + textOffset, {
        width: cellWidth,
        align: "center",
      });

    doc.rect(50, rowY, cellWidth * headers.length, rowHeight).stroke();

    // End and finalize the PDF document
    doc.end();
  });
};
