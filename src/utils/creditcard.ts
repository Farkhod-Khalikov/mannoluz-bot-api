import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import Jimp from "jimp";
import bwipjs from "bwip-js";

// const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

const TEMP_DIR = path.join(__dirname, "../temp/credit-cards"); // Adjust the path if needed

export const generateQRCodeText = (phoneNumber: string): string => {
  return `phoneNumber: ${phoneNumber}`; // Example text; adjust as needed
};

const generateBarcodeImage = async (text: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128", // Barcode type
        text: text, // Text to encode
        scale: 2, // Smaller scaling factor
        height: 10, // Bar height, in millimeters
        includetext: false, // Hide human-readable text to avoid duplicate phone number
        textxalign: "center", // Always good to set this
      },
      (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      },
    );
  });
};

export const generateCreditCard = async (phoneNumber: string, userId: string): Promise<string> => {
  const fileName = `${phoneNumber.replace(/\+/g, "")}_${userId}.png`;
  const filePath = path.join(TEMP_DIR, fileName);

  if (await exists(filePath)) {
    return filePath; // File already exists, return the path
  }

  const qrCodeText = generateQRCodeText(phoneNumber);

  // Generate QR code
  const qrCodeBuffer = await QRCode.toBuffer(qrCodeText, {
    type: "png",
    width: 200, // Adjusted width for QR code
    margin: 1,
  });

  // Generate Barcode
  const barcodeBuffer = await generateBarcodeImage(phoneNumber.replace(/\+/g, ""));

  // Load both images using Jimp
  const qrCodeImage = await Jimp.read(qrCodeBuffer);
  const barcodeImage = await Jimp.read(barcodeBuffer);

  // Create padding
  const padding = 20;
  const textHeight = 30;

  // Create a new image with enough height to hold both images, padding, and phone number text
  const combinedImage = new Jimp(
    qrCodeImage.bitmap.width + padding * 2,
    qrCodeImage.bitmap.height + barcodeImage.bitmap.height + padding * 3 + textHeight,
    0xffffffff, // White background
  );

  // Combine QR code and barcode images with padding
  combinedImage.composite(qrCodeImage, padding, padding);
  combinedImage.composite(
    barcodeImage,
    (combinedImage.bitmap.width - barcodeImage.bitmap.width) / 2, // Center the barcode
    qrCodeImage.bitmap.height + padding * 2,
  );

  // Load font
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  // Add phone number text below barcode
  const textWidth = Jimp.measureText(font, phoneNumber.replace(/\+/g, ""));
  combinedImage.print(
    font,
    (combinedImage.bitmap.width - textWidth) / 2,
    qrCodeImage.bitmap.height + barcodeImage.bitmap.height + padding * 2,
    phoneNumber.replace(/\+/g, ""),
  );

  // Save the combined image
  await combinedImage.writeAsync(filePath);

  return filePath;
};
