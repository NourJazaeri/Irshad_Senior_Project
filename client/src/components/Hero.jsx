import React from 'react';

function Hero() {
  return (
    <section className="hero" aria-label="Intro" style={{ paddingTop: '0px', marginTop: '-60px' }}>
      <div className="hero-logo" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        marginBottom: '-20px',
        width: '100%',
        height: '180px'
      }}>
        <img 
          src="/logos/irshad-logo2.png" 
          alt="Irshad Logo" 
          style={{ 
            width: '750px',
            height: 'auto',
            objectFit: 'cover',
            objectPosition: 'center center',
            transform: 'scale(1.5)',
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))'
          }} 
        />
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', marginTop: '-10px' }}>Welcome to Irshad</h1>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '16px' }}>
        Irshad is your all-in-one onboarding and training platform, replacing scattered documents 
        and repeated explanations with a clear, organized training space. New hires ramp up faster, 
        supervisors save time, and teams stay aligned from day one.
      </p>
      <h3 style={{ marginTop: '16px', marginBottom: '12px', fontSize: '1.1rem', fontWeight: '600' }}>
        Why Irshad?
      </h3>
      <ul className="bullets" style={{ fontSize: '0.9rem' }}>
        <li><span className="dot" />AI-powered trainee support</li>
        <li><span className="dot" />Centralized content & quizzes</li>
        <li><span className="dot" />Real-time progress tracking</li>
        <li><span className="dot" />Smooth supervisor–trainee communication</li>
      </ul>
    </section>
  );
}

export default Hero;
