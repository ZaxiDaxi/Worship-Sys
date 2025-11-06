// pages/Login.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AxiosInstance from "@/api/axios";
import LoginIllustration from "@/assets/login.jpg";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  /* If user already authenticated, redirect home */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) navigate("/");
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await AxiosInstance.post("auth/token/", {
        username,
        password,
      });

      /* keep tokens */
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      if (remember) localStorage.setItem("rememberMe", "true");

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    }
  };

  return (
    /* ------------- page wrapper: centres card ------------- */
    <div className="min-h-screen flex items-center justify-center">
      {/* ------------- card wrapper -------------------------- */}
      <div className="flex w-full max-w-5xl gap-10 px-6">
        {/* ---------------- Left (form) ---------------------- */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            WELCOME BACK
          </h1>
          <p className="text-gray-500 mb-10">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleSubmit} className="max-w-[420px] w-full">
            {/* Email */}
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="text"
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 mb-6 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />

            {/* Password */}
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 mb-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-red-500"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-gray-600 hover:text-red-500"
              >
                Forgot password
              </Link>
            </div>

            {/* Error message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Sign-in button */}
            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg py-3 transition-colors"
            >
              Sign in
            </button>

            {/* Google button */}
            <button
              type="button"
              className="w-full mt-4 flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Simple Google “G” SVG – swap with react-icon if you like */}
              <svg width="20" height="20" viewBox="0 0 533.5 544.3">
                <path
                  fill="#4285f4"
                  d="M533.5 278.4c0-19.8-1.6-39.6-4.9-58.8H272v111.6h146.9c-6.3 34.1-25.3 63.1-53.7 82.3v68.1h86.9c51-47 81.4-116.4 81.4-203.2z"
                />
                <path
                  fill="#34a853"
                  d="M272 544.3c72.9 0 134.2-24.3 178.9-66.2l-86.9-68.1c-24.1 16.3-55 25.9-92 25.9-70 0-129.4-47.2-150.7-110.3H31.5v69.3c44 87 134.1 149.4 240.5 149.4z"
                />
                <path
                  fill="#fbbc04"
                  d="M121.3 325.6c-10.5-31.5-10.5-65.5 0-97l-69.8-53.9c-30.6 60.9-30.6 131.1 0 192z"
                />
                <path
                  fill="#ea4335"
                  d="M272 107.7c39.6-.5 77.9 13.8 107.3 39.9l80.1-77.6C420.8 23.5 361.1 0 272 0 165.6 0 75.5 62.3 31.5 149.4l69.8 53.9C142.6 154.9 202 107.7 272 107.7z"
                />
              </svg>
              <span className="font-semibold">Sign in with Google</span>
            </button>

            {/* Sign-up link */}
            <p className="text-center text-sm mt-6">
              Don’t have an account?{" "}
              <Link to="/register" className="text-red-500 font-semibold">
                Sign up for free!
              </Link>
            </p>
          </form>
        </div>

        {/* -------------- Right (illustration) -------------- */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <img
            src={LoginIllustration}
            alt="Athlete illustration"
            className="w-4/5 max-w-[550px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
