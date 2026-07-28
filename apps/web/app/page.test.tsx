import { render, screen } from '@testing-library/react';
import HomePage from './page';
it('presents the redesigned landing promise', () => {
  render(<HomePage />);
  expect(
    screen.getByRole('heading', { name: /find the choice everyone can feel good about/i }),
  ).toBeInTheDocument();
});
