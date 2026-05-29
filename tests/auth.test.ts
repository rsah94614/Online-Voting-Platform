/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { signToken, verifyToken, requireRole, JWTPayload } from '@/lib/auth';
import { Role } from '@prisma/client';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}));

describe('Auth Service', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: 'user-123',
    email: 'test@votex.io',
    name: 'Test User',
    role: Role.VOTER,
  };

  it('should sign and verify a token successfully', async () => {
    const token = await signToken(mockPayload);
    expect(typeof token).toBe('string');
    
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(mockPayload.sub);
    expect(decoded?.email).toBe(mockPayload.email);
    expect(decoded?.role).toBe(mockPayload.role);
  });

  it('should return null for an invalid token', async () => {
    const decoded = await verifyToken('invalid.token.string');
    expect(decoded).toBeNull();
  });

  describe('requireRole', () => {
    it('should return true if user has required role', () => {
      const user = { ...mockPayload } as JWTPayload;
      expect(requireRole(user, Role.VOTER)).toBe(true);
      expect(requireRole(user, Role.ADMIN, Role.VOTER)).toBe(true);
    });

    it('should return false if user lacks required role', () => {
      const user = { ...mockPayload } as JWTPayload;
      expect(requireRole(user, Role.ADMIN)).toBe(false);
      expect(requireRole(user, Role.CANDIDATE, Role.PARTY_ADMIN)).toBe(false);
    });

    it('should return false if user is null', () => {
      expect(requireRole(null, Role.VOTER)).toBe(false);
    });
  });
});
