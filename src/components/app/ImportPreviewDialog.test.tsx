import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ImportPreviewDialog } from './ImportPreviewDialog';

// Mock ProfileContext values to simulate active import preview
vi.mock('../../contexts/ProfileContext', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    useProfileContext: () => ({
      importPreview: {
        imported: [{ id: '1', title: 'Task 1', status: 'backlog' }],
        newTasks: [{ id: '1', title: 'Task 1', status: 'backlog' }],
        updatedTasks: [],
        unchangedTasks: [],
      },
      setImportPreview: vi.fn(),
      confirmImportTasks: vi.fn(),
    }),
  };
});

describe('ImportPreviewDialog', () => {
  it('renders preview counts and cancel/merge buttons', () => {
    renderWithProviders(<ImportPreviewDialog />);

    expect(screen.getByText('Import preview')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Count of new tasks
    
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /merge import/i })).toBeInTheDocument();
  });
});
