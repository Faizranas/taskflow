import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../utils/AppError'

// ─── Mocks ──────────────────────────────────────────
vi.mock('./auth.schema', () => ({
  UserModel: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
  RefreshTokenModel: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

vi.mock('../../utils/jwt', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn(),
}))

import { UserModel, RefreshTokenModel } from './auth.schema'
import bcrypt from 'bcrypt'
import { verifyRefreshToken } from '../../utils/jwt'
import * as authService from './auth.service'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Register ───────────────────────────────────────
describe('register', () => {
  it('creates user and returns user without password', async () => {
    vi.mocked(UserModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findOne>)

    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pw' as never)

    vi.mocked(UserModel.create).mockResolvedValue({
      _id: { toString: () => '64f1a2b3c4d5e6f7a8b9c0d1' },
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
    } as never)

    const result = await authService.register('test@example.com', 'password123')

    expect(result.user).toEqual({
      id: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'test@example.com',
      createdAt: new Date('2024-01-01'),
    })
    expect(result.user).not.toHaveProperty('password')
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
  })

  it('throws CONFLICT when email already exists', async () => {
    vi.mocked(UserModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: 'existing-id', email: 'test@example.com' }),
    } as unknown as ReturnType<typeof UserModel.findOne>)

    await expect(authService.register('test@example.com', 'password123'))
      .rejects.toThrow(AppError)

    try {
      await authService.register('test@example.com', 'password123')
    } catch (err) {
      expect((err as AppError).status).toBe(409)
      expect((err as AppError).code).toBe('CONFLICT')
    }
  })
})

// ─── Login ──────────────────────────────────────────
describe('login', () => {
  const mockUser = {
    _id: { toString: () => '64f1a2b3c4d5e6f7a8b9c0d1' },
    email: 'test@example.com',
    password: 'hashed-pw',
    createdAt: new Date('2024-01-01'),
  }

  it('returns accessToken, refreshToken, and user on success', async () => {
    vi.mocked(UserModel.findOne).mockResolvedValue(mockUser as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(RefreshTokenModel.create).mockResolvedValue({} as never)

    const result = await authService.login('test@example.com', 'password123')

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user).not.toHaveProperty('password')
  })

  it('throws UNAUTHORIZED when email not found', async () => {
    vi.mocked(UserModel.findOne).mockResolvedValue(null)

    try {
      await authService.login('wrong@example.com', 'password123')
    } catch (err) {
      expect((err as AppError).status).toBe(401)
      expect((err as AppError).code).toBe('UNAUTHORIZED')
    }
  })

  it('throws UNAUTHORIZED when password is wrong', async () => {
    vi.mocked(UserModel.findOne).mockResolvedValue(mockUser as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    try {
      await authService.login('test@example.com', 'wrongpassword')
    } catch (err) {
      expect((err as AppError).status).toBe(401)
      expect((err as AppError).code).toBe('UNAUTHORIZED')
    }
  })
})

// ─── Refresh ────────────────────────────────────────
describe('refresh', () => {
  it('deletes old token and returns new tokens on success', async () => {
    vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'user-id' })

    vi.mocked(RefreshTokenModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'token-id',
        token: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 100000),
      }),
    } as unknown as ReturnType<typeof RefreshTokenModel.findOne>)

    vi.mocked(RefreshTokenModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

    vi.mocked(UserModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => 'user-id' },
        email: 'test@example.com',
      }),
    } as unknown as ReturnType<typeof UserModel.findById>)

    vi.mocked(RefreshTokenModel.create).mockResolvedValue({} as never)

    const result = await authService.refresh('old-refresh-token')

    expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: 'token-id' })
    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
  })

  it('throws UNAUTHORIZED when token signature is invalid', async () => {
    vi.mocked(verifyRefreshToken).mockImplementation(() => {
      throw new Error('invalid signature')
    })

    try {
      await authService.refresh('bad-token')
    } catch (err) {
      expect((err as AppError).status).toBe(401)
      expect((err as AppError).code).toBe('UNAUTHORIZED')
    }
  })

  it('throws UNAUTHORIZED when token is expired in DB', async () => {
    vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'user-id' })

    vi.mocked(RefreshTokenModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'token-id',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 100000), // expired
      }),
    } as unknown as ReturnType<typeof RefreshTokenModel.findOne>)

    try {
      await authService.refresh('expired-token')
    } catch (err) {
      expect((err as AppError).status).toBe(401)
      expect((err as AppError).code).toBe('UNAUTHORIZED')
    }
  })
})

// ─── Logout ─────────────────────────────────────────
describe('logout', () => {
  it('deletes the refresh token from DB', async () => {
    vi.mocked(RefreshTokenModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

    await expect(authService.logout('some-token')).resolves.toBeUndefined()
    expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({ token: 'some-token' })
  })

  it('does not throw when token is not found', async () => {
    vi.mocked(RefreshTokenModel.deleteOne).mockResolvedValue({ deletedCount: 0 } as never)

    await expect(authService.logout('nonexistent-token')).resolves.toBeUndefined()
  })
})
