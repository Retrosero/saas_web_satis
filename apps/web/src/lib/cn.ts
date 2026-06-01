import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class'larını koşullu birleştirir ve çakışmaları çözer. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
