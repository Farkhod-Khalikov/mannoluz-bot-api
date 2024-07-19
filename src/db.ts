//./src/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const conn = process.env.MONGO || "";

export async function initDB() {
  await mongoose
    .connect(conn)
    .then(() => console.log("[SUCCESS] DB is connected."))
    .catch((err) => console.log("[FAILED] DB connection error.\n", err));
}
