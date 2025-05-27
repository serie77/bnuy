import { useState, useEffect, useRef } from 'react';
import { fetchBunnyMedia } from '../services/redditApi';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import styles from './TV.module.css';

function TV() {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const posts = await fetchBunnyMedia(100);
        
        // Filter to only videos and GIFs
        const videoGifOnly = posts.filter(post => {
          const url = post.url.toLowerCase();
          return (
            post.is_video ||
            url.includes('v.redd.it') ||
            url.includes('.gif') ||
            url.includes('.gifv') ||
            url.includes('gfycat.com')
          );
        });
        
        // Randomize the order
        const shuffled = [...videoGifOnly].sort(() => Math.random() - 0.5);
        
        console.log('Loaded video/gif posts:', shuffled.length);
        setMedia(shuffled);
        setCurrentIndex(Math.floor(Math.random() * shuffled.length));
        setLoading(false);
      } catch (error) {
        console.error('Error loading media:', error);
        setLoading(false);
      }
    };

    loadMedia();
  }, []);

  // Auto-cycle for GIFs (since they don't have 'ended' events)
  useEffect(() => {
    let interval;
    
    if (media.length > 0 && currentIndex < media.length) {
      const currentPost = media[currentIndex];
      const url = currentPost?.url?.toLowerCase() || '';
      
      // If it's a GIF, auto-advance after 8 seconds
      if (url.includes('.gif') && !url.includes('.gifv')) {
        interval = setTimeout(() => {
          nextChannel();
        }, 8000);
      }
    }
    
    return () => {
      if (interval) clearTimeout(interval);
    };
  }, [currentIndex, media]);

  const getMediaUrl = (post) => {
    const url = post.url;
    console.log('Processing URL:', url, 'from r/' + post.subreddit);
    
    // Handle Reddit videos
    if (url.includes('v.redd.it')) {
      const videoUrl = post.media?.reddit_video?.fallback_url || post.secure_media?.reddit_video?.fallback_url;
      console.log('Reddit video URL:', videoUrl);
      return videoUrl;
    }
    
    // Handle Imgur gifv
    if (url.includes('imgur') && url.includes('.gifv')) {
      const mp4Url = url.replace('.gifv', '.mp4');
      console.log('Imgur MP4 URL:', mp4Url);
      return mp4Url;
    }

    // Handle Gfycat
    if (url.includes('gfycat.com')) {
      const gfycatId = url.split('/').pop();
      const gfycatUrl = `https://giant.gfycat.com/${gfycatId}.mp4`;
      console.log('Gfycat URL:', gfycatUrl);
      return gfycatUrl;
    }

    console.log('Using direct URL:', url);
    return url;
  };

  const nextChannel = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevChannel = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleVideoEnded = () => {
    console.log('Video ended, switching to next channel');
    nextChannel();
  };

  if (loading) {
    return <LoadingSpinner message="tuning into bunny tv... 📺✨" />;
  }

  if (media.length === 0) {
    return <LoadingSpinner message="no videos or gifs found 🐰💔" />;
  }

  const currentPost = media[currentIndex];
  const mediaUrl = currentPost ? getMediaUrl(currentPost) : null;

  const isVideo = mediaUrl && (
    mediaUrl.includes('.mp4') || 
    mediaUrl.includes('v.redd.it') || 
    currentPost.is_video
  );

  return (
    <div className={styles.tvContainer}>
      <div className={styles.mediaContainer}>
        {mediaUrl && (
          <>
            {isVideo ? (
              <>
                <video 
                  className={styles.backgroundBlur}
                  src={mediaUrl}
                  autoPlay
                  loop={false}
                  muted
                  playsInline
                />
                <video 
                  ref={videoRef}
                  key={mediaUrl}
                  src={mediaUrl}
                  autoPlay
                  loop={false}
                  muted
                  playsInline
                  className={styles.media}
                  onEnded={handleVideoEnded}
                  onError={(e) => {
                    console.error('Video error:', e);
                    console.log('Failed video URL:', mediaUrl);
                    setTimeout(nextChannel, 1000);
                  }}
                />
              </>
            ) : (
              <>
                <img 
                  src={mediaUrl}
                  alt={currentPost.title}
                  className={styles.backgroundBlur}
                />
                <img 
                  src={mediaUrl}
                  alt={currentPost.title}
                  className={styles.media}
                  onError={(e) => {
                    console.error('Image error:', e);
                    console.log('Failed image URL:', mediaUrl);
                    setTimeout(nextChannel, 1000);
                  }}
                />
              </>
            )}
          </>
        )}
      </div>
      
      <div className={styles.channelIndicator}>
        bnuy tv
      </div>
      
      <div className={styles.info}>
        <h2>{currentPost.title}</h2>
        <p>From r/{currentPost.subreddit} • by u/{currentPost.author}</p>
      </div>

      <div className={styles.controls}>
        <button onClick={prevChannel}>◀ Previous Channel</button>
        <button onClick={nextChannel}>Next Channel ▶</button>
      </div>
    </div>
  );
}

export default TV; 