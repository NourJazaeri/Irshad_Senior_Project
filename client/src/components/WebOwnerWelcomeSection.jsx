import React, { useState } from 'react';
import '../styles/owner-components.css';

export default function WelcomeSection() {
  // User name from localStorage
  const [userName] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.firstName) {
          return userData.firstName;
        } else if (userData.email) {
          const namePart = userData.email.split('@')[0];
          return namePart.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    return 'Website Owner';
  });

  return (
    <section className="welcome">
      <h2>Welcome, {userName}</h2>
      <p>Oversee company registrations and platform performance.</p>
    </section>
  );
}
