import { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithMockCredentials } from "../../services/authService.js";
import Button from "../ui/Button.jsx";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.09 2.31-.86 3.59-.8 1.51.05 2.78.72 3.67 1.84-3.04 1.77-2.52 5.86.32 7.08-.73 1.78-1.57 3.23-2.66 4.05zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    signInWithMockCredentials({ email, password });
  }

  return (
    <div className="w-full md:w-1/2 p-stack-lg flex flex-col justify-center">
      <div className="mb-stack-lg text-center md:text-left">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-container text-on-primary rounded-lg mb-stack-sm shadow-sm">
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_dining
          </span>
        </div>
        <h1 className="font-section-title text-section-title text-on-surface mb-2">
          Welcome back to Otter Delivery
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Sign in to continue your food discovery journey.
        </p>
      </div>

      <form className="space-y-stack-md" onSubmit={handleSubmit}>
        <div>
          <label
            className="block font-metadata text-metadata text-on-surface mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="w-full bg-surface-container-low border border-surface rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-colors"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="hello@example.com"
            type="email"
            value={email}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              className="block font-metadata text-metadata text-on-surface"
              htmlFor="password"
            >
              Password
            </label>
            <a
              className="font-metadata text-metadata text-primary hover:text-primary-container transition-colors"
              href="#forgot-password"
            >
              Forgot password?
            </a>
          </div>
          <input
            className="w-full bg-surface-container-low border border-surface rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-colors"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
            value={password}
          />
        </div>

        <div className="pt-stack-sm">
          <Button
            className="w-full hover:bg-[#3A5B59] py-4 rounded-lg"
            type="submit"
          >
            <span>Sign in</span>
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </Button>
        </div>
      </form>

      <div className="mt-stack-lg">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-container-high" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface-container-lowest font-metadata text-metadata text-outline">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-stack-md grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-surface rounded-lg hover:bg-surface-container-low transition-colors font-button text-button text-on-surface">
            <GoogleIcon />
            Google
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-surface rounded-lg hover:bg-surface-container-low transition-colors font-button text-button text-on-surface">
            <AppleIcon />
            Apple
          </button>
        </div>
      </div>

      <div className="mt-stack-lg text-center">
        <p className="font-metadata text-metadata text-on-surface-variant">
          Don't have an account?
          <Link
            className="text-primary hover:text-primary-container font-button text-button transition-colors ml-1"
            to="/login"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
