import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  isProfileServiceUnavailable,
  login,
} from "../../services/profileService.js";
import Button from "../ui/Button.jsx";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const profile = await login(username);

      localStorage.setItem("profile", JSON.stringify(profile));

      navigate("/");
    } catch (error) {
      setError(
        isProfileServiceUnavailable(error)
          ? "Profile service is currently unavailable"
          : "Profile not found",
      );
    }
  }

  return (
      <div className="w-full md:w-1/2 p-stack-lg flex flex-col justify-center">
        <div className="mb-stack-lg text-center md:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-container text-on-primary rounded-lg mb-stack-sm shadow-sm">
          <span className="material-symbols-outlined text-[28px]">
            local_dining
          </span>
          </div>

          <h1 className="font-section-title text-section-title text-on-surface mb-2">
            Welcome back to Otter Delivery
          </h1>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Sign in with your username.
          </p>
        </div>

        <form className="space-y-stack-md" onSubmit={handleSubmit}>
          <div>
            <label
                className="block font-metadata text-metadata text-on-surface mb-2"
                htmlFor="username"
            >
              Username
            </label>

            <input
                className="w-full bg-surface-container-low border border-surface rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-colors"
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder=""
                type="text"
                value={username}
            />
          </div>

          {error && (
              <p className="text-red-500 font-metadata text-metadata">
                {error}
              </p>
          )}

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
