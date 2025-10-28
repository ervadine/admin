import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
      <Header />
      <div className="home-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Find Your Perfect Match</h1>
            <p className="hero-subtitle">
              Connect with like-minded people and build meaningful relationships 
              in a safe and welcoming environment.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Get Started</button>
              <button className="btn btn-secondary">Learn More</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="placeholder-image">
              <span>Dating App Illustration</span>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <h2 className="section-title">Why Choose Our App?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Safe & Secure</h3>
                <p>Your privacy and security are our top priorities with advanced verification systems.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💞</div>
                <h3>Smart Matching</h3>
                <p>Advanced algorithm that finds compatible matches based on your preferences.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌎</div>
                <h3>Global Community</h3>
                <p>Connect with people from all around the world who share your interests.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <h3>50K+</h3>
                <p>Active Users</p>
              </div>
              <div className="stat-item">
                <h3>1K+</h3>
                <p>Success Stories</p>
              </div>
              <div className="stat-item">
                <h3>95%</h3>
                <p>Satisfaction Rate</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>Support Available</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Home;