import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
