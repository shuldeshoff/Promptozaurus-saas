import { describe, it, expect } from 'vitest';
import {
  calculateContextBlockChars,
  calculatePromptContextChars,
  compilePrompt,
  validateContextBlock,
  validatePromptBlock,
  updateContextItemChars,
} from '../utils/prompt.utils';
import { ContextBlock, PromptBlock, ContextItem, ContextSubItem } from '@promptozaurus/shared';

describe('Prompt Utils', () => {
  // Mock data
  const mockContextBlock: ContextBlock = {
    id: 1,
    title: 'Test Context',
    items: [
      {
        id: 1,
        title: 'Item 1',
        content: 'Content 1',
        chars: 9,
        subItems: [
          {
            id: 1,
            title: 'SubItem 1',
            content: 'SubContent 1',
            chars: 12,
          },
          {
            id: 2,
            title: 'SubItem 2',
            content: 'SubContent 2',
            chars: 12,
          },
        ],
      },
      {
        id: 2,
        title: 'Item 2',
        content: 'Content 2',
        chars: 9,
        subItems: [],
      },
    ],
  };

  const mockPromptBlock: PromptBlock = {
    id: 1,
    title: 'Test Prompt',
    template: 'This is a prompt with {{context}} placeholder',
    selectedContexts: [
      {
        blockId: 1,
        itemIds: [1, 2],
        subItemIds: ['1.1', '1.2'],
      },
    ],
  };

  describe('calculateContextBlockChars', () => {
    it('should calculate total chars including subitems', () => {
      const total = calculateContextBlockChars(mockContextBlock);
      // Item 1 (9) + SubItem 1 (12) + SubItem 2 (12) + Item 2 (9) = 42
      expect(total).toBe(42);
    });

    it('should handle empty items', () => {
      const emptyBlock: ContextBlock = {
        id: 1,
        title: 'Empty',
        items: [],
      };
      expect(calculateContextBlockChars(emptyBlock)).toBe(0);
    });

    it('should handle items without subitems', () => {
      const blockNoSubs: ContextBlock = {
        id: 1,
        title: 'No Subs',
        items: [
          {
            id: 1,
            title: 'Item',
            content: 'Content',
            chars: 7,
            subItems: [],
          },
        ],
      };
      expect(calculateContextBlockChars(blockNoSubs)).toBe(7);
    });
  });

  describe('calculatePromptContextChars', () => {
    it('should calculate chars from selected contexts', () => {
      const contextBlocks = [mockContextBlock];
      const chars = calculatePromptContextChars(mockPromptBlock, contextBlocks);
      // Item 1 (9) + Item 2 (9) + SubItem 1 (12) + SubItem 2 (12) = 42
      expect(chars).toBe(42);
    });

    it('should return 0 if context block not found', () => {
      const chars = calculatePromptContextChars(mockPromptBlock, []);
      expect(chars).toBe(0);
    });

    it('should handle only item selection', () => {
      const prompt: PromptBlock = {
        ...mockPromptBlock,
        selectedContexts: [
          {
            blockId: 1,
            itemIds: [2],
            subItemIds: [],
          },
        ],
      };
      const chars = calculatePromptContextChars(prompt, [mockContextBlock]);
      expect(chars).toBe(9); // Only Item 2
    });

    it('should handle only subitem selection', () => {
      const prompt: PromptBlock = {
        ...mockPromptBlock,
        selectedContexts: [
          {
            blockId: 1,
            itemIds: [],
            subItemIds: ['1.1'],
          },
        ],
      };
      const chars = calculatePromptContextChars(prompt, [mockContextBlock]);
      expect(chars).toBe(12); // Only SubItem 1
    });
  });

  describe('compilePrompt', () => {
    it('should replace {{context}} placeholder', () => {
      const contextBlocks = [mockContextBlock];
      const compiled = compilePrompt(mockPromptBlock, contextBlocks, false);
      
      expect(compiled).toContain('Content 1');
      expect(compiled).toContain('Content 2');
      expect(compiled).toContain('SubContent 1');
      expect(compiled).toContain('SubContent 2');
      expect(compiled).not.toContain('{{context}}');
    });

    it('should wrap with tags when wrapWithTags=true', () => {
      const contextBlocks = [mockContextBlock];
      const compiled = compilePrompt(mockPromptBlock, contextBlocks, true);
      
      expect(compiled).toContain('<Context>');
      expect(compiled).toContain('</Context>');
      expect(compiled).toContain('<Test Context>');
      expect(compiled).toContain('</Test Context>');
      expect(compiled).toContain('<Item 1>');
      expect(compiled).toContain('</Item 1>');
    });

    it('should handle empty selected contexts', () => {
      const prompt: PromptBlock = {
        ...mockPromptBlock,
        selectedContexts: [],
      };
      const compiled = compilePrompt(prompt, [mockContextBlock], false);
      
      expect(compiled).toContain('placeholder');
      expect(compiled).not.toContain('Content');
    });

    it('should support legacy [КОНТЕКСТ] placeholder', () => {
      const prompt: PromptBlock = {
        ...mockPromptBlock,
        template: 'Legacy prompt with [КОНТЕКСТ] here',
      };
      const compiled = compilePrompt(prompt, [mockContextBlock], false);
      
      expect(compiled).toContain('Content');
      expect(compiled).not.toContain('[КОНТЕКСТ]');
    });
  });

  describe('updateContextItemChars', () => {
    it('should update chars based on content length', () => {
      const item: ContextItem = {
        id: 1,
        title: 'Test',
        content: 'New content here',
        chars: 0, // Old value
        subItems: [
          {
            id: 1,
            title: 'Sub',
            content: 'Sub content',
            chars: 0,
          },
        ],
      };

      const updated = updateContextItemChars(item);
      
      expect(updated.chars).toBe(16); // 'New content here'.length
      expect(updated.subItems[0].chars).toBe(11); // 'Sub content'.length
    });
  });

  describe('validateContextBlock', () => {
    it('should validate correct context block', () => {
      expect(validateContextBlock(mockContextBlock)).toBe(true);
    });

    it('should reject block without id', () => {
      const invalid = { ...mockContextBlock, id: undefined as any };
      expect(validateContextBlock(invalid)).toBe(false);
    });

    it('should reject block without title', () => {
      const invalid = { ...mockContextBlock, title: '' };
      expect(validateContextBlock(invalid)).toBe(false);
    });

    it('should reject block with invalid items', () => {
      const invalid: ContextBlock = {
        ...mockContextBlock,
        items: [{ id: 'invalid' } as any],
      };
      expect(validateContextBlock(invalid)).toBe(false);
    });

    it('should reject item with invalid subItems', () => {
      const invalid: ContextBlock = {
        ...mockContextBlock,
        items: [
          {
            ...mockContextBlock.items[0],
            subItems: [{ id: 'invalid' } as any],
          },
        ],
      };
      expect(validateContextBlock(invalid)).toBe(false);
    });
  });

  describe('validatePromptBlock', () => {
    it('should validate correct prompt block', () => {
      expect(validatePromptBlock(mockPromptBlock)).toBe(true);
    });

    it('should reject prompt without id', () => {
      const invalid = { ...mockPromptBlock, id: undefined as any };
      expect(validatePromptBlock(invalid)).toBe(false);
    });

    it('should reject prompt without title', () => {
      const invalid = { ...mockPromptBlock, title: '' };
      expect(validatePromptBlock(invalid)).toBe(false);
    });

    it('should reject prompt with invalid selectedContexts', () => {
      const invalid: PromptBlock = {
        ...mockPromptBlock,
        selectedContexts: [{ blockId: 'invalid' } as any],
      };
      expect(validatePromptBlock(invalid)).toBe(false);
    });

    it('should validate prompt with empty selectedContexts', () => {
      const valid: PromptBlock = {
        ...mockPromptBlock,
        selectedContexts: [],
      };
      expect(validatePromptBlock(valid)).toBe(true);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should handle complete context → prompt → compile flow', () => {
      // 1. Create context
      const context: ContextBlock = {
        id: 1,
        title: 'My Context',
        items: [
          {
            id: 1,
            title: 'Background',
            content: 'User is a developer',
            chars: 21,
            subItems: [
              {
                id: 1,
                title: 'Skills',
                content: 'TypeScript, React',
                chars: 17,
              },
            ],
          },
        ],
      };

      // 2. Validate context
      expect(validateContextBlock(context)).toBe(true);

      // 3. Calculate chars
      const totalChars = calculateContextBlockChars(context);
      expect(totalChars).toBe(38); // 21 + 17

      // 4. Create prompt
      const prompt: PromptBlock = {
        id: 1,
        title: 'Code Review',
        template: 'Given this context:\n{{context}}\n\nPerform code review.',
        selectedContexts: [
          {
            blockId: 1,
            itemIds: [1],
            subItemIds: ['1.1'],
          },
        ],
      };

      // 5. Validate prompt
      expect(validatePromptBlock(prompt)).toBe(true);

      // 6. Calculate prompt context chars
      const promptChars = calculatePromptContextChars(prompt, [context]);
      expect(promptChars).toBe(38);

      // 7. Compile
      const compiled = compilePrompt(prompt, [context], false);
      expect(compiled).toContain('User is a developer');
      expect(compiled).toContain('TypeScript, React');
      expect(compiled).toContain('Perform code review');
      expect(compiled).not.toContain('{{context}}');

      // 8. Compile with tags
      const compiledWithTags = compilePrompt(prompt, [context], true);
      expect(compiledWithTags).toContain('<Context>');
      expect(compiledWithTags).toContain('<My Context>');
      expect(compiledWithTags).toContain('<Background>');
      expect(compiledWithTags).toContain('<Skills>');
    });
  });
});

