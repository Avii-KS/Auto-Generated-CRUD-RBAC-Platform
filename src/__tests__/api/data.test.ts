import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canPerformAction, checkOwnership } from '@/lib/rbac';
import { validateModelData } from '@/lib/models';
import type { Model } from '@/lib/models';
import type { UserRole } from '@/lib/auth';

describe('API Data Validation and RBAC', () => {
  const mockModel: Model = {
    name: 'Product',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'price', type: 'number', required: true },
      { name: 'inStock', type: 'boolean', required: false },
      { name: 'email', type: 'email', required: false },
      { name: 'website', type: 'url', required: false },
    ],
    ownerField: 'ownerId',
    permissions: {
      create: ['Admin', 'Manager'],
      read: ['Admin', 'Manager', 'Viewer'],
      update: ['Admin', 'Manager'],
      delete: ['Admin'],
    },
  };

  describe('Data Validation', () => {
    it('should validate valid data', () => {
      const validData = {
        name: 'Test Product',
        price: 99.99,
        inStock: true,
      };
      
      const errors = validateModelData(validData, mockModel);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        price: 99.99,
      };
      
      const errors = validateModelData(invalidData, mockModel);
      expect(errors.name).toBeDefined();
    });

    it('should validate number types', () => {
      const invalidData = {
        name: 'Product',
        price: 'not-a-number',
      };
      
      const errors = validateModelData(invalidData, mockModel);
      expect(errors.price).toBeDefined();
    });

    it('should validate boolean types', () => {
      const invalidData = {
        name: 'Product',
        price: 100,
        inStock: 'yes',
      };
      
      const errors = validateModelData(invalidData, mockModel);
      expect(errors.inStock).toBeDefined();
    });

    it('should validate email format', () => {
      const invalidData = {
        name: 'Product',
        price: 100,
        email: 'not-an-email',
      };
      
      const errors = validateModelData(invalidData, mockModel);
      expect(errors.email).toBeDefined();
    });

    it('should validate URL format', () => {
      const invalidData = {
        name: 'Product',
        price: 100,
        website: 'not-a-url',
      };
      
      const errors = validateModelData(invalidData, mockModel);
      expect(errors.website).toBeDefined();
    });

    it('should accept valid email and URL', () => {
      const validData = {
        name: 'Product',
        price: 100,
        email: 'test@example.com',
        website: 'https://example.com',
      };
      
      const errors = validateModelData(validData, mockModel);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should handle optional fields', () => {
      const dataWithoutOptional = {
        name: 'Product',
        price: 100,
      };
      
      const errors = validateModelData(dataWithoutOptional, mockModel);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('API RBAC Integration', () => {
    describe('Create Operations', () => {
      it('should allow Admin to create', () => {
        const result = canPerformAction('Admin', 'create', mockModel.permissions);
        expect(result).toBe(true);
      });

      it('should allow Manager to create', () => {
        const result = canPerformAction('Manager', 'create', mockModel.permissions);
        expect(result).toBe(true);
      });

      it('should deny Viewer to create', () => {
        const result = canPerformAction('Viewer', 'create', mockModel.permissions);
        expect(result).toBe(false);
      });
    });

    describe('Read Operations', () => {
      it('should allow all roles to read', () => {
        const roles: UserRole[] = ['Admin', 'Manager', 'Viewer'];
        roles.forEach((role) => {
          const result = canPerformAction(role, 'read', mockModel.permissions);
          expect(result).toBe(true);
        });
      });
    });

    describe('Update Operations', () => {
      it('should allow Admin and Manager to update', () => {
        expect(canPerformAction('Admin', 'update', mockModel.permissions)).toBe(true);
        expect(canPerformAction('Manager', 'update', mockModel.permissions)).toBe(true);
      });

      it('should deny Viewer to update', () => {
        expect(canPerformAction('Viewer', 'update', mockModel.permissions)).toBe(false);
      });
    });

    describe('Delete Operations', () => {
      it('should only allow Admin to delete', () => {
        expect(canPerformAction('Admin', 'delete', mockModel.permissions)).toBe(true);
        expect(canPerformAction('Manager', 'delete', mockModel.permissions)).toBe(false);
        expect(canPerformAction('Viewer', 'delete', mockModel.permissions)).toBe(false);
      });
    });
  });

  describe('Ownership Filtering', () => {
    const adminUser = { id: 'admin-1', role: 'Admin' as UserRole };
    const managerUser = { id: 'manager-1', role: 'Manager' as UserRole };
    const viewerUser = { id: 'viewer-1', role: 'Viewer' as UserRole };

    const mockRecords = [
      { id: '1', name: 'Product 1', ownerId: 'admin-1' },
      { id: '2', name: 'Product 2', ownerId: 'manager-1' },
      { id: '3', name: 'Product 3', ownerId: 'viewer-1' },
      { id: '4', name: 'Product 4', ownerId: undefined },
    ];

    it('should show all records to Admin', () => {
      const filtered = mockRecords.filter((record) =>
        checkOwnership(adminUser.id, record.ownerId, adminUser.role)
      );
      expect(filtered).toHaveLength(4);
    });

    it('should filter records for Manager to show only owned', () => {
      const filtered = mockRecords.filter((record) => {
        if (!record.ownerId) return true;
        return checkOwnership(managerUser.id, record.ownerId, managerUser.role);
      });
      expect(filtered).toHaveLength(2); // manager's own + undefined owner
      expect(filtered.map((r) => r.id)).toContain('2');
      expect(filtered.map((r) => r.id)).toContain('4');
    });

    it('should filter records for Viewer to show only owned', () => {
      const filtered = mockRecords.filter((record) => {
        if (!record.ownerId) return true;
        return checkOwnership(viewerUser.id, record.ownerId, viewerUser.role);
      });
      expect(filtered).toHaveLength(2); // viewer's own + undefined owner
      expect(filtered.map((r) => r.id)).toContain('3');
      expect(filtered.map((r) => r.id)).toContain('4');
    });
  });

  describe('Model Definition Edge Cases', () => {
    it('should handle model without permissions', () => {
      const modelWithoutPermissions: Model = {
        name: 'SimpleModel',
        fields: [{ name: 'name', type: 'string', required: true }],
      };

      // Should default to Admin-only
      expect(canPerformAction('Admin', 'create')).toBe(true);
      expect(canPerformAction('Manager', 'create')).toBe(false);
    });

    it('should handle model without ownerField', () => {
      const modelWithoutOwner: Model = {
        name: 'PublicModel',
        fields: [{ name: 'name', type: 'string', required: true }],
        permissions: {
          read: ['Admin', 'Manager', 'Viewer'],
        },
      };

      // All users should see all records when no ownerField
      const record = { id: '1', name: 'Public' };
      expect(checkOwnership('user-1', undefined, 'Viewer')).toBe(true);
    });

    it('should validate date field types', () => {
      const modelWithDate: Model = {
        name: 'Event',
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'eventDate', type: 'date', required: true },
        ],
      };

      const validData = {
        name: 'Conference',
        eventDate: '2025-12-31',
      };

      const invalidData = {
        name: 'Conference',
        eventDate: 'not-a-date',
      };

      const validErrors = validateModelData(validData, modelWithDate);
      expect(Object.keys(validErrors)).toHaveLength(0);

      const invalidErrors = validateModelData(invalidData, modelWithDate);
      expect(invalidErrors.eventDate).toBeDefined();
    });
  });
});
