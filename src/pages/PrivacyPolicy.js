import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
const PrivacyPolicy = () => {
  const handleEmailContact = () => {
    window.location.href = 'mailto:choucouneteam@gmail.com';
  };

  return (
      <>
      <Header />
      <div className="privacy-container">
        <div className="container">
          <div className="privacy-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last Updated: Oct 20, 2025</p>
          </div>

          <div className="privacy-content">
            <p className="intro">
              At Choucoune Dating App, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share your information when you use our dating application.
            </p>
          <section className="policy-section">
            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, including:
            </p>
            <ul>
              <li>Profile information (name, age, photos, bio)</li>
              <li>Communication preferences</li>
              <li>Messages and interactions with other users</li>
              <li>Payment information for premium features</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>2. How We Use Your Information</h3>
            <p>
              We use your information to:
            </p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Create and maintain your account</li>
              <li>Facilitate matches and connections</li>
              <li>Communicate with you about the service</li>
              <li>Ensure safety and security of our community</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>3. Information Sharing</h3>
            <p>
              We may share your information with:
            </p>
            <ul>
              <li>Other users (as part of the matching process)</li>
              <li>Service providers who help us operate the App</li>
              <li>Law enforcement when required by law</li>
              <li>In connection with a business transfer</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>4. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="policy-section">
            <h3>5. Your Choices</h3>
            <p>
              You can:
            </p>
            <ul>
              <li>Update your profile information at any time</li>
              <li>Delete your account and personal data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="policy-section">
            <h3>6. Children's Privacy</h3>
            <p>
              Our App is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section className="policy-section">
            <h3>7. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
<section className="policy-section">
              <h3>8. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <button onClick={handleEmailContact} className="contact-button">
                <span className="contact-icon">✉</span>
                choucouneteam@gmail.com
              </button>
            </section>
          </div>
        </div>
      </div>
      <Footer />
      </>
  );
};

export default PrivacyPolicy;