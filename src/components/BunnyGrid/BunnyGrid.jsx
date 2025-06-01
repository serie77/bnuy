import { useState, useEffect } from 'react';
import BunnyCard from '../BunnyCard/BunnyCard';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { fetchBunnyPosts } from '../../services/redditApi';
import styles from './BunnyGrid.module.css';
import { Link } from 'react-router-dom';

function BunnyGrid() {
  const [bunnies, setBunnies] = useState(Array(20).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBunnies = async () => {
      try {
        const posts = await fetchBunnyPosts(20);
        const shuffled = [...posts].sort(() => Math.random() - 0.5);
        setBunnies(shuffled);
        setLoading(false);
      } catch (error) {
        console.error('Error loading bunnies:', error);
        setLoading(false);
      }
    };

    loadBunnies();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.intro}>
        <div className={styles.logo}>bnuy</div>
        <p className={styles.description}>
          bnuy is an ai-curated collection of the internet's most delightful rabbit content.
          updated continuously from reddit's best bunny communities.
        </p>
        <div className={styles.actions}>
          <Link to="/tv" className={styles.button}>
            <span className={styles.icon}>📺</span>
            watch bunny tv
          </Link>
          <Link to="/archive" className={styles.button}>
            view archive
          </Link>
        </div>
      </div>
      
      <div className={styles.grid}>
        {bunnies.map((bunny, i) => (
          <div key={i} className={styles.card}>
            {!bunny ? (
              <div className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonOverlay} />
              </div>
            ) : (
              <BunnyCard 
                key={`${bunny.id}-${i}`} 
                bunny={bunny} 
                index={i}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BunnyGrid;