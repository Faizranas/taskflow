import jwt, { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'

interface AccessTokenPayload {
  userId: string
  email: string
}

interface RefreshTokenPayload {
  userId: string
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options)
}

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options)
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}
