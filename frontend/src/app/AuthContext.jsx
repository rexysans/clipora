import { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config/api";
import UsernameModal from "../components/UI/UsernameModal";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    fetch(API_ENDPOINTS.AUTH.ME, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((userData) => {
        setUser(userData);
        // Show username modal if user doesn't have a username
        if (userData && !userData.username) {
          setShowUsernameModal(true);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const handleUsernameComplete = (username) => {
    setUser({ ...user, username });
    setShowUsernameModal(false);
  };

  const handleUsernameSkip = () => {
    setShowUsernameModal(false);
  };

  const updateUser = (updates) => {
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser }}>
      {children}
      {showUsernameModal && user && (
        <UsernameModal
          user={user}
          onComplete={handleUsernameComplete}
          onSkip={handleUsernameSkip}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}