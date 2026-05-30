import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminLayout from "@/components/layout/AdminLayout";
import CartDrawer from "@/components/cart/CartDrawer";
import { PrivateRoute, AdminRoute } from "@/components/Guards";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Nouveautes from "@/pages/Nouveautes";
import About from "@/pages/About";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminLivraison from "@/pages/admin/AdminLivraison";

function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Routes>
              <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
              <Route path="/shop" element={<StoreLayout><Shop /></StoreLayout>} />
              <Route path="/shop/:category" element={<StoreLayout><Shop /></StoreLayout>} />
              <Route path="/nouveautes" element={<StoreLayout><Nouveautes /></StoreLayout>} />
              <Route path="/apropos" element={<StoreLayout><About /></StoreLayout>} />
              <Route path="/product/:slug" element={<StoreLayout><ProductDetail /></StoreLayout>} />
              <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
              <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
              <Route path="/order/:id/confirmation" element={<StoreLayout><OrderConfirmation /></StoreLayout>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<PrivateRoute />}>
                <Route path="/favorites" element={<StoreLayout><Favorites /></StoreLayout>} />
                <Route path="/profile" element={<StoreLayout><Profile /></StoreLayout>} />
                <Route path="/orders" element={<StoreLayout><Orders /></StoreLayout>} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="livraison" element={<AdminLivraison />} />
                </Route>
              </Route>
            </Routes>
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: "#1C1C1E",
                  color: "#fff",
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  fontSize: "14px",
                  borderRadius: "12px",
                  border: "none",
                },
              }}
            />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
