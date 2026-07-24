import { render, screen } from '@testing-library/react';
import HomePage from './page';
it('presents the landing promise', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: /stop debating/i })).toBeInTheDocument();
});
