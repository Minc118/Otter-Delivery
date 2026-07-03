import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import CartDrawer from "./components/cart/CartDrawer.jsx";
import Footer from "./components/layout/Footer.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import useCart from "./hooks/useCart.js";
import HomePage from "./routes/HomePage.jsx";
import LoginPage from "./routes/LoginPage.jsx";
import OrderConfirmationPage from "./routes/OrderConfirmationPage.jsx";
import OrderHistoryPage from "./routes/OrderHistoryPage.jsx";
import OrderSuccessPage from "./routes/OrderSuccessPage.jsx";
import OrderTrackingPage from "./routes/OrderTrackingPage.jsx";
import ProfilePage from "./routes/ProfilePage.jsx";
import RankingPage from "./routes/RankingPage.jsx";
import RestaurantDetailPage from "./routes/RestaurantDetailPage.jsx";
import RestaurantDiscoveryPage from "./routes/RestaurantDiscoveryPage.jsx";
import SavedRestaurantsPage from "./routes/SavedRestaurantsPage.jsx";

export default function App() {
  return (
    <CartProvider>
      <AppLayout />
    </CartProvider>
  );
}

function AppLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const {
    activeOrderId,
    itemCount,
    markDeliveryDelivered,
    trackedOrders,
  } = useCart();
  const isTransactionalRoute = location.pathname === "/login";
  const activeTrackingPath = getActiveTrackingPath(activeOrderId, trackedOrders);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface font-body-md">
      {isTransactionalRoute ? null : (
        <Navbar
          cartItemCount={itemCount}
          isCartOpen={isCartOpen}
          activeOrderId={activeOrderId}
          markDeliveryDelivered={markDeliveryDelivered}
          onCartClick={() => setIsCartOpen(true)}
          trackedOrders={trackedOrders}
        />
      )}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/profile/orders" element={<OrderHistoryPage />} />
          <Route path="/profile/saved" element={<SavedRestaurantsPage />} />
          <Route path="/orders/confirm" element={<OrderConfirmationPage />} />
          <Route path="/orders/:id/success" element={<OrderSuccessPage />} />
          <Route
            path="/tracking"
            element={<Navigate to={activeTrackingPath} replace />}
          />
          <Route path="/restaurants" element={<RestaurantDiscoveryPage />} />
          <Route path="/rankings" element={<RankingPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route
            path="/orders/:id/tracking"
            element={<OrderTrackingPage />}
          />
        </Routes>
      </main>
      {isTransactionalRoute ? null : <Footer />}
      {isTransactionalRoute ? null : (
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </div>
  );
}

function getActiveTrackingPath(activeOrderId, trackedOrders) {
  const activeOrder = trackedOrders.find(
    (order) => String(order.id) === String(activeOrderId),
  );
  const trackingOrderId = activeOrder?.id ?? trackedOrders[0]?.id;

  return trackingOrderId ? `/orders/${trackingOrderId}/tracking` : "/orders";
}
