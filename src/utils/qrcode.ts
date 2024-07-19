import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

const TEMP_DIR = path.join(__dirname, "../temp"); // Adjust the path if needed

export const generateQRCodeText = (
  chatId: number,
  phoneNumber: string
): string => {
  return `ChatID: ${chatId}, PhoneNumber: ${phoneNumber}`; // Example text; adjust as needed
};

export const generateAndSaveQRCodePng = async (
  chatId: number,
  phoneNumber: string
): Promise<string> => {
  const fileName = `${chatId}_${phoneNumber.replace(/\+/g, "")}.png`;
  const filePath = path.join(TEMP_DIR, fileName);

  if (await exists(filePath)) {
    return filePath; // File already exists, return the path
  }

  const qrCodeText = generateQRCodeText(chatId, phoneNumber);

  await QRCode.toFile(filePath, qrCodeText, {
    type: "png",
    width: 300,
    margin: 1,
  });

  return filePath;
};
