import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, validateEncrypted, generateEncryptionKey } from './encryption.service';

describe('Encryption Service', () => {
  // Set a test encryption key
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long-for-testing';
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = encrypt(plainText);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.split(':')).toHaveLength(4); // salt:iv:authTag:encrypted
    });

    it('should produce different ciphertext for same input (due to random salt/IV)', () => {
      const plainText = 'my-secret-api-key';
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error if ENCRYPTION_KEY is too short', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'short';

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be at least 32 characters long');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error if ENCRYPTION_KEY is missing', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be at least 32 characters long');

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted string correctly', () => {
      const plainText = 'my-secret-api-key-12345';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt complex strings with special characters', () => {
      const plainText = 'sk-proj-1234!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt long strings', () => {
      const plainText = 'a'.repeat(1000);
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted data format');
    });

    it('should throw error for tampered data', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = encrypt(plainText);
      const tampered = encrypted.replace(/.$/, 'x'); // Change last character

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error if ENCRYPTION_KEY is missing during decryption', () => {
      const plainText = 'test';
      const encrypted = encrypt(plainText);

      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_KEY must be at least 32 characters long');

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('validateEncrypted', () => {
    it('should return true for valid encrypted data', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = encrypt(plainText);

      expect(validateEncrypted(encrypted)).toBe(true);
    });

    it('should return false for invalid encrypted data', () => {
      expect(validateEncrypted('invalid-data')).toBe(false);
    });

    it('should return false for tampered data', () => {
      const plainText = 'my-secret-api-key';
      const encrypted = encrypt(plainText);
      const tampered = encrypted.replace(/.$/, 'x');

      expect(validateEncrypted(tampered)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateEncrypted('')).toBe(false);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a key of default length (32 bytes = 64 hex chars)', () => {
      const key = generateEncryptionKey();

      expect(key).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(/^[a-f0-9]+$/.test(key)).toBe(true); // Should be hex
    });

    it('should generate a key of specified length', () => {
      const key = generateEncryptionKey(16);

      expect(key).toHaveLength(32); // 16 bytes in hex = 32 characters
      expect(/^[a-f0-9]+$/.test(key)).toBe(true);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('Round-trip encryption', () => {
    it('should handle empty strings', () => {
      const plainText = '';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle Unicode characters', () => {
      const plainText = 'Hello 世界 🌍 مرحبا';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle newlines and special whitespace', () => {
      const plainText = 'Line 1\nLine 2\tTabbed\r\nWindows Style';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should handle JSON strings', () => {
      const plainText = JSON.stringify({ key: 'value', nested: { data: 123 } });
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
      expect(JSON.parse(decrypted)).toEqual({ key: 'value', nested: { data: 123 } });
    });
  });

  describe('Security properties', () => {
    it('should use authentication tag (GCM mode)', () => {
      const plainText = 'test';
      const encrypted = encrypt(plainText);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(4);
      expect(parts[2]).toHaveLength(32); // Auth tag should be 16 bytes = 32 hex chars
    });

    it('should use unique IV for each encryption', () => {
      const plainText = 'test';
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      const iv1 = encrypted1.split(':')[1];
      const iv2 = encrypted2.split(':')[1];

      expect(iv1).not.toBe(iv2);
    });

    it('should use unique salt for each encryption', () => {
      const plainText = 'test';
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      const salt1 = encrypted1.split(':')[0];
      const salt2 = encrypted2.split(':')[0];

      expect(salt1).not.toBe(salt2);
    });
  });
});

