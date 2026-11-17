import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
