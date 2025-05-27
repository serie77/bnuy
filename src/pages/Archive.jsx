import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBunnyPosts } from '../services/redditApi';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import styles from './Archive.module.css';

function Archive() {
  const [bunnies, setBunnies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [seenIds, setSeenIds] = useState(new Set());
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Function to check if URL is a GIF
  const isGif = useCallback((url) => {
    return url.toLowerCase().endsWith('.gif');
  }, []);

  // Function to clean image URLs
  const getCleanImageUrl = useCallback((url) => {
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
      const imageId = url.split('/').pop().split('.')[0];
      return `https://i.imgur.com/${imageId}.jpg`;
    }
    return url;
  }, []);

  // Handle image load to hide placeholder
  const handleImageLoad = (e) => {
    e.target.setAttribute('data-loaded', 'true');
    const card = e.target.closest(`.${styles.card}`);
    if (card) {
      card.style.setProperty('--loaded', '1');
    }
  };

  const loadMoreImages = useCallback(async () => {
    if (loadingMore || noMorePosts) return;
    
    setLoadingMore(true);
    try {
      console.log(`\n=== Loading more images (attempt ${attemptCount + 1}) ===`);
      
      const newPosts = await fetchBunnyPosts(300);
      const uniquePosts = newPosts.filter(post => !seenIds.has(post.id));
      console.log(`Got ${newPosts.length} posts, ${uniquePosts.length} are unique`);
      
      if (uniquePosts.length < 10) {
        console.log('Very few new posts found, marking as no more posts');
        setNoMorePosts(true);
      }
      
      if (uniquePosts.length > 0) {
        const shuffledPosts = uniquePosts.sort(() => Math.random() - 0.5);
        setBunnies(prev => [...prev, ...shuffledPosts]);
        
        setSeenIds(prev => {
          const newSet = new Set(prev);
          shuffledPosts.forEach(post => newSet.add(post.id));
          return newSet;
        });
        
        console.log(`Added ${shuffledPosts.length} new unique images. Total: ${bunnies.length + shuffledPosts.length}`);
      }
      
      setAttemptCount(prev => prev + 1);
      
      if (attemptCount >= 4 && uniquePosts.length === 0) {
        setNoMorePosts(true);
        console.log('Reached maximum attempts, no more posts available');
      }
      
    } catch (error) {
      console.error('Error loading more images:', error);
    }
    setLoadingMore(false);
  }, [loadingMore, noMorePosts, seenIds, attemptCount, bunnies.length]);

  const throttledScrollHandler = useMemo(() => {
    let timeoutId = null;
    return () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        if (window.innerHeight + document.documentElement.scrollTop >= 
            document.documentElement.offsetHeight - 1000) {
          loadMoreImages();
        }
        timeoutId = null;
      }, 100);
    };
  }, [loadMoreImages]);

  useEffect(() => {
    if (noMorePosts) return;
    
    window.addEventListener('scroll', throttledScrollHandler);
    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, [throttledScrollHandler, noMorePosts]);

  useEffect(() => {
    const loadInitialBunnies = async () => {
      try {
        console.log('\n=== Loading initial archive ===');
        
        const posts = await fetchBunnyPosts(400);
        const shuffledPosts = posts.sort(() => Math.random() - 0.5);
        
        const distribution = {};
        shuffledPosts.forEach(post => {
          distribution[post.subreddit] = (distribution[post.subreddit] || 0) + 1;
        });
        console.log('Initial posts distribution:', distribution);
        console.log(`Loaded ${shuffledPosts.length} initial posts`);
        
        setBunnies(shuffledPosts);
        
        const initialIds = new Set(shuffledPosts.map(post => post.id));
        setSeenIds(initialIds);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading archive:', error);
        setLoading(false);
      }
    };

    loadInitialBunnies();
  }, []);

  if (loading) {
    return <LoadingSpinner message="loading adorable bunnies... 🐰✨" />;
  }

  return (
    <div className={styles.archiveContainer}>
      <div className={styles.grid}>
        {bunnies.map((bunny, index) => (
          <div key={`${bunny.id}-${index}`} className={styles.card}>
            {isGif(bunny.url) ? (
              <img
                src={bunny.url}
                alt={bunny.title}
                className={styles.image}
                onLoad={handleImageLoad}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <img
                src={getCleanImageUrl(bunny.url)}
                alt={bunny.title}
                className={styles.image}
                onLoad={handleImageLoad}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        ))}
      </div>
      
      {loadingMore && (
        <div className={styles.loadingMore}>
          <LoadingSpinner message="finding more cute bunnies... 🥕" />
        </div>
      )}
      
      {noMorePosts && (
        <div className={styles.noMorePosts}>
          🐰💕 that's all the bunnies for now! refresh for a different arrangement~ ✨
        </div>
      )}
    </div>
  );
}

export default Archive; 