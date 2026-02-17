import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import EditorBottomBar from '../../../../../src/features/editor/components/EditorBottomBar';

describe('EditorBottomBar', () => {
  it('renders pack data, compile summary and publish action', () => {
    const onPublish = jest.fn();

    render(
      <EditorBottomBar
        pack={{
          id: 'pack-1',
          name: 'Test Pack',
          description: 'desc',
          visibility: 'draft',
          updatedAt: '2026-01-01T00:00:00Z',
          regionSummary: 'Baltic',
        }}
        compileSummary="Compile: 3 artifacts"
        onPublish={onPublish}
      />,
    );

    expect(
      screen.getByRole('link', { name: /Back to packs/i }),
    ).toHaveAttribute('href', '/editor/packs');
    expect(screen.getByText('Test Pack')).toBeInTheDocument();
    expect(screen.getByText('Baltic')).toBeInTheDocument();
    expect(screen.getByText('Compile: 3 artifacts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onPublish).toHaveBeenCalled();
  });
});
