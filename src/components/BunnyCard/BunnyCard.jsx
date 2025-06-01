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
      {/* Show skeleton until the specific image is loaded */}
      {!imageLoaded && !imageError && (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonOverlay} />
        </div>
      )}
      
      <img
        src={getCleanImageUrl(bunny.url)}
        alt={bunny.title}
        className={`${styles.image} ${imageLoaded ? styles.loaded : styles.hidden}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
        decoding="async"
      />
      
      {/* Show overlay only when image is loaded */}
      {imageLoaded && (
        <div className={styles.overlay}>
          <a 
            href={bunny.source} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.overlayContent}
          >
            <span className={styles.imageNumber}>#{index + 1}</span>
            <span className={styles.source}>
              r/{bunny.subreddit} • u/{bunny.author}
            </span>
          </a>
        </div>
      )}
    </div>
  );
};

export default BunnyCard;