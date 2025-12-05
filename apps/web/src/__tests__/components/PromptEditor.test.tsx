import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptEditor } from '../../components/prompt/PromptEditor';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'ru',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('PromptEditor', () => {
  const mockPrompt = {
    id: 'prompt-1',
    title: 'Test Prompt',
    template: 'This is a test prompt with {{variable}}',
    variables: { variable: 'value' },
    chars: 40,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен отобразить промпт', () => {
    render(<PromptEditor prompt={mockPrompt} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('Test Prompt')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/This is a test prompt/)
    ).toBeInTheDocument();
  });

  it('должен вызвать onChange при редактировании названия', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<PromptEditor prompt={mockPrompt} onChange={handleChange} />);

    const titleInput = screen.getByDisplayValue('Test Prompt');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      title: 'New Title',
    });
  });

  it('должен вызвать onChange при редактировании шаблона', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<PromptEditor prompt={mockPrompt} onChange={handleChange} />);

    const templateTextarea = screen.getByDisplayValue(/This is a test prompt/);
    await user.type(templateTextarea, ' additional text');

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });

  it('должен извлечь переменные из шаблона', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<PromptEditor prompt={mockPrompt} onChange={handleChange} />);

    const templateTextarea = screen.getByDisplayValue(/This is a test prompt/);
    await user.clear(templateTextarea);
    await user.type(templateTextarea, 'New {{var1}} and {{var2}}');

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });

    // Проверяем что переменные отображаются
    expect(screen.getByText(/var1/)).toBeInTheDocument();
    expect(screen.getByText(/var2/)).toBeInTheDocument();
  });

  it('должен отобразить количество символов', () => {
    render(<PromptEditor prompt={mockPrompt} onChange={vi.fn()} />);

    expect(screen.getByText(/40.*символ/i)).toBeInTheDocument();
  });

  it('должен обработать промпт без переменных', () => {
    const simplePrompt = {
      id: 'prompt-2',
      title: 'Simple Prompt',
      template: 'Simple prompt without variables',
      chars: 30,
    };

    render(<PromptEditor prompt={simplePrompt} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('Simple Prompt')).toBeInTheDocument();
    expect(screen.queryByText(/variables/i)).not.toBeInTheDocument();
  });

  it('должен показать предупреждение при превышении лимита', () => {
    const largePrompt = {
      id: 'prompt-3',
      title: 'Large Prompt',
      template: 'a'.repeat(6_000_000), // 6M символов (больше лимита 5M)
      chars: 6_000_000,
    };

    render(<PromptEditor prompt={largePrompt} onChange={vi.fn()} />);

    expect(screen.getByText(/превышен лимит/i)).toBeInTheDocument();
  });

  it('должен обработать дебаунс при быстром наборе', async () => {
    const user = userEvent.setup({ delay: null }); // Без задержки
    const handleChange = vi.fn();

    render(<PromptEditor prompt={mockPrompt} onChange={handleChange} />);

    const titleInput = screen.getByDisplayValue('Test Prompt');

    // Быстро набираем текст
    await user.type(titleInput, 'abcdef');

    // Ожидаем дебаунс (500ms)
    await waitFor(
      () => {
        expect(handleChange).toHaveBeenCalled();
      },
      { timeout: 600 }
    );

    // Проверяем что onChange вызван меньше раз чем набрано символов (благодаря дебаунсу)
    expect(handleChange.mock.calls.length).toBeLessThan(6);
  });

  it('должен вызвать onDelete при удалении', () => {
    const handleDelete = vi.fn();

    render(
      <PromptEditor
        prompt={mockPrompt}
        onChange={vi.fn()}
        onDelete={handleDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith('prompt-1');
  });

  it('должен вызвать onDuplicate при дублировании', () => {
    const handleDuplicate = vi.fn();

    render(
      <PromptEditor
        prompt={mockPrompt}
        onChange={vi.fn()}
        onDuplicate={handleDuplicate}
      />
    );

    const duplicateButton = screen.getByRole('button', { name: /duplicate/i });
    fireEvent.click(duplicateButton);

    expect(handleDuplicate).toHaveBeenCalledWith('prompt-1');
  });

  it('должен показать fullscreen режим', () => {
    render(<PromptEditor prompt={mockPrompt} onChange={vi.fn()} />);

    const fullscreenButton = screen.getByRole('button', {
      name: /fullscreen/i,
    });
    fireEvent.click(fullscreenButton);

    expect(screen.getByTestId('fullscreen-editor')).toBeInTheDocument();
  });
});

