import dotenv from 'dotenv'
dotenv.config()

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: required('MONGODB_URI'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}
