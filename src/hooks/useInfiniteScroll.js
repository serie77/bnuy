import { useEffect, useCallback } from 'react';

export function useInfiniteScroll(loadMore, hasMore) {
  const handleScroll = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        loadMore();
      }
    },
    [loadMore, hasMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleScroll, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [handleScroll]);
} 