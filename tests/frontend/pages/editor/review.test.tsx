import React from 'react';
import { render, screen } from '@testing-library/react';

import EditorReviewPage from '../../../../src/pages/editor/review';

jest.mock('../../../../src/features/editor/EditorGate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('pages/editor/review', () => {
  it('renders review page shell', () => {
    render(<EditorReviewPage />);

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Submissions and automated validation results will appear here\./i,
      ),
    ).toBeInTheDocument();
    expect((EditorReviewPage as any).fullBleedLayout).toBe(true);
  });
});
