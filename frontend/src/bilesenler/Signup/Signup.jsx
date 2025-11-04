import { useState } from "react";
import "./signup.css";

export default function LoginSignup() {
  const [isSignup, setIsSignup] = useState(false);

  const toggleForm = () => setIsSignup(!isSignup);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignup ? "Kayıt Ol" : "Giriş Yap"}</h2>

        <form className="auth-form">
          {isSignup && (
            <input
              type="text"
              placeholder="Ad Soyad"
              className="auth-input"
              required
            />
          )}
          <input
            type="email"
            placeholder="E-posta"
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Şifre"
            className="auth-input"
            required
          />

          <button type="submit" className="auth-button">
            {isSignup ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </form>

        <p className="toggle-text">
          {isSignup
            ? "Zaten hesabın var mı? "
            : "Hesabın yok mu? "}
          <span onClick={toggleForm}>
            {isSignup ? "Giriş Yap" : "Kayıt Ol"}
          </span>
        </p>
      </div>
    </div>
  );
}
