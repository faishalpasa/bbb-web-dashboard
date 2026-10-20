import type { InputHTMLAttributes, KeyboardEvent, WheelEvent } from 'react';

const NON_DIGIT_KEYS = new Set(['e', 'E', '+', '-', '.', ',']);

/**
 * Props for a whole-number field: a real number input (numeric keypad on a phone, no up/down arrows through the global
 * CSS) that cannot be typed into with the characters a number input would otherwise accept (e, +, -, decimals), and that
 * does not change its value when the page is scrolled with the mouse wheel over it.
 */
export const NUMBER_INPUT_PROPS: Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode' | 'onKeyDown' | 'onWheel'> = {
    type: 'number',
    inputMode: 'numeric',
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (NON_DIGIT_KEYS.has(event.key)) event.preventDefault();
    },
    onWheel: (event: WheelEvent<HTMLInputElement>) => event.currentTarget.blur(),
};
