import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import useAuth from "../auth/useAuth";

export default function Signup() {
  const navigate = useNavigate();
  const { isSupabaseConfigured, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { data, error: authError } = await signup({ email, password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      navigate("/portfolio");
      return;
    }

    setMessage("Check your email to confirm your account, then log in.");
  };

  return (
    <div className="card">
      <h2>Sign Up</h2>

      {!isSupabaseConfigured && (
        <p className="error">Supabase environment variables are not configured.</p>
      )}

      {message && <p className="success">{message}</p>}
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
          minLength={6}
        />

        <button type="submit" className="btn-buy" disabled={loading || !isSupabaseConfigured}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
