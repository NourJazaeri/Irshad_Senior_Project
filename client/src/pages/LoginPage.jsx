import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import LoginCard from "../components/LoginCard";
import "../styles/login.css";

function LoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add login-page class to body when component mounts
    document.body.classList.add('login-page');
    
    // Remove login-page class when component unmounts
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('role_lc');
  }, []);
  
  const handleLogin = (data) => {
    setUser(data.user); // save user info in state
    console.log("User logged in:", data.user);
    // You can also save token in localStorage if needed:
    localStorage.setItem("token", data.token);
  };

  return (
    <div className="app-container">
      <Hero />
      {!user ? <LoginCard onLogin={handleLogin} /> : <h2>Welcome, {user.fname}!</h2>}
    </div>
  );
}

export default LoginPage;
