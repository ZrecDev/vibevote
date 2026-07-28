import { render, screen } from '@testing-library/react';
import HomePage from './page';

it('presents the minimal landing promise and primary paths', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: /decide together/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /create room/i })).toHaveAttribute('href', '/create');
  expect(screen.getByRole('link', { name: /join room/i })).toHaveAttribute('href', '/join');
});
