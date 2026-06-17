import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import useAuth from "../auth/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { bootstrapError, isSupabaseConfigured, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await login({ email, password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    navigate("/portfolio");
  };

  return (
    <div className="card">
      <h2>Login</h2>

      {!isSupabaseConfigured && (
        <p className="error">Supabase environment variables are not configured.</p>
      )}

      {bootstrapError && <p className="error">{bootstrapError}</p>}
      {error && <p className="error">{error}</p>}

      <form className="order-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" className="btn-buy" disabled={loading || !isSupabaseConfigured}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="muted">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
