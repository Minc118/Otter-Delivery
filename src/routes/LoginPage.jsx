import { useEffect } from "react";
import LoginForm from "../components/auth/LoginForm.jsx";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Login - Otter Delivery";
  }, []);

  return (
    <main className="flex-grow flex items-center justify-center p-margin-x bg-surface-container-lowest min-h-screen">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-surface-container-lowest rounded-xl overflow-hidden shadow-stitch border border-surface">
        <div className="hidden md:block md:w-1/2 relative bg-surface-light">
          <img
            alt="Healthy food bowl"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPRyajHByBfGpaz1K4lxJxyz1QluOjv9WokfXOgBI-8pZ1rLvhgQu5rJFelwp84kpB6-mGNKmbCySB25qWvVzFAjlpG7DJTaA8DiMXRzqmv9XjZOwS3X3iJazGU8tQ1W-40-Up6-6Yt6tE-qq4i9dAa6PaEViBEVts_3h7LHSJnFntpSvWHLyg4BC6AgQGApehG4UGJ5zswn44zXHnGyUSsYjtNEGnuItk4oYzIUOCwWf-vF2J50yLOC4x9d92QWsf_EhSUA2xpqI"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-light/80 to-transparent flex items-end p-stack-lg">
            <p className="font-metadata text-metadata text-dark-text bg-surface-light/90 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="material-symbols-outlined align-middle mr-2 text-[18px]">
                restaurant
              </span>
              Your preferences help Otter recommend better food.
            </p>
          </div>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
