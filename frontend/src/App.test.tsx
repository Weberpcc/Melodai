import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MelodAI title', () => {
  render(<App />);
  const titleElement = screen.getByText(/MelodAI/i);
  expect(titleElement).toBeInTheDocument();
});