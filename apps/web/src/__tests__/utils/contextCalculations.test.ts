import { describe, it, expect } from 'vitest';
import {
  calculateContextBlockChars,
  calculateTotalChars,
  splitContent,
} from '../../utils/contextCalculations';

describe('contextCalculations', () => {
  describe('calculateContextBlockChars', () => {
    it('должен посчитать символы в блоке контекста', () => {
      const block = {
        id: 'block-1',
        title: 'Test Block',
        items: [
          { id: 'item-1', content: 'Hello', chars: 5 },
          { id: 'item-2', content: 'World', chars: 5 },
        ],
      };

      const chars = calculateContextBlockChars(block);
      expect(chars).toBe(10); // 5 + 5
    });

    it('должен посчитать символы с subItems', () => {
      const block = {
        id: 'block-1',
        title: 'Test Block',
        items: [
          {
            id: 'item-1',
            content: 'Original',
            chars: 8,
            subItems: [
              { id: 'sub-1', content: 'Part1', chars: 5 },
              { id: 'sub-2', content: 'Part2', chars: 5 },
            ],
          },
        ],
      };

      const chars = calculateContextBlockChars(block);
      // Должен считать только subItems (5 + 5 = 10), а не item.chars (8)
      expect(chars).toBe(10);
    });

    it('должен вернуть 0 для пустого блока', () => {
      const block = {
        id: 'block-1',
        title: 'Empty Block',
        items: [],
      };

      const chars = calculateContextBlockChars(block);
      expect(chars).toBe(0);
    });

    it('должен обработать блок без items', () => {
      const block = {
        id: 'block-1',
        title: 'No Items',
      };

      const chars = calculateContextBlockChars(block);
      expect(chars).toBe(0);
    });
  });

  describe('calculateTotalChars', () => {
    it('должен посчитать общее количество символов', () => {
      const projectData = {
        contextBlocks: [
          {
            id: 'block-1',
            title: 'Block 1',
            items: [
              { id: 'item-1', content: 'Test', chars: 4 },
            ],
          },
          {
            id: 'block-2',
            title: 'Block 2',
            items: [
              { id: 'item-2', content: 'Hello', chars: 5 },
            ],
          },
        ],
      };

      const total = calculateTotalChars(projectData);
      expect(total).toBe(9); // 4 + 5
    });

    it('должен вернуть 0 если нет блоков', () => {
      const projectData = {
        contextBlocks: [],
      };

      const total = calculateTotalChars(projectData);
      expect(total).toBe(0);
    });

    it('должен обработать undefined', () => {
      const total = calculateTotalChars(undefined);
      expect(total).toBe(0);
    });
  });

  describe('splitContent', () => {
    it('должен разделить текст на части', () => {
      const content = 'Part1\n\nPart2\n\nPart3';
      const parts = splitContent(content, { delimiter: '\n\n' });

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('Part1');
      expect(parts[1]).toBe('Part2');
      expect(parts[2]).toBe('Part3');
    });

    it('должен разделить по количеству символов', () => {
      const content = 'a'.repeat(100);
      const parts = splitContent(content, { charsPerPart: 25 });

      expect(parts).toHaveLength(4);
      expect(parts[0]).toHaveLength(25);
      expect(parts[1]).toHaveLength(25);
      expect(parts[2]).toHaveLength(25);
      expect(parts[3]).toHaveLength(25);
    });

    it('должен обработать пустую строку', () => {
      const parts = splitContent('', { delimiter: '\n' });

      expect(parts).toEqual(['']);
    });

    it('должен удалить пустые части', () => {
      const content = 'Part1\n\n\n\nPart2';
      const parts = splitContent(content, {
        delimiter: '\n',
        removeEmpty: true,
      });

      expect(parts).toHaveLength(2);
      expect(parts).not.toContain('');
    });
  });
});

