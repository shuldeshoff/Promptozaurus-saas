import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../../components/ProjectList';

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

describe('ProjectList', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Project 1',
      data: {
        contextBlocks: [
          {
            id: 'block-1',
            title: 'Context',
            items: [{ id: 'item-1', content: 'test', chars: 4 }],
          },
        ],
        promptBlocks: [],
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '2',
      name: 'Project 2',
      data: {
        contextBlocks: [],
        promptBlocks: [
          {
            id: 'prompt-1',
            title: 'Prompt',
            template: 'test',
            chars: 4,
          },
        ],
      },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
    },
  ];

  it('должен отобразить список проектов', () => {
    render(<ProjectList projects={mockProjects} onSelect={vi.fn()} />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('должен вызвать onSelect при клике на проект', () => {
    const handleSelect = vi.fn();
    render(<ProjectList projects={mockProjects} onSelect={handleSelect} />);

    fireEvent.click(screen.getByText('Project 1'));

    expect(handleSelect).toHaveBeenCalledWith(mockProjects[0]);
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it('должен отобразить статистику проекта', () => {
    render(<ProjectList projects={mockProjects} onSelect={vi.fn()} />);

    // Project 1: 1 context block, 0 prompts
    expect(screen.getByText(/1.*context/i)).toBeInTheDocument();

    // Project 2: 0 contexts, 1 prompt
    expect(screen.getByText(/1.*prompt/i)).toBeInTheDocument();
  });

  it('должен отобразить дату обновления', () => {
    render(<ProjectList projects={mockProjects} onSelect={vi.fn()} />);

    // Проверяем что даты отображаются
    const dates = screen.getAllByText(/\d{2}.\d{2}.\d{4}/);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('должен отобразить пустое состояние когда нет проектов', () => {
    render(<ProjectList projects={[]} onSelect={vi.fn()} />);

    expect(screen.getByText(/нет проектов/i)).toBeInTheDocument();
  });

  it('должен отобразить размер проекта', () => {
    render(<ProjectList projects={mockProjects} onSelect={vi.fn()} />);

    // Project 1: 4 chars
    expect(screen.getByText(/4.*символ/i)).toBeInTheDocument();
  });

  it('должен выделить активный проект', () => {
    const { container } = render(
      <ProjectList
        projects={mockProjects}
        onSelect={vi.fn()}
        activeProjectId="1"
      />
    );

    const projectCards = container.querySelectorAll('[data-project-id]');
    const activeCard = Array.from(projectCards).find(
      (card) => card.getAttribute('data-project-id') === '1'
    );

    expect(activeCard).toHaveClass('active');
  });

  it('должен обработать проект без данных', () => {
    const emptyProject = {
      id: '3',
      name: 'Empty Project',
      data: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <ProjectList projects={[emptyProject]} onSelect={vi.fn()} />
    );

    expect(screen.getByText('Empty Project')).toBeInTheDocument();
    expect(screen.getByText(/0.*context/i)).toBeInTheDocument();
  });
});

