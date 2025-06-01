import axios from 'axios';

const SUBREDDITS = [
  'Rabbits',
  'Bunnies',
  'BunnyNewsNetwork',
  'Bunniesstandingup',
  'IllegallySmolBunnies'
];

// Helper to check if URL is an image
const isImageUrl = (url) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const lowercaseUrl = url.toLowerCase();
  return (
    imageExtensions.some(ext => lowercaseUrl.endsWith(ext)) ||
    lowercaseUrl.includes('imgur') ||
    lowercaseUrl.includes('i.redd.it')
  );
};

// Helper to get proper image URL from various sources
const getProperImageUrl = (url) => {
  if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
    // Convert imgur links to direct image links
    return url.replace('imgur.com', 'i.imgur.com') + '.jpg';
  }
  return url;
};

const getCleanImageUrl = (postData) => {
  // Handle Reddit videos
  if (postData.is_video && postData.media?.reddit_video) {
    return postData.media.reddit_video.fallback_url;
  }

  // Handle v.redd.it URLs directly
  if (postData.url.includes('v.redd.it') && postData.secure_media?.reddit_video) {
    return postData.secure_media.reddit_video.fallback_url;
  }

  // Handle Reddit galleries better
  if (postData.is_gallery && postData.media_metadata) {
    // Get the first image from the gallery
    const firstMediaId = Object.keys(postData.media_metadata)[0];
    if (firstMediaId && postData.media_metadata[firstMediaId]) {
      const media = postData.media_metadata[firstMediaId];
      // Get the highest quality image URL
      if (media.s?.u) {
        return media.s.u.replace(/&amp;/g, '&'); // Fix encoded ampersands
      } else if (media.s?.gif) {
        return media.s.gif;
      }
    }
  }

  const url = postData.url;

  // Handle imgur URLs
  if (url.includes('imgur.com')) {
    if (url.includes('/gallery/') || url.includes('/a/')) {
      if (postData.preview?.images?.[0]?.source?.url) {
        return postData.preview.images[0].source.url.replace(/&amp;/g, '&');
      }
      return null;
    }
    if (!url.includes('i.imgur.com')) {
      return url.replace('imgur.com', 'i.imgur.com') + '.jpg';
    }
  }

  // Handle i.redd.it URLs
  if (url.includes('i.redd.it')) {
    return url;
  }

  // For other URLs, check if they're direct image links
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return url;
  }

  // If we have a preview image, use that as fallback
  if (postData.preview?.images?.[0]?.source?.url) {
    return postData.preview.images[0].source.url.replace(/&amp;/g, '&');
  }

  return url;
};

