import React, { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
const FAQs = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqItems = [
    {
      id: '1',
      question: 'How do I create an account?',
      answer: 'To create an account, download our app from the App Store or Google Play Store, open the app, and follow the registration process. You\'ll need to provide some basic information and verify your email address.'
    },
    {
      id: '2',
      question: 'How does the matching algorithm work?',
      answer: 'Our algorithm considers your preferences, interests, location, and behavior patterns to suggest compatible matches. The more you use the app and interact with others, the better our suggestions become.'
    },
    {
      id: '3',
      question: 'How can I upgrade to premium?',
      answer: 'You can upgrade to premium by going to your profile settings, selecting "Premium Membership," and choosing the plan that works best for you. We offer monthly, quarterly, and annual subscription options.'
    },
    {
      id: '4',
      question: 'How do I report inappropriate behavior?',
      answer: 'To report a user or content, go to their profile, tap the three dots in the top right corner, and select "Report." You can also block users from the same menu to prevent further contact.'
    },
    {
      id: '5',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account at any time. Go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone.'
    },
    {
      id: '6',
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password" and enter your email address. We\'ll send you a link to reset your password. Make sure to check your spam folder if you don\'t see our email.'
    },
    {
      id: '7',
      question: 'Why can\'t I see who liked me?',
      answer: 'Seeing who liked your profile is a premium feature. Free users receive notifications about likes but need to upgrade to premium to see specific profiles that liked them.'
    },
    {
      id: '8',
      question: 'How do I change my location?',
      answer: 'Go to Settings > Location to update your location preferences. The app uses your device\'s location services to find matches near you. You can also set a specific location manually.'
    },
    {
      id: '9',
      question: 'What should I do if I encounter a technical issue?',
      answer: 'If you experience technical problems, try restarting the app first. If the issue persists, go to Help & Support > Report a Problem to contact our technical support team.'
    },
    {
      id: '10',
      question: 'How do I manage my notification settings?',
      answer: 'You can manage notifications in Settings > Notifications. Here you can choose which types of notifications you want to receive and how you want to receive them.'
    }
  ];

  return (
    <>
      <Header />
      <div className="faqs-container">
        <div className="container">
          <div className="faqs-header">
            <h1>Frequently Asked Questions</h1>
            <p className="intro-text">
              Find answers to common questions about using our dating app. If you can't find what you're looking for, feel free to contact our support team.
            </p>
          </div>

          <div className="faqs-content">
            {faqItems.map((item) => (
              <div key={item.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleItem(item.id)}
                >
                  <span>{item.question}</span>
                  <span className="faq-icon">
                    {expandedItems[item.id] ? '−' : '+'}
                  </span>
                </button>
                
                {expandedItems[item.id] && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="contact-section">
            <h3>Still need help?</h3>
            <p>Our support team is here to assist you with any questions or concerns.</p>
            <button className="btn btn-primary">
              Contact Support
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FAQs;