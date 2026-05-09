import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setLogin } from "../../store/slices/authSlice";
import { registerUser } from "../../services/authServices";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await registerUser({
        name: form.fullName,
        email: form.email,
        password: form.password,
      });

      dispatch(setLogin(result));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Create account</h1>
      <p className="mb-6 text-sm text-slate-400">
        Register to access your cardiac monitoring dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="fullName"
          type="text"
          placeholder="Full name"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.password}
          onChange={handleChange}
        />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          className="w-full rounded-lg bg-slate-800 px-4 py-3 text-white outline-none"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-rose-500 py-3 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="text-rose-400 hover:text-rose-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
