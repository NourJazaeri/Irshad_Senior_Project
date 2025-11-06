import React from 'react';

function Hero() {
  return (
    <section className="hero" aria-label="Intro">
      <h1>Welcome to Irshad</h1>
      <p>Streamline your employee onboarding process with our comprehensive platform designed for modern organizations.</p>
      <ul className="bullets">
        <li><span className="dot" />Role-based access control</li>
        <li><span className="dot" />Progress tracking and analytics</li>
        <li><span className="dot" />Comprehensive content management</li>
      </ul>
    </section>
  );
}

export default Hero;
