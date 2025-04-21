import bustCacheAndRetry from './bust-cache-and-retry';
let originalLocation: Location;
describe('bustCacheAndRetry', () => {
  beforeAll(() => {
    originalLocation = window.location;
  });

  beforeEach(() => {
    // Mocke Window location
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
    const sessionStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string): string | null => store[key] || null,
        setItem: (key: string, value: string): void => {
          store[key] = value;
        },
        clear: (): void => {
          store = {};
        },
      };
    })();

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should reload the page with a cache-busted URL', () => {
    bustCacheAndRetry();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should attempt to delete all caches when window.caches is available', async () => {
    // Mock the caches API
    const deleteMock = vi.fn().mockResolvedValue(true);
    const keysMock = vi.fn().mockResolvedValue(['cache1', 'cache2']);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: keysMock, delete: deleteMock },
    });

    await bustCacheAndRetry();

    expect(keysMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith('cache1');
    expect(deleteMock).toHaveBeenCalledWith('cache2');

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: undefined,
    });
  });

  it('should handle the absence of window.caches gracefully', () => {
    // Mock the caches API to be undefined
    const originalCaches = window.caches;
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: undefined,
    });

    bustCacheAndRetry();

    expect(window.location.reload).toHaveBeenCalled();

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: originalCaches,
    });
  });

  it('should proceed with reload even if cache deletion fails', async () => {
    const deleteMock = vi
      .fn()
      .mockRejectedValue(new Error('Failed to delete cache'));
    const keysMock = vi.fn().mockResolvedValue(['cache1']);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: keysMock, delete: deleteMock },
    });

    await bustCacheAndRetry();

    expect(keysMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith('cache1');
    expect(window.location.reload).toHaveBeenCalled();

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: undefined,
    });
  });
});
