import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";

function LogoutButton({ sessionId }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call backend to update session
      const API_BASE = import.meta.env.VITE_API_BASE;
      await axios.post(`${API_BASE}/api/auth/logout`, { sessionId });

      // Clear JWT from localStorage (stateless logout)
      localStorage.removeItem("token");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button className="logout" onClick={handleLogout}>
      <FiLogOut /> Logout
    </button>
  );
}

export default LogoutButton;
