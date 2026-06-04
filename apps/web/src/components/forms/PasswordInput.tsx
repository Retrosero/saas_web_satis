import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextInput, type TextInputProps } from './TextInput';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'rightIcon' | 'type'>>(
  (props, ref) => {
    const [show, setShow] = useState(false);
    return (
      <TextInput
        ref={ref}
        type={show ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="pointer-events-auto text-on-surface-variant hover:text-foreground"
            tabIndex={-1}
            aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
