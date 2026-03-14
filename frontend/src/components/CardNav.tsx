import React, { useRef, useState } from 'react';
import './CardNav.css';

type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel: string;
  onClick?: () => void;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  items: CardNavItem[];
  className?: string;
}

const CardNav: React.FC<CardNavProps> = ({
  items,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleLinkClick = (link: CardNavLink) => {
    // Check if this is a modal link based on the label
    const modalMap: { [key: string]: string } = {
      'Quick Start Guide': 'quick-start',
      'FAQ': 'faq',
      'Listen to Examples': 'examples',
      'How It Works': 'how-it-works'
    };

    if (modalMap[link.label]) {
      // Don't close menu for modal links, just open the modal
      setActiveModal(modalMap[link.label]);
      return;
    }
    
    // Close the menu only for non-modal links
    setIsMenuOpen(false);
    
    // Execute the link action after a small delay to allow animation
    setTimeout(() => {
      if (link.onClick) {
        link.onClick();
      } else if (link.href) {
        window.open(link.href, '_blank');
      }
    }, 100);
  };

  // Simple arrow icon component
  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10M7 17L17 7"/>
    </svg>
  );

  // Close icon component
  const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  // Modal content components
  const QuickStartModal = () => (
    <div className="modal-content-body">
      <h3>Quick Start Guide</h3>
      <div className="guide-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Describe Your Music</h4>
            <p>Enter a text description of the music you want to create. Be specific about genre, mood, instruments, and style.</p>
            <div className="example">Example: "Upbeat jazz piano with soft drums for a coffee shop atmosphere"</div>
          </div>
        </div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Choose Settings</h4>
            <p>Select duration (10-120 seconds), creativity level, and AI model. Higher creativity means more experimental results.</p>
          </div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Generate & Enhance</h4>
            <p>Click "Generate Music" and wait for AI processing. Then use our audio effects panel to enhance your track with EQ, reverb, and mastering.</p>
          </div>
        </div>
        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Export & Share</h4>
            <p>Download in multiple formats (MP3, WAV, FLAC) or save to your favorites for future reference.</p>
          </div>
        </div>
      </div>
      <div className="tips-section">
        <h4>Pro Tips</h4>
        <ul>
          <li>Use specific instrument names for better results</li>
          <li>Mention tempo (slow, medium, fast) or BPM if known</li>
          <li>Include emotional context (happy, melancholic, energetic)</li>
          <li>Try different creativity levels for varied outputs</li>
        </ul>
      </div>
    </div>
  );

  const FAQModal = () => (
    <div className="modal-content-body">
      <h3>Frequently Asked Questions</h3>
      <div className="faq-list">
        <div className="faq-item">
          <h4>How long does music generation take?</h4>
          <p>Generation typically takes 30-90 seconds depending on duration and model complexity. Our medium model offers the best balance of speed and quality.</p>
        </div>
        <div className="faq-item">
          <h4>What audio formats are supported?</h4>
          <p>We support MP3, WAV, FLAC, and OGG formats. WAV and FLAC provide the highest quality for professional use.</p>
        </div>
        <div className="faq-item">
          <h4>Can I use generated music commercially?</h4>
          <p>Yes! All music generated through MelodAI is royalty-free and can be used for commercial projects, including videos, podcasts, and games.</p>
        </div>
        <div className="faq-item">
          <h4>How does the creativity setting work?</h4>
          <p>Lower creativity (0-30%) follows your prompt closely. Higher creativity (70-100%) produces more experimental and unique results.</p>
        </div>
        <div className="faq-item">
          <h4>What's the difference between AI models?</h4>
          <p>Small model is fastest but basic quality. Medium model offers great balance. Large model provides highest quality but takes longer.</p>
        </div>
        <div className="faq-item">
          <h4>Can I edit the generated music?</h4>
          <p>Yes! Use our built-in audio effects panel for EQ, reverb, compression, and mastering. You can also download and edit in your preferred DAW.</p>
        </div>
      </div>
    </div>
  );

  const ExamplesModal = () => {
    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    const playAudio = (filename: string) => {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }

      // If clicking the same button, just stop
      if (currentlyPlaying === filename) {
        setCurrentlyPlaying(null);
        return;
      }

      // Play the new audio
      try {
        // Use local audio files from public directory
        const audio = new Audio(`/audio/${filename}`);
        audio.volume = 0.7;
        audio.onended = () => {
          setCurrentlyPlaying(null);
          setCurrentAudio(null);
        };
        audio.onerror = () => {
          console.error(`Failed to load audio: ${filename}`);
          setCurrentlyPlaying(null);
          setCurrentAudio(null);
        };
        
        audio.play().then(() => {
          setCurrentlyPlaying(filename);
          setCurrentAudio(audio);
        }).catch((error) => {
          console.error(`Failed to play audio: ${filename}`, error);
          setCurrentlyPlaying(null);
          setCurrentAudio(null);
        });
      } catch (error) {
        console.error(`Error creating audio element: ${filename}`, error);
        setCurrentlyPlaying(null);
        setCurrentAudio(null);
      }
    };

    return (
      <div className="modal-content-body">
        <h3>Listen to Examples</h3>
        <div className="examples-grid">
          <div className="example-category">
            <h4>Classical & Orchestral</h4>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Peaceful Piano Composition</span>
                <span className="example-prompt">AI-generated classical piano melody</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample1.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample1.mp3')}
              >
                {currentlyPlaying === 'sample1.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Orchestral Theme</span>
                <span className="example-prompt">AI-generated orchestral arrangement</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample2.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample2.mp3')}
              >
                {currentlyPlaying === 'sample2.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>
          
          <div className="example-category">
            <h4>Contemporary & Electronic</h4>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Modern Composition</span>
                <span className="example-prompt">Contemporary AI-generated track</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample3.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample3.mp3')}
              >
                {currentlyPlaying === 'sample3.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Electronic Soundscape</span>
                <span className="example-prompt">AI-created electronic music</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample4.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample4.mp3')}
              >
                {currentlyPlaying === 'sample4.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>

          <div className="example-category">
            <h4>Ambient & Atmospheric</h4>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Ambient Journey</span>
                <span className="example-prompt">Atmospheric AI composition</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample5.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample5.mp3')}
              >
                {currentlyPlaying === 'sample5.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Enhanced Track</span>
                <span className="example-prompt">AI-generated with audio enhancement</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample6.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample6.mp3')}
              >
                {currentlyPlaying === 'sample6.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>

          <div className="example-category">
            <h4>Experimental & Variations</h4>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Creative Variation</span>
                <span className="example-prompt">AI variation of original composition</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample7.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample7.mp3')}
              >
                {currentlyPlaying === 'sample7.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
            <div className="example-item">
              <div className="example-info">
                <span className="example-title">Extended Composition</span>
                <span className="example-prompt">Extended AI-generated piece</span>
              </div>
              <button 
                className={`play-btn ${currentlyPlaying === 'sample8.mp3' ? 'playing' : ''}`} 
                onClick={() => playAudio('sample8.mp3')}
              >
                {currentlyPlaying === 'sample8.mp3' ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>
        </div>
        <div className="example-note">
          <p><strong>Note:</strong> These are actual tracks generated by MelodAI. Click play to listen to real AI-created music!</p>
        </div>
      </div>
    );
  };

  const HowItWorksModal = () => (
    <div className="modal-content-body">
      <h3>How AI Music Generation Works</h3>
      <div className="how-it-works-content">
        <div className="tech-section">
          <h4>The Technology Behind MelodAI</h4>
          <p>MelodAI uses advanced transformer-based neural networks trained on millions of music samples to understand patterns, structures, and relationships in music.</p>
        </div>

        <div className="process-flow">
          <h4>Generation Process</h4>
          <div className="process-steps">
            <div className="process-step">
              <div className="process-icon">▸</div>
              <div className="process-text">
                <h5>Text Analysis</h5>
                <p>Your prompt is analyzed using GPT to extract musical elements like genre, instruments, mood, and structure.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">▸</div>
              <div className="process-text">
                <h5>Musical Encoding</h5>
                <p>The AI converts your description into musical parameters and generates audio tokens representing different frequencies and timbres.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">▸</div>
              <div className="process-text">
                <h5>Audio Synthesis</h5>
                <p>Advanced audio models create the final waveform, ensuring proper mixing, timing, and musical coherence.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="process-icon">▸</div>
              <div className="process-text">
                <h5>Post-Processing</h5>
                <p>Optional enhancement with EQ, reverb, compression, and mastering for professional-quality output.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="models-section">
          <h4>AI Models Available</h4>
          <div className="model-comparison">
            <div className="model-card">
              <h5>MusicGen Small</h5>
              <p><strong>Speed:</strong> Fast</p>
              <p><strong>Quality:</strong> Good</p>
              <p><strong>Best for:</strong> Quick iterations, demos</p>
            </div>
            <div className="model-card">
              <h5>MusicGen Medium</h5>
              <p><strong>Speed:</strong> Balanced</p>
              <p><strong>Quality:</strong> Great</p>
              <p><strong>Best for:</strong> Most use cases</p>
            </div>
            <div className="model-card">
              <h5>MusicGen Large</h5>
              <p><strong>Speed:</strong> Slower</p>
              <p><strong>Quality:</strong> Excellent</p>
              <p><strong>Best for:</strong> Professional projects</p>
            </div>
          </div>
        </div>

        <div className="capabilities-section">
          <h4>What MelodAI Can Create</h4>
          <div className="capabilities-grid">
            <div className="capability">Any musical genre</div>
            <div className="capability">Multiple instruments</div>
            <div className="capability">Various tempos & moods</div>
            <div className="capability">Background music</div>
            <div className="capability">Melodic compositions</div>
            <div className="capability">Rhythmic patterns</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`card-nav-container ${className}`}>
      {/* Hamburger Menu Button */}
      <div
        className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        role="button"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        tabIndex={0}
      >
        <div className="hamburger-line" />
        <div className="hamburger-line" />
      </div>

      {/* Menu Content */}
      {isMenuOpen && (
        <div ref={menuContentRef} className="card-nav-content">
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <div
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    onClick={() => handleLinkClick(lnk)}
                    aria-label={lnk.ariaLabel}
                    role="button"
                    tabIndex={0}
                  >
                    <ArrowIcon />
                    {lnk.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {activeModal === 'quick-start' && <QuickStartModal />}
              {activeModal === 'faq' && <FAQModal />}
              {activeModal === 'examples' && <ExamplesModal />}
              {activeModal === 'how-it-works' && <HowItWorksModal />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardNav;