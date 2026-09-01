import axios from "axios";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { authService, googleClientId } from "../config";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";
import BrandLogo from "../components/BrandLogo";
import {
  BiCheckCircle,
  BiMapPin,
  BiLock,
  BiUser,
} from "react-icons/bi";
import { MdOutlineDeliveryDining } from "react-icons/md";

type AuthMode = "login" | "signup";

const Login = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { setUser, setIsAuth } = useAppData();

  const handleEmailSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("Please enter your name.");
        return;
      }

      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/email-login"
          : "/api/auth/register";

      const payload =
        mode === "login"
          ? {
              email: email.trim(),
              password,
            }
          : {
              name: name.trim(),
              email: email.trim(),
              password,
            };

      const { data } = await axios.post(
        `${authService}${endpoint}`,
        payload
      );

      localStorage.setItem("token", data.token);

      setUser(data.user);
      setIsAuth(true);

      toast.success(
        mode === "login"
          ? "Welcome back to CraveMate"
          : "Account created successfully"
      );

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Authentication failed. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const responseGoogle = async (authResult: { code: string }) => {
    if (!authResult.code) {
      toast.error(
        "Google sign-in did not return an authorization code."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await axios.post(
        `${authService}/api/auth/login`,
        {
          code: authResult.code,
        }
      );

      localStorage.setItem("token", result.data.token);

      setUser(result.data.user);
      setIsAuth(true);

      toast.success("Welcome to CraveMate");

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Could not sign you in with Google."
        );
      } else {
        toast.error("Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: () =>
      toast.error(
        "Google sign-in was cancelled or failed."
      ),
    flow: "auth-code",
  });

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      toast.error(
        "Google Sign-In is not configured."
      );
      return;
    }

    googleLogin();
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">

      {/* LEFT SIDE */}
      <section className="relative hidden min-h-[620px] overflow-hidden rounded-[2.25rem] bg-slate-950 p-10 text-white shadow-2xl lg:block">

        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />

        <div className="absolute -bottom-24 -left-14 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">

          

          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-100">
              Food that finds you
            </span>

            <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.02] tracking-[-0.055em]">
              Your next favourite meal is closer than you think.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              One CraveMate account for ordering food,
              restaurant operations, and delivery workflows.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">

            {[
              [
                "Nearby",
                "restaurants",
                <BiMapPin key="map" />,
              ],

              [
                "Secure",
                "checkout",
                <BiCheckCircle key="check" />,
              ],

              [
                "Live",
                "delivery",
                <MdOutlineDeliveryDining key="delivery" />,
              ],
            ].map(([title, subtitle, icon]) => (
              <div
                key={String(title)}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <span className="text-xl text-orange-300">
                  {icon}
                </span>

                <p className="mt-3 text-sm font-bold">
                  {title}
                </p>

                <p className="text-xs text-slate-400">
                  {subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="mx-auto w-full max-w-md">

        <div className="cm-card p-6 sm:p-8">

          <div className="lg:hidden">
            <BrandLogo link={false} />
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-orange-500 lg:mt-0">
            {mode === "login"
              ? "Welcome back"
              : "Get started"}
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {mode === "login"
              ? "Sign in to CraveMate"
              : "Create your account"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "login"
              ? "Choose the sign-in method that works best for you."
              : "Create an account and start using CraveMate."}
          </p>

          <form
            onSubmit={handleEmailSubmit}
            className="mt-7 space-y-4"
          >

            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full name
                </label>

                <div className="relative">
                  <BiUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

          <div>
  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
    Password
  </label>

  <div className="relative">
    <BiLock
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      size={19}
    />

    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
      autoComplete={
        mode === "login"
          ? "current-password"
          : "new-password"
      }
      className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={
        showPassword ? "Hide password" : "Show password"
      }
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      {showPassword ? (
        <FiEyeOff size={19} />
      ) : (
        <FiEye size={19} />
      )}
    </button>
  </div>

  {mode === "signup" && (
    <p className="mt-1.5 text-xs text-slate-400">
      Minimum 8 characters
    </p>
  )}
</div>

            {mode === "signup" && (
            <div>
  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
    Confirm password
  </label>

  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      placeholder="Confirm your password"
      autoComplete="new-password"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword((prev) => !prev)
      }
      aria-label={
        showConfirmPassword
          ? "Hide confirm password"
          : "Show confirm password"
      }
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      {showConfirmPassword ? (
        <FiEyeOff size={19} />
      ) : (
        <FiEye size={19} />
      )}
    </button>
  </div>
</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FcGoogle size={22} />

            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "signup"
                    : "login"
                );

                setShowPassword(false);
                setShowConfirmPassword(false);
                setPassword("");
                setConfirmPassword("");
              }}
              className="ml-1 font-bold text-orange-500 hover:text-orange-600"
            >
              {mode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to CraveMate’s
            Terms of Service and Privacy Policy.
          </p>

        </div>
      </section>
    </main>
  );
};

export default Login;