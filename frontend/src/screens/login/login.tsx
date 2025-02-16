import { useState } from "react";
import { useLogin } from "../../hooks/CreateSocketAction";

interface LoginProps {
  onLogin: (playerId: string) => void;
}

// Login screen - todo
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { sendAction } = useLogin();

  const handleLogin = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      const response = await sendAction({ name: name });
      if (response.success && response.playerId) {
        onLogin(response.playerId);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error) {
      setError("Login failed");
    }
  };

  return (
    <div className="Login">
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Login;
