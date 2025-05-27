import { useState, useEffect } from 'react';
import BunnyCard from '../BunnyCard/BunnyCard';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { fetchBunnyPosts } from '../../services/redditApi';
import styles from './BunnyGrid.module.css';

function BunnyGrid() {
  const [bunnies, setBunnies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBunnies = async () => {
      try {
        const posts = await fetchBunnyPosts(24);
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

  if (loading) {
    return <LoadingSpinner message="gathering the cutest bunnies... 🌸" />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.intro}>
        <div className={styles.logo}>bnuy</div>
        <p className={styles.description}>
          bnuy is an ai-curated collection of the internet's most delightful rabbit content.
          updated continuously from reddit's best bunny communities.
        </p>
      </div>
      
      <div className={styles.grid}>
        {bunnies.map((bunny, index) => (
          <BunnyCard 
            key={`${bunny.id}-${index}`} 
            bunny={bunny} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default BunnyGrid;