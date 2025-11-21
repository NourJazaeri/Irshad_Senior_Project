import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";

function LogoutButton({ sessionId }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call backend to update session
      await axios.post("http://localhost:5000/api/auth/logout", { sessionId });

      // Clear JWT from localStorage (stateless logout)
      localStorage.removeItem("token");
      
      // Clear chatbot conversation from sessionStorage
      sessionStorage.removeItem("chatbot_conversation");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear chatbot conversation even if backend call fails
      sessionStorage.removeItem("chatbot_conversation");
    }
  };

  return (
    <button className="logout" onClick={handleLogout}>
      <FiLogOut /> Logout
    </button>
  );
}

export default LogoutButton;
