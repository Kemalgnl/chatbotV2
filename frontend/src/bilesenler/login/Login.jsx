import { useState } from "react";
import "./Login.css";
import { FaUser, FaLock } from "react-icons/fa";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    if (email === "admin@admin.com" && password === "1234") {
      onLogin(true);
    } else {
      alert("Geçersiz kullanıcı bilgileri!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Giriş Yap</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            Giriş Yap
          </button>
          <p className="signup-text">
            Hesabınız yok mu? <a href="#">Kayıt Ol</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
