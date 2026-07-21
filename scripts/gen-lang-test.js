const fs = require('fs');
const lines = [];
const P = (s) => lines.push(s);
const W = () => lines.push('');

P("import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'");
P("import { render, screen, act, renderHook } from '@testing-library/react'");
P("import { LanguageProvider, useLanguage } from './LanguageContext'");
P("import type { ReactNode } from 'react'");
W();
P("const STORAGE_KEY = 'portfolio_lang'");
W();
P("function renderWithProvider(ui: ReactNode) {");
P("  return render(<LanguageProvider>{ui}</LanguageProvider>)");
P("}");

fs.writeFileSync('src/context/LanguageContext.test.tsx', lines.join('\n'), 'utf8');
console.log('Script written successfully');
