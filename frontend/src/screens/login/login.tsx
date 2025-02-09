import { SocketEvents } from "@patchpatch/shared";
import socket from "../../services/socket/Socket";
import { useState } from "react";

interface LoginProps {
  onLogin: (playerId: string) => void;
}

// Login screen - todo
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    socket.emit(
      SocketEvents.LOGIN,
      name,
      (response: { success: boolean; playerId?: string; message?: string }) => {
        if (response.success && response.playerId) {
          onLogin(response.playerId); // Pass the playerId to the parent component
        } else {
          setError(response.message || "Login failed");
        }
      }
    );
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
