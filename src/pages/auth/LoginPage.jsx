import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setLogin } from "../../store/slices/authSlice";
import { loginUser } from "../../services/authServices";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser({
        email: form.email,
        password: form.password,
      });

      dispatch(setLogin(result));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Sign in</h1>
      <p className="mb-6 text-sm text-slate-400">
        Log in to access your cardiac monitoring dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-rose-500 py-3 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-400">
        Don’t have an account?{" "}
        <Link to="/register" className="text-rose-400 hover:text-rose-300">
          Create one
        </Link>
      </p>
    </div>
  );
}