const getAccessToken = async () => {
  try {
    // Log environment variables (without password)
    console.log('Checking credentials:', {
      hasClientId: !!import.meta.env.VITE_REDDIT_CLIENT_ID,
      hasClientSecret: !!import.meta.env.VITE_REDDIT_CLIENT_SECRET,
      hasUsername: !!import.meta.env.VITE_REDDIT_USERNAME,
    });

    const auth = btoa(`${import.meta.env.VITE_REDDIT_CLIENT_ID}:${import.meta.env.VITE_REDDIT_CLIENT_SECRET}`);
    
    // Use the actual Reddit OAuth endpoint without proxy
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'web:bnuy:v1.0.0',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',  // Changed from 'password'
        duration: 'permanent',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token response:', response.status, errorText);
      throw new Error(`Token request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Token response:', data);
    
    if (!data.access_token) {
      throw new Error('No access token in response');
    }

    return data.access_token;
  } catch (error) {
    console.error('Token error:', error);
    throw error;
  }
};

function transformRedditVideoUrl(url) {
  // Check if it's a Reddit DASH playlist URL
  if (url.includes('DASHPlaylist.mpd')) {
    // Remove the DASHPlaylist.mpd part and keep other parameters
    return url.replace('m=DASHPlaylist.mpd&', '');
  }
  return url;
}

// For regular browsing (homepage/archive) - static images and TRUE GIFs only
export async function fetchBunnyPosts(limit = 50) {
  const subreddits = [
    'Rabbits',
    'Bunnies',
    'BunnyGifs',
    'rabbitswithjobs'
  ];

  try {
    const token = await getAccessToken();
    
    // Fetch even more posts initially
    const postsPerSubreddit = Math.ceil(limit * 3); // Triple the limit for more safety
    const promises = subreddits.map(subreddit =>
      fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=${postsPerSubreddit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'web:bnuy:v1.0.0',
        }
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Error fetching r/${subreddit}:`, response.status);
          return null;
        }
        return response.json();
      })
      .catch(error => {
        console.error(`Failed to fetch r/${subreddit}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    
    // Add logging for debugging
    console.log('Raw posts per subreddit:', results.map(r => r?.data?.children?.length));
    
    const allPosts = results
      .filter(Boolean)
      .flatMap(result => result.data.children)
      .filter(post => {
        if (!post.data) return false;
        const postData = post.data;
        const url = postData.url.toLowerCase();
        
        // Only allow images from trusted sources
        const isTrustedSource = (
          url.includes('i.redd.it') ||
          url.includes('i.imgur.com') ||
          (url.includes('imgur.com') && !url.includes('/gallery/') && !url.includes('/a/'))
        );
        
        const isValidExtension = (
          url.endsWith('.jpg') ||
          url.endsWith('.jpeg') ||
          url.endsWith('.png') ||
          url.endsWith('.gif')
        );

        const isValid = (
          !postData.is_self &&
          !postData.over_18 &&
          isTrustedSource &&
          isValidExtension &&
          !url.includes('.gifv') && 
          !url.includes('v.redd.it') && 
          !postData.is_video && 
          !url.includes('.mp4')
        );

        if (!isValid) {
          console.log('Filtered out post:', {
            url,
            reason: {
              isSelf: postData.is_self,
              isNSFW: postData.over_18,
              isTrustedSource: isTrustedSource,
              isValidExtension: isValidExtension,
              isVideo: postData.is_video || url.includes('v.redd.it') || url.includes('.mp4')
            }
          });
        }

        return isValid;
      })
      .map(post => ({
        id: post.data.id,
        url: post.data.url,
        title: post.data.title,
        author: post.data.author,
        subreddit: post.data.subreddit,
        score: post.data.score,
        source: `https://reddit.com${post.data.permalink}`,
        created: post.data.created_utc
      }));

    console.log(`Found ${allPosts.length} valid posts before shuffle`);

    // Shuffle and ensure exact count
    const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);
    const finalPosts = shuffledPosts.slice(0, limit);
    
    console.log(`Returning ${finalPosts.length} posts`);
    
    return finalPosts;
  } catch (error) {
    console.error('Error fetching bunny posts:', error);
    return [];
  }
}

// For TV feature - includes videos and GIFs
export async function fetchBunnyMedia(limit = 50) {
  const subreddits = [
    'BunnyGifs',
    'Rabbits', 
    'Bunnies',
    'IllegallySmolBunnies',
    'rabbitswithjobs'
  ];

  try {
    const token = await getAccessToken();
    const allPosts = [];

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'web:bnuy:v1.0.0',
          }
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Error fetching r/${subreddit}:`, response.status, error);
          continue;
        }

        const data = await response.json();
        allPosts.push(...data.data.children);
      } catch (error) {
        console.error(`Failed to fetch r/${subreddit}:`, error);
      }
    }

    // Include videos, GIFs, AND images for TV
    const validPosts = allPosts
      .filter(post => {
        if (!post.data) return false;
        const postData = post.data;
        const url = postData.url.toLowerCase();
        
        const isGif = (
          url.endsWith('.gif') ||
          url.endsWith('.gifv') ||
          url.includes('gfycat.com')
        );

        const isVideo = (
          postData.is_video ||
          url.includes('v.redd.it')
        );

        const isImage = (
          url.endsWith('.jpg') ||
          url.endsWith('.jpeg') ||
          url.endsWith('.png') ||
          url.includes('i.imgur.com') ||
          url.includes('i.redd.it')
        );

        return (
          !postData.is_self &&
          !postData.over_18 &&
          (isGif || isVideo || isImage)
        );
      })
      .map(post => ({
        id: post.data.id,
        url: post.data.url,
        title: post.data.title,
        author: post.data.author,
        subreddit: post.data.subreddit,
        score: post.data.score,
        source: `https://reddit.com${post.data.permalink}`,
        created: post.data.created_utc,
        media: post.data.media,
        secure_media: post.data.secure_media,
        is_video: post.data.is_video
      }));

    return validPosts;
  } catch (error) {
    console.error('Error fetching bunny media:', error);
    return [];
  }
} 