import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), { initialProps: { value: 'a', delay: 200 } });
    expect(result.current).toBe('a');
    rerender({ value: 'b', delay: 200 });
    expect(result.current).toBe('a'); // Henüz değişmedi
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('b');
    vi.useRealTimers();
  });
});
