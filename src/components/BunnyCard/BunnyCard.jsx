import { useState } from 'react';
import styles from './BunnyCard.module.css';

const BunnyCard = ({ bunny, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    window.open(bunny.source, '_blank');
  };

  // Clean the URL to ensure it's a direct image link
  const getCleanImageUrl = (url) => {
    // Handle imgur URLs
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
      const imageId = url.split('/').pop().split('.')[0];
      
      // Try multiple formats for imgur images
      const formats = ['jpg', 'png', 'gif', 'jpeg'];
      
      // For now, let's try jpg first and add error handling
      return `https://i.imgur.com/${imageId}.jpg`;
    }
    return url;
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.imageContainer}>
        {!imageLoaded && !imageError && (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        
        {imageError ? (
          <div className={styles.error}>
            <span>🐰</span>
          </div>
        ) : (
          <img
            src={getCleanImageUrl(bunny.url)}
            alt={bunny.title}
            className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.log('Failed to load:', getCleanImageUrl(bunny.url));
              // Try alternative formats or fall back
              if (!bunny.url.includes('i.imgur.com')) {
                const imageId = bunny.url.split('/').pop().split('.')[0];
                const altUrl = `https://i.imgur.com/${imageId}.png`;
                console.log('Trying alternative:', altUrl);
                // You could implement a retry mechanism here
              }
              setImageError(true);
            }}
            loading="lazy"
          />
        )}
        
        <div className={styles.overlay}>
          <div className={styles.title}>{bunny.title}</div>
          <div className={styles.details}>
            Posted by u/{bunny.author} in r/{bunny.subreddit}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BunnyCard;