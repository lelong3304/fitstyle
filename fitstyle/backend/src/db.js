import mongoose from "mongoose";

let connectionPromise = null;

export function hasMongoConfig() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDatabase() {
  if (!hasMongoConfig()) return null;
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "fitstyle_ai"
  });

  return connectionPromise;
}
