import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { fetchBunnyPosts } from '../services/redditApi';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import styles from './Vote.module.css';
import { Link } from 'react-router-dom';

function Vote() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [backgroundBunnies, setBackgroundBunnies] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(0);
  
  // Your specific token mint address and requirement
  const TOKEN_MINT = "7BFKwYhnNfMhCFjPGjd7tb1iX9NGkgoRDT1D8viDpump";
  const REQUIRED_TOKENS = 350000; // 20k tokens

  const API_URL = '/api'; // This will make requests to /api/submissions/[wallet]

  // Page initialization
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Load submissions from localStorage
        const savedSubmissions = localStorage.getItem('bunnySubmissions');
        if (savedSubmissions) {
          setSubmissions(JSON.parse(savedSubmissions));
        }

        // Load background bunnies
        const posts = await fetchBunnyPosts(12);
        setBackgroundBunnies(posts.slice(0, 12));

        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        console.error('Failed to initialize page:', error);
        // Continue anyway after delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, []);

  // Countdown timer - resets every hour
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      
      const diff = nextHour - now;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check token balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkTokenBalance();
    } else {
      setTokenBalance(0);
      setHasEnoughTokens(false);
      setError('');
    }
  }, [connected, publicKey]);

  // Check submission count when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkSubmissionCount();
      checkTokenBalance();
    }
  }, [connected, publicKey]);

  // Add a test function
  useEffect(() => {
    const testServer = async () => {
      try {
        const response = await fetch(`${API_URL}/test`);
        const data = await response.json();
        console.log('Server test:', data);
      } catch (error) {
        console.error('Server test failed:', error);
      }
    };
    
    testServer();
  }, []);

  const checkTokenBalance = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    setError('');
    
    try {
      const mintPublicKey = new PublicKey(TOKEN_MINT);
      
      try {
        const associatedTokenAddress = await getAssociatedTokenAddress(
          mintPublicKey,
          publicKey
        );

        const tokenAccount = await getAccount(connection, associatedTokenAddress);
        const balance = Number(tokenAccount.amount);
        
        setTokenBalance(balance);
        setHasEnoughTokens(balance >= REQUIRED_TOKENS);
        
      } catch (associatedError) {
        try {
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
          });
          
          let foundBalance = 0;
          for (const accountInfo of tokenAccounts.value) {
            try {
              const accountData = accountInfo.account.data;
              const mintBytes = accountData.slice(0, 32);
              const mint = new PublicKey(mintBytes);
              
              if (mint.equals(mintPublicKey)) {
                const amountBytes = accountData.slice(64, 72);
                const amount = amountBytes.readBigUInt64LE(0);
                foundBalance = Number(amount);
                break;
              }
            } catch (parseError) {
              continue;
            }
          }
          
          setTokenBalance(foundBalance);
          setHasEnoughTokens(foundBalance >= REQUIRED_TOKENS);
          
        } catch (rpcError) {
          setError('Unable to check token balance. Please try again.');
          setTokenBalance(0);
          setHasEnoughTokens(false);
        }
      }
      
    } catch (error) {
      setError('Failed to check token balance. Please try again.');
      setTokenBalance(0);
      setHasEnoughTokens(false);
    }
    
    setLoading(false);
  };

  const checkSubmissionCount = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`${API_URL}/api/submissions/${publicKey.toString()}`);
      const data = await response.json();
      setSubmissionCount(data.count);
      
      if (data.count >= 2) {
        setError('You have already submitted 2 bunnies! 🐰🐰');
        return data.count;
      }
      
      return data.count;
    } catch (error) {
      console.error('Error checking submission count:', error);
      return 0;
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const saveSubmission = async (submissionData) => {
    try {
      const response = await fetch(`${API_URL}/api/submissions/${publicKey.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to save submission:', error);
      setError('Failed to submit bunny. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !hasEnoughTokens) return;
    
    setSubmitting(true);
    
    try {
      // Check the return value from saveSubmission
      const submissionSaved = await saveSubmission({
        walletAddress: publicKey.toString(),
        tokenBalance: tokenBalance,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      });
      
      // Only proceed if submission was saved successfully
      if (submissionSaved) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitted(true);
      }
      
    } catch (error) {
      console.error('Error submitting bunny:', error);
      setError('Failed to submit bunny. Please try again.');
    }
    
    setSubmitting(false);
  };

  // Show loading screen while page initializes
  if (pageLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingBunny}>🐰</div>
          <h2>preparing bunny contest...</h2>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
          <p>loading cute bunnies and setting up the contest ✨</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`${styles.container} ${styles.fadeIn}`}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>bunny submitted!</h2>
          <p>your adorable bunny is now in the running for 10 SOL! 🐰✨</p>
          <p>winner announced in: <span className={styles.timer}>{timeLeft}</span></p>
          <div className={styles.submissionInfo}>
            <p>submission #{submissions.length}</p>
            <p>wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
          </div>
          <div className={styles.actionButtons}>
            <button 
              className={styles.actionButton}
              onClick={() => {
                setSubmitted(false);
                setSelectedFile(null);
                setPreviewUrl(null);
                setError('');
              }}
            >
              submit another bunny
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("i uploaded a bunny on @bnuyfun 🐰")}&url=${encodeURIComponent("https://bnuy.fun")}`, '_blank')}
            >
              share on 𝕏
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.fadeIn}`}>
      {/* Floating background bunnies */}
      <div className={styles.backgroundBunnies}>
        {backgroundBunnies.map((bunny, index) => (
          <div 
            key={bunny.id} 
            className={styles.floatingBunny}
            style={{
              '--delay': `${index * 0.5}s`,
              '--duration': `${8 + (index % 4)}s`,
              '--start-x': `${(index * 25) % 100}%`,
            }}
          >
            <img src={bunny.url} alt="" />
          </div>
        ))}
      </div>

      <div className={styles.header}>
        <h1>🐰 send your favourite bunny pic 🐰</h1>
        <div className={styles.winnerTimer}>
          <h2>next winner in: {timeLeft}</h2>
          <p>🏆 winners chosen every hour • 💰 10 SOL prize each time</p>
        </div>
        <p>upload your adorable bunny for a chance to win <span className={styles.highlight}>10 SOL</span>! 🐰💰</p>
        <p className={styles.requirement}>you need 20k tokens to participate ✨</p>
      </div>

      <div className={styles.walletSection}>
        <WalletMultiButton className={styles.walletButton} />
        
        {error && (
          <div className={styles.error}>
            <p>⚠️ {error}</p>
          </div>
        )}
        
        {connected && (
          <div className={styles.walletInfo}>
            <p className={styles.address}>
              🔗 {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
            
            {loading ? (
              <div className={styles.checking}>
                <LoadingSpinner message="checking token balance... 🔍" />
              </div>
            ) : (
              <div className={styles.tokenStatus}>
                <p className={styles.balance}>
                  🪙 {tokenBalance.toLocaleString()} tokens
                </p>
                {hasEnoughTokens ? (
                  <p className={styles.eligible}>✅ eligible to participate!</p>
                ) : (
                  <p className={styles.notEligible}>
                    ❌ need {(REQUIRED_TOKENS - tokenBalance).toLocaleString()} more tokens
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {connected && submissionCount >= 2 ? (
        <div className={styles.maxSubmissionsReached}>
          <h3>🐰 Maximum Submissions Reached 🐰</h3>
          <p>You have 2 bunnies in the running for 10 SOL!</p>
          <p>Winner announced in: <span className={styles.timer}>{timeLeft}</span></p>
          <Link to="/" className={styles.homeButton}>
            go home
          </Link>
        </div>
      ) : connected && hasEnoughTokens ? (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <h3>🌟 upload your bunny 🌟</h3>
            
            <div className={styles.fileInput}>
              <input
                type="file"
                id="bunnyImage"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
              <label htmlFor="bunnyImage" className={styles.uploadButton}>
                {selectedFile ? '🔄 change bunny' : '📸 choose bunny image'}
              </label>
            </div>

            {previewUrl && (
              <div className={styles.preview}>
                <img src={previewUrl} alt="Bunny preview" className={styles.previewImage} />
                <p className={styles.fileName}>{selectedFile.name}</p>
              </div>
            )}

            {selectedFile && (
              <button 
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '🐰 submitting bunny... ✨' : '🚀 submit to the judges!'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {!connected && (
        <div className={styles.instructions}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepContent}>
              <h4>🔗 connect wallet</h4>
              <p>link your solana wallet to start</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepContent}>
              <h4>🪙 check tokens</h4>
              <p>ensure you have 20k tokens</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepContent}>
              <h4>📸 send bunny pic</h4>
              <p>share your favourite bunny photo</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepContent}>
              <h4>🏆 win 10 SOL!</h4>
              <p>winners picked every hour</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vote; 