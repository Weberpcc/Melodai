import React, { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
import Orb from './Orb';
import CardNav from './CardNav';
import './LandingPage.css';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleModalClose = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  // Menu items for the CardNav - using simple console logs for now
  const menuItems = [
    {
      label: "Getting Started",
      bgColor: "rgba(15, 15, 15, 0.9)",
      textColor: "#fff",
      links: [
        { label: "Quick Start Guide", ariaLabel: "Quick Start Guide", onClick: () => console.log('Quick Start Guide clicked') },
        { label: "FAQ", ariaLabel: "Frequently Asked Questions", onClick: () => console.log('FAQ clicked') }
      ]
    },
    {
      label: "Discover", 
      bgColor: "rgba(25, 25, 25, 0.9)",
      textColor: "#fff",
      links: [
        { label: "Listen to Examples", ariaLabel: "Listen to AI Generated Examples", onClick: () => console.log('Listen to Examples clicked') },
        { label: "How It Works", ariaLabel: "How AI Music Generation Works", onClick: () => console.log('How It Works clicked') }
      ]
    },
    {
      label: "Contact",
      bgColor: "rgba(35, 35, 35, 0.9)", 
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us", href: "mailto:support@melodai.com" },
        { label: "Support", ariaLabel: "Get Support", onClick: () => window.open('https://discord.gg/melodai', '_blank') },
        { label: "Feedback", ariaLabel: "Send Feedback", onClick: () => window.open('https://forms.gle/melodai-feedback', '_blank') }
      ]
    }
  ];

  return (
    <div className="landing-page">
      {/* Orb Background */}
      <div className="landing-background">
        <Orb
          hoverIntensity={0}
          rotateOnHover={true}
          hue={360}
          forceHoverState={false}
          backgroundColor="#000000"
        />
      </div>

      {/* CardNav Menu */}
      <CardNav
        items={menuItems}
      />

      {/* Top Navigation - Keep for Login/Signup */}
      <div className="landing-nav">
        <div className="nav-buttons">
          <button 
            className="nav-btn"
            onClick={() => setShowLoginModal(true)}
          >
            Login
          </button>
          <button 
            className="nav-btn nav-btn-primary"
            onClick={() => setShowSignupModal(true)}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="landing-content">
        <div className="landing-hero">
          <h1 className="landing-title">
            <span className="title-main">MelodAI</span>
            <span className="title-subtitle">Turn thoughts into tunes.</span>
          </h1>
          
          <p className="landing-description">
            Transform your ideas into beautiful music using AI. 
            Generate unique compositions, explore different styles, and bring your musical vision to life.
          </p>

          <button 
            className="landing-get-started-btn glass-button"
            onClick={onGetStarted}
          >
            <span>Get Started</span>
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Welcome Back</h2>
              <button className="modal-close" onClick={handleModalClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label>
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input type="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label>
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input type="password" placeholder="Enter your password" />
              </div>
              <button type="submit" className="modal-submit-btn">
                Sign In
              </button>
              <p className="modal-switch">
                Don't have an account? 
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                  }}
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Account</h2>
              <button className="modal-close" onClick={handleModalClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label>
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input type="text" placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label>
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input type="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label>
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input type="password" placeholder="Create a password" />
              </div>
              <button type="submit" className="modal-submit-btn">
                Create Account
              </button>
              <p className="modal-switch">
                Already have an account? 
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowLoginModal(true);
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;