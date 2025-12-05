import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../utils/crypto.utils';

describe('Crypto Utils', () => {
  const ENCRYPTION_KEY = 'a'.repeat(32); // 32-byte ключ для AES-256

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('должен зашифровать строку', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/); // iv:encrypted:authTag
    });

    it('должен создавать разные зашифрованные строки при каждом вызове', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2); // Разные IV
    });

    it('должен корректно шифровать пустую строку', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    });

    it('должен корректно шифровать Unicode символы', () => {
      const plaintext = 'Тестовый ключ 🔐';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);
    });

    it('должен выбросить ошибку если ENCRYPTION_KEY не установлен', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow(/ENCRYPTION_KEY/);

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('decrypt', () => {
    it('должен расшифровать зашифрованную строку', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('должен корректно расшифровывать пустую строку', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('должен корректно расшифровывать Unicode символы', () => {
      const plaintext = 'Тестовый ключ 🔐';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('должен выбросить ошибку при неверном формате', () => {
      expect(() => decrypt('invalid-format')).toThrow();
    });

    it('должен выбросить ошибку при подделке данных (нарушение auth tag)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      // Подменяем часть зашифрованных данных
      const [iv, encryptedData, authTag] = encrypted.split(':');
      const tamperedEncrypted = `${iv}:${'0'.repeat(encryptedData.length)}:${authTag}`;

      expect(() => decrypt(tamperedEncrypted)).toThrow();
    });

    it('должен выбросить ошибку если ENCRYPTION_KEY не установлен', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => decrypt(encrypted)).toThrow(/ENCRYPTION_KEY/);

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('должен выбросить ошибку при использовании неверного ключа', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encrypt(plaintext);

      // Меняем ключ
      process.env.ENCRYPTION_KEY = 'b'.repeat(32);

      expect(() => decrypt(encrypted)).toThrow();

      // Восстанавливаем
      process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
    });
  });

  describe('encrypt/decrypt круговой тест', () => {
    it('должен корректно работать для длинных строк', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('должен корректно работать для специальных символов', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('должен корректно работать для многострочного текста', () => {
      const plaintext = 'line1\nline2\nline3\r\nline4';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});

