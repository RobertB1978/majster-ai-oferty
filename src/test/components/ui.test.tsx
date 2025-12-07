import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders correctly with children', () => {
      const { getByRole } = render(<Button>Click me</Button>);
      expect(getByRole('button', { name: /click me/i })).toBeDefined();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>);
      
      getByRole('button').click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>);
      expect((getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('Input', () => {
    it('renders correctly', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
      expect(getByPlaceholderText('Enter text')).toBeDefined();
    });

    it('can be disabled', () => {
      const { getByRole } = render(<Input disabled />);
      expect((getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe('Card', () => {
    it('renders with title and content', () => {
      const { getByText } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      );
      
      expect(getByText('Test Title')).toBeDefined();
      expect(getByText('Test Content')).toBeDefined();
    });
  });
});
