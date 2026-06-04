import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('should not render when closed', () => {
    const { container } = render(<ConfirmModal open={false} title="T" confirmText="OK" onClose={() => {}} onConfirm={() => {}} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should call onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open={true} title="Silinsin mi?" confirmText="Sil" onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Sil'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmModal open={true} title="T" confirmText="OK" onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByText('İptal'));
    expect(onClose).toHaveBeenCalled();
  });
});
