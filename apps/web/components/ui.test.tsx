import { render, screen } from '@testing-library/react';
import { Button } from './ui';
it('renders an accessible button', () => {
  render(<Button>Start</Button>);
  expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
});
