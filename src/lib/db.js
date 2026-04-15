import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não definida nas variáveis de ambiente')
}

let cached = globalThis._mongoose

if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null // permite retry na próxima requisição
    throw err
  }
  return cached.conn
}
