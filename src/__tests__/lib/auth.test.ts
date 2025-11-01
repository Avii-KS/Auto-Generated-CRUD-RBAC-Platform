import { describe, it, expect, beforeEach } from 'vitest';
import { createToken, verifyToken, hasPermission } from '@/lib/auth';
import type { User, UserRole } from '@/lib/auth';

describe('Authentication', () => {
  describe('JWT Token Creation and Verification', () => {
    const testUser: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'Manager',
    };

    it('should create a valid JWT token', async () => {
      const token = await createToken(testUser);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid token and return user data', async () => {
      const token = await createToken(testUser);
      const verifiedUser = await verifyToken(token);
      
      expect(verifiedUser).toBeTruthy();
      expect(verifiedUser?.id).toBe(testUser.id);
      expect(verifiedUser?.email).toBe(testUser.email);
      expect(verifiedUser?.name).toBe(testUser.name);
      expect(verifiedUser?.role).toBe(testUser.role);
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      const result = await verifyToken(invalidToken);
      expect(result).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const malformedToken = 'not-a-jwt-token';
      const result = await verifyToken(malformedToken);
      expect(result).toBeNull();
    });

    it('should handle different user roles correctly', async () => {
      const roles: UserRole[] = ['Admin', 'Manager', 'Viewer'];
      
      for (const role of roles) {
        const user: User = {
          id: `${role}-id`,
          email: `${role.toLowerCase()}@example.com`,
          name: role,
          role,
        };
        
        const token = await createToken(user);
        const verified = await verifyToken(token);
        
        expect(verified?.role).toBe(role);
      }
    });
  });

  describe('Permission Hierarchy', () => {
    it('should allow Admin to access Admin-level resources', () => {
      expect(hasPermission('Admin', 'Admin')).toBe(true);
    });

    it('should allow Admin to access Manager-level resources', () => {
      expect(hasPermission('Admin', 'Manager')).toBe(true);
    });

    it('should allow Admin to access Viewer-level resources', () => {
      expect(hasPermission('Admin', 'Viewer')).toBe(true);
    });

    it('should deny Manager access to Admin-level resources', () => {
      expect(hasPermission('Manager', 'Admin')).toBe(false);
    });

    it('should allow Manager to access Manager-level resources', () => {
      expect(hasPermission('Manager', 'Manager')).toBe(true);
    });

    it('should allow Manager to access Viewer-level resources', () => {
      expect(hasPermission('Manager', 'Viewer')).toBe(true);
    });

    it('should deny Viewer access to Admin-level resources', () => {
      expect(hasPermission('Viewer', 'Admin')).toBe(false);
    });

    it('should deny Viewer access to Manager-level resources', () => {
      expect(hasPermission('Viewer', 'Manager')).toBe(false);
    });

    it('should allow Viewer to access Viewer-level resources', () => {
      expect(hasPermission('Viewer', 'Viewer')).toBe(true);
    });
  });

  describe('Permission Hierarchy Edge Cases', () => {
    it('should maintain strict hierarchy ordering', () => {
      // Admin > Manager > Viewer
      expect(hasPermission('Admin', 'Manager')).toBe(true);
      expect(hasPermission('Admin', 'Viewer')).toBe(true);
      expect(hasPermission('Manager', 'Viewer')).toBe(true);
      
      // Reverse should be false
      expect(hasPermission('Manager', 'Admin')).toBe(false);
      expect(hasPermission('Viewer', 'Admin')).toBe(false);
      expect(hasPermission('Viewer', 'Manager')).toBe(false);
    });
  });
});
