import mongoose from 'mongoose';

export async function initDB(conn: string) {
  await mongoose
    .connect(conn)
    .then(() => console.log('[SUCCESS] DB is connected.'))
    .catch((err) => console.log('[FAILED] DB connection error.\n', err));
}
