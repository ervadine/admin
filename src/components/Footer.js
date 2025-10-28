import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Choucoune Dating</h3>
            <p>Finding meaningful connections in a safe and welcoming environment.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <a href="mailto:choucouneteam@gmail.com">Contact Us</a>
            <a href="#">Help Center</a>
            <a href="#">Safety Tips</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Choucoune Dating App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;