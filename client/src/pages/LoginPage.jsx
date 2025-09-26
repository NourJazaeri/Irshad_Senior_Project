import React, { useState } from "react";
import Hero from "../components/Hero";
import LoginCard from "../components/LoginCard";
import "../styles/login.css";

function LoginPage() {
  const [user, setUser] = useState(null);

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
