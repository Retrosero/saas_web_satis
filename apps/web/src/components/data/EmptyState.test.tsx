import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from './EmptyState';
import { Package } from 'lucide-react';

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="Veri yok" />);
    expect(screen.getByText('Veri yok')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(<EmptyState title="Test" icon={<Package data-testid="pkg-icon" />} />);
    expect(container.querySelector('[data-testid="pkg-icon"]')).toBeInTheDocument();
  });

  it('should render action button', () => {
    render(<EmptyState title="T" action={<button>Ekle</button>} />);
    expect(screen.getByText('Ekle')).toBeInTheDocument();
  });
});
