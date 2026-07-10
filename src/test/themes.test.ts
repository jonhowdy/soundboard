import { describe, it, expect } from 'vitest';
import {
  hexToTriple,
  tripleToHex,
  resolveTokens,
  isThemeLight,
  THEMES,
} from '../themes/themes';
import type { CustomTheme } from '../types';

describe('theme color conversion', () => {
  it('converts hex to an "R G B" triple', () => {
    expect(hexToTriple('#7c3aed')).toBe('124 58 237');
    expect(hexToTriple('7c3aed')).toBe('124 58 237'); // no leading #
    expect(hexToTriple('#fff')).toBe('255 255 255'); // shorthand
  });

  it('converts a triple back to hex', () => {
    expect(tripleToHex('124 58 237')).toBe('#7c3aed');
    expect(tripleToHex('255 255 255')).toBe('#ffffff');
  });

  it('round-trips through both conversions', () => {
    for (const hex of ['#0a0616', '#fa3cc8', '#3cdcff', '#182027']) {
      expect(tripleToHex(hexToTriple(hex))).toBe(hex);
    }
  });
});

const customTheme: CustomTheme = {
  id: 'custom-abc',
  label: 'Sunrise',
  tokens: { ...THEMES.light.tokens, accent: '255 128 0' },
};

describe('resolveTokens', () => {
  it('returns built-in theme tokens by id', () => {
    expect(resolveTokens('neon').accent).toBe(THEMES.neon.tokens.accent);
  });

  it('resolves a custom theme from the provided list', () => {
    expect(resolveTokens('custom-abc', [customTheme]).accent).toBe('255 128 0');
  });

  it('falls back to a default for unknown ids', () => {
    expect(resolveTokens('missing', [])).toEqual(THEMES.cyberpunk.tokens);
  });
});

describe('isThemeLight', () => {
  it('detects light vs dark backgrounds', () => {
    expect(isThemeLight('light')).toBe(true);
    expect(isThemeLight('minimal')).toBe(true);
    expect(isThemeLight('cyberpunk')).toBe(false);
    expect(isThemeLight('dark')).toBe(false);
    expect(isThemeLight('custom-abc', [customTheme])).toBe(true); // light surface
  });
});
