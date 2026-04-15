import bcrypt from 'bcrypt'
import { UserModel } from './auth.schema'
import { RefreshTokenModel } from './auth.schema'
import { AppError } from '../../utils/AppError'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'

const BCRYPT_ROUNDS = 12

interface UserResponse {
  id: string
  email: string
  createdAt: Date
}

interface LoginResult {
  accessToken: string
  refreshToken: string
  user: UserResponse
}

interface RefreshResult {
  accessToken: string
  refreshToken: string
}

export const register = async (
  email: string,
  password: string
): Promise<{ user: UserResponse }> => {
  const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean()
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'CONFLICT')
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = await UserModel.create({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  })

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
    },
  }
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED')
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED')
  }

  const userId = user._id.toString()

  const accessToken = signAccessToken({ userId, email: user.email })
  const refreshToken = signRefreshToken({ userId })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await RefreshTokenModel.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: user.email,
      createdAt: user.createdAt,
    },
  }
}

export const refresh = async (
  refreshToken: string
): Promise<RefreshResult> => {
  let payload: { userId: string }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED')
  }

  const storedToken = await RefreshTokenModel.findOne({ token: refreshToken }).lean()
  if (!storedToken) {
    throw new AppError('Refresh token not found', 401, 'UNAUTHORIZED')
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new AppError('Refresh token expired', 401, 'UNAUTHORIZED')
  }

  // Token rotation: delete old token
  await RefreshTokenModel.deleteOne({ _id: storedToken._id })

  const user = await UserModel.findById(payload.userId).lean()
  if (!user) {
    throw new AppError('User not found', 401, 'UNAUTHORIZED')
  }

  const userId = user._id.toString()
  const newAccessToken = signAccessToken({ userId, email: user.email })
  const newRefreshToken = signRefreshToken({ userId })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await RefreshTokenModel.create({
    userId: user._id,
    token: newRefreshToken,
    expiresAt,
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export const logout = async (refreshToken: string): Promise<void> => {
  await RefreshTokenModel.deleteOne({ token: refreshToken })
}
