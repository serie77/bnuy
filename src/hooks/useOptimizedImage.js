import { useState, useEffect } from 'react';

export function useOptimizedImage(originalUrl) {
  const [optimizedUrl, setOptimizedUrl] = useState('');

  useEffect(() => {
    const optimizeImage = async () => {
      // If it's already an optimized URL, return it
      if (originalUrl.includes('i.redd.it')) {
        setOptimizedUrl(originalUrl);
        return;
      }

      // Convert imgur URLs to direct image URLs if needed
      if (originalUrl.includes('imgur.com') && !originalUrl.includes('i.imgur.com')) {
        const imgurId = originalUrl.split('/').pop();
        setOptimizedUrl(`https://i.imgur.com/${imgurId}.jpg`);
        return;
      }

      setOptimizedUrl(originalUrl);
    };

    optimizeImage();
  }, [originalUrl]);

  return optimizedUrl;
} 