// Function to bust the cache and reload the page
export const bustCacheAndRetry = () => {
  if (window.caches) {
    window.caches
      .keys()
      .then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          window.caches.delete(cacheName);
        });
      })
      .catch(() => {}); // NO-OP if we cant delete the cache we proceed with normal reload.
  }
  // delete browser cache and hard reload
  window.location.reload();
};

export default bustCacheAndRetry;
