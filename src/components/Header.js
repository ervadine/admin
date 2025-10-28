import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Assuming you have a logo image in your assets folder
import logo from '../assets/logo4.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <div className="nav-wrapper">
          <Link to="/" className="logo">
            <div className="logo-container">
              <img src={logo} alt="Choucoune Dating" className="logo-image" />
              <div className="logo-text">
                <span className="logo-main">Choucoune</span>
                <span className="logo-sub"></span>
              </div>
            </div>
          </Link>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
        
            <Link to="/faqs" className="nav-link">FAQs</Link>
            <Link to="/privacy" className="nav-link">Privacy Policy</Link>
          </nav>

          <div className="nav-actions">
         
            <button 
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;