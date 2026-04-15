import mongoose from 'mongoose'
import { env } from './env'

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.info(`MongoDB connected: ${env.MONGODB_URI}`)
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}
