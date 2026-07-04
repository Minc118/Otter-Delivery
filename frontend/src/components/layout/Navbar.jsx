import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getDeliveryTiming } from "../../hooks/useDeliverySimulation.js";
import { getTrackedDeliveryOrders } from "../../services/trackingState.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const DELIVERY_BADGE_CLASS =
  "hidden md:flex items-center gap-2 rounded-full bg-surface-light px-4 py-2 font-metadata text-metadata";
const DELIVERED_GRACE_PERIOD_MS = 15 * 60 * 1000;

export default function Navbar({
  activeOrderId,
  cartItemCount = 0,
  isCartOpen,
  markDeliveryDelivered,
  onCartClick,
  trackedOrders,
}) {
  const location = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [languageOpen, setLanguageOpen] = useState(false);
  const { language, setLanguage: setLang } = useLanguage();

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest(".language-dropdown")) {
        setLanguageOpen(false);
      }
    }

    if (languageOpen) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [languageOpen]);
  const trackedDeliveries = useMemo(
    () => getTrackedDeliveryOrders(trackedOrders),
    [trackedOrders],
  );
  const deliverySummaries = useMemo(
    () =>
      trackedDeliveries.map((entry) => ({
        ...entry,
        timing: getDeliveryTiming(entry.simulationOrder, now),
      })),
    [now, trackedDeliveries],
  );
  const activeDeliveries = deliverySummaries.filter(
    (entry) => entry.timing && entry.timing.phase !== "DELIVERED",
  );
  const activePendingTrackedOrder = (trackedOrders ?? []).find(
    (order) =>
      String(order.id) === String(activeOrderId) &&
      !order.deliveredAt &&
      ["pending", "failed"].includes(order.assignmentStatus),
  );
  const activeDelivery =
    activeDeliveries.find(
      (entry) => entry.simulationOrder.id === String(activeOrderId),
    ) ?? (activePendingTrackedOrder ? null : activeDeliveries[0]);
  const activeTrackedOrder =
    activePendingTrackedOrder ??
    (trackedOrders ?? []).find(
      (order) =>
        order?.id != null &&
        !order.deliveredAt &&
        ["pending", "failed"].includes(order.assignmentStatus),
    );
  const pendingTrackedOrder = activeDelivery ? null : activeTrackedOrder;
  const recentDelivered = deliverySummaries
    .filter((entry) => entry.timing?.phase === "DELIVERED")
    .map((entry) => ({
      ...entry,
      deliveredAt:
        Number(entry.order.deliveredAt) || entry.timing.deliveredAt,
    }))
    .sort((left, right) => right.deliveredAt - left.deliveredAt)[0];
  const showRecentDelivered = Boolean(
    !activeDelivery &&
      !pendingTrackedOrder &&
      recentDelivered &&
      now - recentDelivered.deliveredAt < DELIVERED_GRACE_PERIOD_MS,
  );
  const hasCartItems = cartItemCount > 0;
  const isProfileActive = location.pathname === "/profile";
  const profile = JSON.parse(localStorage.getItem("profile"));
  const languages = [
    { code: "BG", label: "Bulgarian" },
    { code: "DE", label: "German" },
    { code: "FR", label: "French" },
    { code: "IT", label: "Italian" },
    { code: "ZH", label: "Chinese" },
    { code: "FA", label: "Persian" },
    { code: "EN", label: "English" },
  ];

  function handleLanguageSelect(lang) {
    setLang(lang);
    setLanguageOpen(false);
  }
  const navLinkClass = ({ isActive }) =>
    `font-body-md text-body-md transition-all duration-150 active:scale-95 ${
      isActive
        ? "text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 hover:text-primary dark:hover:text-primary-fixed-dim"
        : "text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim"
    }`;

  useEffect(() => {
    if (trackedDeliveries.length === 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(intervalId);
  }, [trackedDeliveries.length]);

  useEffect(() => {
    deliverySummaries.forEach((entry) => {
      if (entry.timing?.phase === "DELIVERED" && !entry.order.deliveredAt) {
        markDeliveryDelivered(
          entry.simulationOrder.id,
          entry.timing.deliveredAt,
        );
      }
    });
  }, [deliverySummaries, markDeliveryDelivered]);

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
          {showRecentDelivered ? (
            <span
              className={`${DELIVERY_BADGE_CLASS} text-on-surface-variant`}
            >
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              Delivered
            </span>
          ) : activeDelivery ? (
            <Link
              aria-label={`Track order ${activeDelivery.simulationOrder.id}, arriving in ${activeDelivery.timing.remainingMinutes} minutes`}
              className={`${DELIVERY_BADGE_CLASS} text-primary transition-all duration-150 hover:bg-surface active:scale-95 dark:text-primary-fixed-dim`}
              to={`/orders/${activeDelivery.simulationOrder.id}/tracking`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pedal_bike
              </span>
              Arriving in {activeDelivery.timing.remainingMinutes} min
            </Link>
          ) : pendingTrackedOrder ? (
            <Link
              aria-label={`Track order ${pendingTrackedOrder.id}, preparing order`}
              className={`${DELIVERY_BADGE_CLASS} text-primary transition-all duration-150 hover:bg-surface active:scale-95 dark:text-primary-fixed-dim`}
              to={`/orders/${pendingTrackedOrder.id}/tracking`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pedal_bike
              </span>
              Preparing order
            </Link>
          ) : (
            <span
              aria-label="Delivery promise: approximately 40 minutes"
              className={`${DELIVERY_BADGE_CLASS} text-primary dark:text-primary-fixed-dim`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                pedal_bike
              </span>
              approx. 40 mins
            </span>
          )}
          <div className="flex gap-4">
            {/*<button*/}
            {/*  aria-label="Change language"*/}
            {/*  className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-all duration-150 active:scale-95 p-2"*/}
            {/*  type="button"*/}
            {/*>*/}
            {/*  <span className="material-symbols-outlined">language</span>*/}
            {/*</button>*/}
            <div className="relative language-dropdown">
              <button
                  aria-label="Change language"
                  className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-all duration-150 active:scale-95 p-2"
                  type="button"
                  onClick={() => setLanguageOpen((prev) => !prev)}
              >
                <span className="material-symbols-outlined">language</span>
              </button>

              {languageOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-surface-container shadow-lg rounded-md border border-surface-variant z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-surface ${
                                language === lang.code ? "text-primary font-semibold" : ""
                            }`}
                        >
                          {lang.label}
                        </button>
                    ))}
                  </div>
              )}
            </div>
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
                to={profile ? "/profile" : "/login"}
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
