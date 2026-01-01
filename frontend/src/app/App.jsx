// src/app/App.jsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}