import { Link, NavLink, useLocation } from "react-router-dom";

export default function Navbar({
  activeOrder,
  cartItemCount = 0,
  isCartOpen,
  onCartClick,
}) {
  const location = useLocation();
  const hasCartItems = cartItemCount > 0;
  const isProfileActive = location.pathname === "/profile";
  const navLinkClass = ({ isActive }) =>
    `font-body-md text-body-md transition-all duration-150 active:scale-95 ${
      isActive
        ? "text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 hover:text-primary dark:hover:text-primary-fixed-dim"
        : "text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim"
    }`;

  return (
    <header className="bg-surface-container-lowest dark:bg-inverse-surface border-b border-surface-variant dark:border-outline-variant shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center h-20 px-margin-x w-full max-w-container-max mx-auto">
        <div className="flex items-center gap-8">
          <Link
            className="font-page-title text-page-title text-primary dark:text-primary-fixed-dim tracking-tight"
            to="/"
          >
            Otter Delivery
          </Link>
          <nav className="hidden md:flex gap-6" aria-label="Primary navigation">
            <NavLink
              className={navLinkClass}
              to="/restaurants"
            >
              Restaurants
            </NavLink>
            <NavLink
              className={navLinkClass}
              to="/rankings"
            >
              Rankings
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {activeOrder ? (
            <Link
              className="hidden md:flex items-center gap-2 text-primary dark:text-primary-fixed-dim bg-surface-light px-4 py-2 rounded-full font-metadata text-metadata transition-all duration-150 active:scale-95 hover:bg-surface"
              to={`/orders/${activeOrder.id}/tracking`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pedal_bike
              </span>
              {activeOrder.statusTitle}
            </Link>
          ) : (
            <span className="font-metadata text-metadata text-primary dark:text-primary-fixed-dim bg-surface-light px-4 py-2 rounded-full hidden md:inline-block">
              Guten Appetit
            </span>
          )}
          <div className="flex gap-4">
            <button
              aria-label="Change language"
              className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-all duration-150 active:scale-95 p-2"
              type="button"
            >
              <span className="material-symbols-outlined">language</span>
            </button>
            <button
              aria-label="Open cart"
              className={`relative transition-all duration-150 active:scale-95 p-2 ${
                isCartOpen
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant dark:text-surface-variant hover:text-primary"
              }`}
              onClick={onCartClick}
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={
                  isCartOpen || hasCartItems
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                shopping_cart
              </span>
              {hasCartItems ? (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-error text-on-error rounded-full text-[10px] leading-4 font-bold">
                  {cartItemCount}
                </span>
              ) : null}
            </button>
            <Link
              aria-label="Open account"
              className={`transition-all duration-150 active:scale-95 p-2 ${
                isProfileActive
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-on-surface-variant dark:text-surface-variant hover:text-primary"
              }`}
              to="/profile"
            >
              <span
                className="material-symbols-outlined"
                style={
                  isProfileActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                person
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
