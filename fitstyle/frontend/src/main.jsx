import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Activity, BarChart3, Camera, Dumbbell, ExternalLink, Eye, EyeOff, History, Home, Images, Lock, LogIn, LogOut, Mail, Percent, Ruler, Save, Settings, Shirt, ShoppingBag, Sparkles, Target, UserRound, UserPlus, X, ZoomIn } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import "./styles.css";


const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

const initialForm = {
  age: 21,
  gender: "male",
  heightCm: 172,
  weightKg: 65,
  neckCm: "",
  chestCm: "",
  waistCm: "",
  hipCm: "",
  activityLevel: "light",
  goal: "maintain"
};

const initialAuthForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  rememberMe: true
};

function readSavedSession() {
  const token = localStorage.getItem("fitstyle_token") || sessionStorage.getItem("fitstyle_token") || "";
  const savedUser = localStorage.getItem("fitstyle_user") || sessionStorage.getItem("fitstyle_user");

  try {
    return {
      token,
      user: savedUser ? JSON.parse(savedUser) : null,
      remember: Boolean(localStorage.getItem("fitstyle_token"))
    };
  } catch {
    localStorage.removeItem("fitstyle_token");
    localStorage.removeItem("fitstyle_user");
    sessionStorage.removeItem("fitstyle_token");
    sessionStorage.removeItem("fitstyle_user");
    return { token: "", user: null, remember: false };
  }
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown UI error" };
  }

  componentDidCatch(error) {
    console.error("FitStyle UI error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="panel empty-state app-error-state">
            <Sparkles size={42} />
            <h2>FitStyle UI error</h2>
            <p>Copy this error line and send it to Codex so we can fix the exact runtime issue.</p>
            <code className="app-error-detail">{this.state.message}</code>
            <button className="primary-button" type="button" onClick={() => {
              localStorage.removeItem("fitstyle_token");
              localStorage.removeItem("fitstyle_user");
              sessionStorage.removeItem("fitstyle_token");
              sessionStorage.removeItem("fitstyle_user");
              window.location.reload();
            }}>
              Reset session and reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
      <Analytics />
    </AppErrorBoundary>
  );
}

function AppShell() {
  const savedSession = React.useMemo(readSavedSession, []);
  const [token, setToken] = React.useState(savedSession.token);
  const [user, setUser] = React.useState(savedSession.user);
  const [rememberSession, setRememberSession] = React.useState(savedSession.remember);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);

  React.useEffect(() => {
    if (user && !localStorage.getItem("fitstyle_hasSeenFeedback")) {
      setShowFeedbackModal(true);
    } else {
      setShowFeedbackModal(false);
    }
  }, [user]);

  function closeFeedbackModal() {
    localStorage.setItem("fitstyle_hasSeenFeedback", "true");
    setShowFeedbackModal(false);
  }

  const apiFetch = React.useCallback(
    (path, options = {}) => {
      const headers = new Headers(options.headers || {});
      if (token) headers.set("Authorization", `Bearer ${token}`);

      return fetch(`${API_URL}${path}`, {
        ...options,
        headers
      });
    },
    [token]
  );

  React.useEffect(() => {
    if (token) loadCurrentUser();
  }, [token]);

  async function loadCurrentUser() {
    try {
      const response = await apiFetch("/api/auth/me");
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Phiên đăng nhập không hợp lệ.");
      saveSession(token, data.user, rememberSession);
    } catch {
      logout();
    }
  }

  function saveSession(nextToken, nextUser, remember = true) {
    setToken(nextToken);
    setUser(nextUser);
    setRememberSession(remember);

    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem("fitstyle_token");
    otherStorage.removeItem("fitstyle_user");
    targetStorage.setItem("fitstyle_token", nextToken);
    targetStorage.setItem("fitstyle_user", JSON.stringify(nextUser));
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("fitstyle_token");
    localStorage.removeItem("fitstyle_user");
    sessionStorage.removeItem("fitstyle_token");
    sessionStorage.removeItem("fitstyle_user");
  }

  return (
    <main className="app-shell">
      <div className="top-shell">
        <header className="site-header">
          <Link className="brand-mark" to="/">
            <span className="brand-logo-frame">
              <img src="/fitstyle-logo.jpg" alt="FitStyle logo" />
            </span>
            <div>
              <strong>FitStyle AI</strong>
              <small>Health + Style</small>
            </div>
          </Link>

          <div className="header-right">
            {user ? (
              <UserBadge user={user} onLogout={logout} />
            ) : (
              <div className="auth-actions">
                <Link className="secondary-link" to="/login">
                  <LogIn size={17} />
                  Đăng nhập
                </Link>
                <Link className="primary-link" to="/register">
                  <UserPlus size={17} />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </header>

        {user && (
          <nav className="app-nav" aria-label="Điều hướng chính">
            <NavLink to="/">
              <Home size={17} />
              Trang chủ
            </NavLink>
            <NavLink to="/analyze">
              <Camera size={17} />
              Phân tích
            </NavLink>
            <NavLink to="/history">
              <History size={17} />
              Lịch sử
            </NavLink>
            <NavLink to="/try-on">
              <Images size={17} />
              Phối đồ
            </NavLink>
            <NavLink to="/wardrobe">
              <ShoppingBag size={17} />
              Tủ đồ
            </NavLink>
            <NavLink className="premium-nav-link" to="/premium">
              <Sparkles size={17} />
              {user.premium ? "Premium" : "Nâng cấp"}
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin/dashboard">
                <BarChart3 size={17} />
                Dashboard
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/products">
                <ShoppingBag size={17} />
                Admin sản phẩm
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/products/manage">
                <ShoppingBag size={17} />
                Quản lý SP
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/users">
                <UserRound size={17} />
                Quản lý User
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/coupons">
                <Percent size={17} />
                Quản lý Coupon
              </NavLink>
            )}
          </nav>
        )}
      </div>

      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/analyze" element={<AnalyzePage user={user} apiFetch={apiFetch} />} />
        <Route path="/login" element={<AuthPage mode="login" user={user} onSession={saveSession} />} />
        <Route path="/register" element={<AuthPage mode="register" user={user} onSession={saveSession} />} />
        <Route path="/history" element={<HistoryPage user={user} apiFetch={apiFetch} />} />
        <Route path="/history/:id" element={<HistoryDetailPage user={user} apiFetch={apiFetch} />} />
        <Route path="/try-on" element={<TryOnPage user={user} apiFetch={apiFetch} onUserUpdate={(nextUser) => saveSession(token, nextUser, rememberSession)} />} />
        <Route path="/wardrobe" element={<WardrobePage user={user} apiFetch={apiFetch} />} />
        <Route path="/premium" element={<PremiumPage user={user} apiFetch={apiFetch} onUserUpdate={(nextUser) => saveSession(token, nextUser, rememberSession)} />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/products" element={<AdminProductsPage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/products/manage" element={<AdminProductManagePage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/users" element={<AdminUsersPage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage user={user} apiFetch={apiFetch} />} />
        <Route path="/profile" element={<ProfilePage user={user} apiFetch={apiFetch} onUserUpdate={(nextUser) => saveSession(token, nextUser, rememberSession)} />} />
      </Routes>
      <ChatWidgets apiFetch={apiFetch} />

      {showFeedbackModal && (
        <div className="feedback-overlay">
          <div className="feedback-modal">
            <button className="feedback-modal-close" onClick={closeFeedbackModal} aria-label="Đóng">
              <X size={18} />
            </button>
            <img src="/feedback.png" alt="Khảo sát ý kiến" className="feedback-modal-banner" />
            <div className="feedback-modal-body">
              <h2>Ý kiến của bạn là vô giá! 💬</h2>
              <div className="feedback-modal-text">
                <p>
                  Sau thời gian phát triển, FitStyle đã ra mắt website để mọi người trải nghiệm. Nếu bạn đã sử dụng web, chúng mình rất mong bạn dành 2–3 phút để chia sẻ cảm nhận thông qua form khảo sát dưới đây.
                </p>
                <p><strong>💬 Những đánh giá của bạn sẽ giúp nhóm:</strong></p>
                <ul>
                  <li>Cải thiện trải nghiệm sử dụng.</li>
                  <li>Nâng cao độ chính xác của AI.</li>
                  <li>Bổ sung những tính năng mà người dùng thực sự cần.</li>
                </ul>
                <p>
                  Mỗi góp ý, dù nhỏ, đều là động lực để nhóm hoàn thiện FitStyle hơn. Cảm ơn mọi người rất nhiều vì đã dành thời gian trải nghiệm và hỗ trợ nhóm ❤️.
                </p>
              </div>
            </div>
            <div className="feedback-modal-footer">
              <a
                href="https://forms.gle/fxrGUywP6s9HoABe8"
                target="_blank"
                rel="noopener noreferrer"
                className="feedback-btn feedback-btn-primary"
                onClick={closeFeedbackModal}
              >
                Làm khảo sát ngay 📝
              </a>
              <button
                className="feedback-btn feedback-btn-secondary"
                onClick={closeFeedbackModal}
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const initialProductForm = {
  name: "",
  brand: "Shopee",
  category: "Áo thun",
  gender: "unisex",
  price: "",
  imageUrl: "",
  affiliateUrl: "",
  sourceUrl: "",
  bodyShapeTags: ["balanced"],
  styleTags: "casual",
  occasionTags: "đi học, đi chơi",
  colors: "",
  fit: "",
  reason: "",
  isActive: true
};

function AdminDashboardPage({ user, apiFetch }) {
  const [dashboard, setDashboard] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user?.role === "admin") loadDashboard();
  }, [user]);

  if (!user) return <LockedPanel title="Dashboard admin" />;
  if (user.role !== "admin") return <LockedPanel title="Dashboard admin" />;

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/admin/dashboard");
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tải dashboard admin.");
      setDashboard(data.dashboard);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  const totals = dashboard?.totals || {};
  const conversion = dashboard?.conversion || {};

  return (
    <section className="admin-dashboard-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Dashboard admin</h2>
          <p>Theo dõi người dùng, lượt phân tích, sản phẩm affiliate và tín hiệu kinh doanh của FitStyle AI.</p>
        </div>
        <div className="admin-heading-actions">
          <button className="secondary-button" type="button" onClick={loadDashboard} disabled={loading}>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
          <Link className="secondary-link" to="/admin/products/manage">
            Quản lý SP
          </Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!dashboard ? (
        <div className="panel history-empty">{loading ? "Đang tải dashboard..." : "Chưa có dữ liệu dashboard."}</div>
      ) : (
        <>
          <div className="dashboard-kpi-grid">
            <DashboardKpi label="Người dùng" value={totals.users} note={`${totals.customers || 0} customer, ${totals.admins || 0} admin`} />
            <DashboardKpi label="Lượt phân tích" value={totals.analyses} note={`${totals.analysesWithPhoto || 0} lượt có ảnh`} />
            <DashboardKpi label="Sản phẩm" value={totals.products} note={`${totals.activeProducts || 0} đang hiển thị`} />
            <DashboardKpi label="Click affiliate" value={totals.affiliateClicks} note={`${conversion.clicksPerAnalysis || 0} click / phân tích`} />
          </div>

          <div className="dashboard-grid">
            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>7 ngày gần đây</h2>
                <span>Phân tích / click</span>
              </div>
              <div className="daily-bars">
                {dashboard.daily.analyses.map((day, index) => (
                  <div className="daily-bar-row" key={day.date}>
                    <span>{formatShortDate(day.date)}</span>
                    <div>
                      <i style={{ width: `${scaleBar(day.count, dashboard.daily.analyses)}%` }} />
                    </div>
                    <strong>{day.count}</strong>
                    <div>
                      <i className="click-bar" style={{ width: `${scaleBar(dashboard.daily.clicks[index]?.count || 0, dashboard.daily.clicks)}%` }} />
                    </div>
                    <strong>{dashboard.daily.clicks[index]?.count || 0}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>Top sản phẩm affiliate</h2>
                <span>{dashboard.topProducts.length}</span>
              </div>
              <DashboardList
                empty="Chưa có click affiliate."
                items={dashboard.topProducts}
                render={(item) => (
                  <>
                    <strong>{item.name}</strong>
                    <span>{item.clicks} click</span>
                  </>
                )}
              />
            </section>

            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>Dáng người phổ biến</h2>
                <span>{dashboard.bodyShapes.length}</span>
              </div>
              <DashboardList
                empty="Chưa có dữ liệu dáng người."
                items={dashboard.bodyShapes}
                render={(item) => (
                  <>
                    <strong>{item.key}</strong>
                    <span>{item.count} lượt</span>
                  </>
                )}
              />
            </section>

            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>Nhóm sản phẩm</h2>
                <span>{dashboard.productCategories.length}</span>
              </div>
              <DashboardList
                empty="Chưa có sản phẩm."
                items={dashboard.productCategories}
                render={(item) => (
                  <>
                    <strong>{item.category}</strong>
                    <span>{item.active}/{item.count} đang hiển thị</span>
                  </>
                )}
              />
            </section>
          </div>

          <div className="dashboard-grid">
            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>User mới</h2>
                <span>{dashboard.recentUsers.length}</span>
              </div>
              <DashboardList
                empty="Chưa có user."
                items={dashboard.recentUsers}
                render={(item) => (
                  <>
                    <strong>{item.name}</strong>
                    <span>{item.email} • {item.role} • {formatDate(item.createdAt)}</span>
                  </>
                )}
              />
            </section>

            <section className="panel dashboard-panel">
              <div className="section-heading">
                <h2>Phân tích mới</h2>
                <span>{dashboard.recentAnalyses.length}</span>
              </div>
              <DashboardList
                empty="Chưa có lượt phân tích."
                items={dashboard.recentAnalyses}
                render={(item) => (
                  <>
                    <strong>{item.bodyShape}</strong>
                    <span>BMI {item.bmi || "?"} • Outfit {item.outfitScore ?? "?"}/10 • {formatDate(item.createdAt)}</span>
                  </>
                )}
              />
            </section>
          </div>
        </>
      )}
    </section>
  );
}

function DashboardKpi({ label, value, note }) {
  return (
    <article className="dashboard-kpi">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      <small>{note}</small>
    </article>
  );
}

function DashboardList({ items, empty, render }) {
  if (!items.length) return <p className="dashboard-empty">{empty}</p>;

  return (
    <div className="dashboard-list">
      {items.map((item) => (
        <div key={item.id || item.productId || item.key || item.category || item.date}>{render(item)}</div>
      ))}
    </div>
  );
}

function scaleBar(value, rows) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return Math.max((value / max) * 100, value > 0 ? 8 : 0);
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

function AdminProductsPage({ user, apiFetch }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProductId = searchParams.get("edit") || "";
  const [form, setForm] = React.useState(initialProductForm);
  const [bodyShapes, setBodyShapes] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [extractUrl, setExtractUrl] = React.useState("");
  const [editingProductId, setEditingProductId] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user?.role === "admin") loadAdminProducts();
  }, [user]);

  React.useEffect(() => {
    if (!editProductId || products.length === 0) return;
    const product = products.find((item) => item.id === editProductId);
    if (!product) return;

    setEditingProductId(product.id);
    setForm(productToForm(product));
    setMessage(`Đang sửa: ${product.name}`);
  }, [editProductId, products]);

  if (!user) return <LockedPanel title="Admin sản phẩm" />;
  if (user.role !== "admin") return <LockedPanel title="Admin sản phẩm" />;

  async function loadAdminProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/products?includeInactive=true");
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tải danh sách sản phẩm.");

      setProducts(data.products || []);
      setBodyShapes(data.bodyShapes || []);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  function updateProductField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleShape(shapeKey) {
    setForm((current) => {
      const exists = current.bodyShapeTags.includes(shapeKey);
      const nextTags = exists
        ? current.bodyShapeTags.filter((tag) => tag !== shapeKey)
        : [...current.bodyShapeTags, shapeKey];

      return {
        ...current,
        bodyShapeTags: nextTags
      };
    });
  }

  function buildProductPayload() {
    return {
      ...form,
      bodyShapeTags: form.bodyShapeTags,
      styleTags: csvToList(form.styleTags),
      occasionTags: csvToList(form.occasionTags),
      colors: csvToList(form.colors),
      isActive: form.isActive
    };
  }

  async function extractFromShopeeLink(event) {
    event.preventDefault();
    setExtracting(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("/api/admin/products/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extractUrl })
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể phân tích link Shopee.");

      setForm(productToForm(data.product));
      setMessage("Đã phân tích link và tự điền form. Bạn kiểm tra lại ảnh, giá, tag dáng người rồi lưu.");
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setExtracting(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products", {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildProductPayload())
      });
      const data = await safeReadJson(response);

      if (!response.ok) {
        const detail = data.errors?.join(" ") || data.message || "Không thể lưu sản phẩm.";
        throw new Error(detail);
      }

      setMessage(editingProductId ? "Đã cập nhật sản phẩm." : "Đã lưu sản phẩm vào database. Sản phẩm sẽ hiện ở trang Tủ đồ.");
      setEditingProductId("");
      setForm(initialProductForm);
      await loadAdminProducts();
      if (editingProductId) navigate("/admin/products/manage");
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setSaving(false);
    }
  }

  function startEditProduct(product) {
    setEditingProductId(product.id);
    setForm(productToForm(product));
    setMessage(`Đang sửa: ${product.name}`);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditProduct() {
    setEditingProductId("");
    setForm(initialProductForm);
    setMessage("");
    setError("");
    navigate("/admin/products");
  }

  async function toggleProductActive(product) {
    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive })
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể cập nhật trạng thái sản phẩm.");

      setMessage(product.isActive ? "Đã ẩn sản phẩm khỏi tủ đồ." : "Đã bật lại sản phẩm.");
      await loadAdminProducts();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Xóa hẳn sản phẩm "${product.name}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await apiFetch(`/api/admin/products/${product.id}`, {
        method: "DELETE"
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể xoá sản phẩm.");

      if (editingProductId === product.id) cancelEditProduct();
      setMessage("Đã xoá sản phẩm khỏi database.");
      await loadAdminProducts();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  return (
    <section className="admin-products-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Admin thêm sản phẩm affiliate</h2>
          <p>
            Dán link ảnh, link Shopee affiliate và chọn dáng người phù hợp. Khi lưu, sản phẩm sẽ vào MongoDB collection products.
          </p>
        </div>
        <div className="admin-heading-actions">
          <Link className="secondary-link" to="/admin/products/manage">
            <ShoppingBag size={17} />
            Quản lý sản phẩm
          </Link>
          <Link className="secondary-link" to="/wardrobe">
            <ShoppingBag size={17} />
            Xem tủ đồ
          </Link>
        </div>
      </div>

      <section className="admin-product-layout">
        <form className="panel admin-product-form" onSubmit={saveProduct}>
          <div className="panel-title">
            <ShoppingBag size={20} />
            <h2>{editingProductId ? "Sửa sản phẩm" : "Thông tin sản phẩm"}</h2>
          </div>

          <div className="extract-box">
            <label>
              Dán link Shopee để tự tạo JSON
              <input
                value={extractUrl}
                onChange={(event) => setExtractUrl(event.target.value)}
                placeholder="https://s.shopee.vn/... hoặc https://shopee.vn/..."
              />
            </label>
            <button className="secondary-button" type="button" onClick={extractFromShopeeLink} disabled={extracting}>
              {extracting ? "Đang phân tích..." : "Phân tích link"}
            </button>
          </div>

          <div className="field-grid">
            <label>
              Tên sản phẩm
              <input name="name" value={form.name} onChange={updateProductField} placeholder="Áo thun oversize form đứng" />
            </label>
            <label>
              Brand/shop
              <input name="brand" value={form.brand} onChange={updateProductField} placeholder="Shopee" />
            </label>
            <label>
              Nhóm sản phẩm
              <input name="category" value={form.category} onChange={updateProductField} placeholder="Áo thun" />
            </label>
            <label>
              Giới tính
              <select name="gender" value={form.gender} onChange={updateProductField}>
                <option value="unisex">Unisex</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </label>
            <label>
              Giá hiển thị
              <input name="price" value={form.price} onChange={updateProductField} placeholder="199.000đ" />
            </label>
            <label>
              Fit/form
              <input name="fit" value={form.fit} onChange={updateProductField} placeholder="Oversize vừa, chất dày form" />
            </label>
          </div>

          <label>
            Link ảnh trực tiếp
            <input name="imageUrl" value={form.imageUrl} onChange={updateProductField} placeholder="https://...jpg" />
          </label>
          <label>
            Link Shopee affiliate
            <input name="affiliateUrl" value={form.affiliateUrl} onChange={updateProductField} placeholder="https://s.shopee.vn/..." />
          </label>
          <label>
            Link sản phẩm gốc
            <input name="sourceUrl" value={form.sourceUrl} onChange={updateProductField} placeholder="https://shopee.vn/..." />
          </label>

          <div className="shape-picker">
            <span>Dáng người phù hợp</span>
            <div>
              {bodyShapes.map((shape) => (
                <label className="shape-check" key={shape.key}>
                  <input
                    type="checkbox"
                    checked={form.bodyShapeTags.includes(shape.key)}
                    onChange={() => toggleShape(shape.key)}
                  />
                  {shape.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field-grid">
            <label>
              Style tags
              <input name="styleTags" value={form.styleTags} onChange={updateProductField} placeholder="casual, street" />
            </label>
            <label>
              Dịp mặc
              <input name="occasionTags" value={form.occasionTags} onChange={updateProductField} placeholder="đi học, đi chơi" />
            </label>
            <label className="wide-field">
              Màu sắc
              <input name="colors" value={form.colors} onChange={updateProductField} placeholder="đen, trắng, xám" />
            </label>
          </div>

          <label>
            Lý do phù hợp
            <textarea
              name="reason"
              value={form.reason}
              onChange={updateProductField}
              placeholder="Giúp phần thân trên đầy đặn hơn, hợp dáng mảnh hoặc dáng chữ nhật."
            />
          </label>

          <label className="check-row">
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={updateProductField} />
            Hiển thị trong tủ đồ
          </label>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <div className="admin-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editingProductId ? "Cập nhật sản phẩm" : "Lưu vào database"}
            </button>
            {editingProductId && (
              <button className="secondary-button" type="button" onClick={cancelEditProduct}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>

        <aside className="admin-product-side">
          <section className="panel product-preview-panel">
            <div className="panel-title">
              <Images size={20} />
              <h2>Preview</h2>
            </div>
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Preview sản phẩm" />
            ) : (
              <div className="preview-placeholder">Ảnh sản phẩm sẽ hiện ở đây</div>
            )}
            <pre>{JSON.stringify(buildProductPayload(), null, 2)}</pre>
          </section>

        </aside>
      </section>
    </section>
  );
}

function AdminProductManagePage({ user, apiFetch }) {
  const [products, setProducts] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user?.role === "admin") loadProducts();
  }, [user]);

  if (!user) return <LockedPanel title="Quản lý sản phẩm" />;
  if (user.role !== "admin") return <LockedPanel title="Quản lý sản phẩm" />;

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/products?includeInactive=true");
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tải danh sách sản phẩm.");
      setProducts(data.products || []);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleProductActive(product) {
    setMessage("");
    setError("");

    try {
      const response = await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive })
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể cập nhật trạng thái sản phẩm.");

      setMessage(product.isActive ? "Đã ẩn sản phẩm khỏi tủ đồ." : "Đã bật lại sản phẩm.");
      await loadProducts();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Xóa hẳn sản phẩm "${product.name}"?`)) return;

    setMessage("");
    setError("");

    try {
      const response = await apiFetch(`/api/admin/products/${product.id}`, {
        method: "DELETE"
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể xoá sản phẩm.");

      setMessage("Đã xoá sản phẩm khỏi database.");
      await loadProducts();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  const filteredProducts = products.filter((product) =>
    (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="admin-products-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Quản lý sản phẩm</h2>
          <p>Xem, sửa, ẩn hoặc xoá sản phẩm affiliate đang dùng trong tủ đồ.</p>
        </div>
        <Link className="secondary-link" to="/admin/products">
          <ShoppingBag size={17} />
          Thêm sản phẩm
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <section className="panel manage-products-panel">
        <div className="section-heading manage-products-header-with-search" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <h2>Sản phẩm hiện có</h2>
            <span className="count-badge" style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
              {loading ? "Đang tải..." : filteredProducts.length}
            </span>
          </div>
          <div className="search-bar-container" style={{ flex: "1", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên, loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <p className="manage-empty">Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          <div className="manage-product-list">
            {filteredProducts.map((product) => (
              <article className="manage-product-row" key={product.id}>
                <img src={product.imageUrl} alt={product.name} />
                <div className="manage-product-main">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.reason || "Chưa có mô tả lý do phù hợp."}</p>
                  </div>
                  <div className="tag-row">
                    {(product.bodyShapeTags || []).slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                    {(product.styleTags || []).slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="manage-product-meta">
                  <strong>{product.price || "Chưa có giá"}</strong>
                  <span>{product.category} • {product.gender}</span>
                  <em>{product.isActive ? "Đang hiển thị" : "Đang ẩn"}</em>
                  <small>{product.clickCount || 0} click affiliate</small>
                </div>
                <div className="manage-product-actions">
                  <Link className="secondary-link" to={`/admin/products?edit=${product.id}`}>
                    Sửa
                  </Link>
                  <button type="button" className="secondary-button" onClick={() => toggleProductActive(product)}>
                    {product.isActive ? "Ẩn" : "Bật"}
                  </button>
                  <button type="button" className="secondary-button danger-button" onClick={() => deleteProduct(product)}>
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function csvToList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function productToForm(product = {}) {
  return {
    name: product.name || "",
    brand: product.brand || "Shopee",
    category: product.category || "Áo thun",
    gender: product.gender || "unisex",
    price: product.price || "",
    imageUrl: product.imageUrl || "",
    affiliateUrl: product.affiliateUrl || "",
    sourceUrl: product.sourceUrl || "",
    bodyShapeTags: Array.isArray(product.bodyShapeTags) && product.bodyShapeTags.length ? product.bodyShapeTags : ["balanced"],
    styleTags: Array.isArray(product.styleTags) ? product.styleTags.join(", ") : product.styleTags || "",
    occasionTags: Array.isArray(product.occasionTags) ? product.occasionTags.join(", ") : product.occasionTags || "",
    colors: Array.isArray(product.colors) ? product.colors.join(", ") : product.colors || "",
    fit: product.fit || "",
    reason: product.reason || "",
    isActive: product.isActive !== false
  };
}

function normalizeBodyShapeFilterKey(value) {
  const aliases = {
    pear: "triangle",
    curvy: "oval"
  };

  return aliases[value] || value;
}

function WardrobePage({ user, apiFetch }) {
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [styles, setStyles] = React.useState([]);
  const [bodyShapes, setBodyShapes] = React.useState([]);
  const [latestShape, setLatestShape] = React.useState(null);
  const [selectedShape, setSelectedShape] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [selectedGender, setSelectedGender] = React.useState("");
  const [selectedStyle, setSelectedStyle] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    loadLatestShape();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    loadProducts();
  }, [user, selectedShape, selectedCategory, selectedGender, selectedStyle]);

  async function loadLatestShape() {
    try {
      const response = await apiFetch("/api/analyses");
      const data = await safeReadJson(response);

      if (!response.ok) return;

      const latest = data.records?.[0]?.summary;
      if (latest?.bodyShapeKey) {
        const normalizedShapeKey = normalizeBodyShapeFilterKey(latest.bodyShapeKey);
        setLatestShape({
          key: normalizedShapeKey,
          label: latest.bodyShape
        });
        setSelectedShape(normalizedShapeKey);
      }
    } catch {
      setLatestShape(null);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (selectedShape) params.set("bodyShape", selectedShape);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedGender) params.set("gender", selectedGender);
    if (selectedStyle) params.set("style", selectedStyle);

    try {
      const response = await apiFetch(`/api/products?${params.toString()}`);
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tải tủ đồ gợi ý.");

      setProducts(data.products || []);
      setCategories(data.categories || []);
      setStyles(data.styles || []);
      setBodyShapes(data.bodyShapes || []);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  function trackAffiliate(product) {
    apiFetch("/api/affiliate-clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        bodyShape: selectedShape
      })
    }).catch(() => {});

    window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  }

  if (!user) return <LockedPanel title="Tủ đồ gợi ý" />;

  return (
    <section className="wardrobe-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Tủ đồ gợi ý theo dáng người</h2>
          <p>
            Chọn sản phẩm phù hợp để thử phối bằng AI, hoặc mở link affiliate khi người dùng muốn mua thật.
          </p>
        </div>
        <Link className="secondary-link" to="/analyze">
          <Camera size={17} />
          Phân tích dáng
        </Link>
      </div>

      <section className="panel wardrobe-toolbar">
        <div className="wardrobe-current">
          <ShoppingBag size={22} />
          <div>
            <span>Dáng đang dùng để gợi ý</span>
            <strong>{latestShape?.label || "Chưa có lịch sử phân tích"}</strong>
          </div>
        </div>
        <div className="wardrobe-filters">
          <label>
            Dáng người
            <select value={selectedShape} onChange={(event) => setSelectedShape(event.target.value)}>
              <option value="">Tất cả dáng</option>
              {bodyShapes.map((shape) => (
                <option key={shape.key} value={shape.key}>
                  {shape.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nhóm sản phẩm
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="">Tất cả nhóm</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Phong cách
            <select value={selectedStyle} onChange={(event) => setSelectedStyle(event.target.value)}>
              <option value="">Tất cả phong cách</option>
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>
          <label>
            Giới tính
            <select value={selectedGender} onChange={(event) => setSelectedGender(event.target.value)}>
              <option value="">Unisex + tất cả</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="panel history-empty">Đang tải tủ đồ...</div>
      ) : products.length === 0 ? (
        <div className="panel history-empty">Chưa có sản phẩm phù hợp với bộ lọc hiện tại.</div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.imageUrl} alt={product.name} />
              <div className="product-content">
                <div>
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.reason}</p>
                </div>
                <div className="product-meta">
                  <strong>{product.price}</strong>
                  <span>{product.fit}</span>
                </div>
                <div className="tag-row">
                  {product.bodyShapeTags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="product-actions">
                  <Link
                    className="primary-link"
                    to={`/try-on?garmentImageUrl=${encodeURIComponent(product.imageUrl)}&productName=${encodeURIComponent(product.name)}`}
                  >
                    <Images size={17} />
                    Thử phối
                  </Link>
                  <button type="button" className="secondary-button" onClick={() => trackAffiliate(product)}>
                    <ExternalLink size={17} />
                    Mua ngay
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TryOnPage({ user, apiFetch, onUserUpdate }) {
  const [searchParams] = useSearchParams();
  const [form, setForm] = React.useState({
    personImageUrl: "",
    garmentImageUrl: searchParams.get("garmentImageUrl") || "",
    removeBackground: false
  });
  const [personFile, setPersonFile] = React.useState(null);
  const [garmentFile, setGarmentFile] = React.useState(null);
  const [personPreview, setPersonPreview] = React.useState("");
  const [garmentPreview, setGarmentPreview] = React.useState("");
  const [resultUrl, setResultUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isZoomed, setIsZoomed] = React.useState(false);
  const selectedProductName = searchParams.get("productName") || "";

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  function updateFile(event) {
    const file = event.target.files?.[0] || null;
    setError("");

    if (event.target.name === "personImage") {
      setPersonFile(file);
      setPersonPreview(file ? URL.createObjectURL(file) : "");
    } else {
      setGarmentFile(file);
      setGarmentPreview(file ? URL.createObjectURL(file) : "");
    }
  }

  const isTryOnSubmittingRef = React.useRef(false);
  const lastTryOnDataRef = React.useRef(null);

  async function submitTryOn(event) {
    event.preventDefault();
    if (isTryOnSubmittingRef.current) return;

    if (!user) {
      setError("Bạn cần đăng nhập để dùng tính năng phối đồ.");
      return;
    }

    if (lastTryOnDataRef.current) {
      const isFormEqual = Object.keys(form).every(key => String(form[key]) === String(lastTryOnDataRef.current.form[key]));
      const isPersonFileEqual = (personFile ? personFile.name : null) === lastTryOnDataRef.current.personFileName &&
                                (personFile ? personFile.size : null) === lastTryOnDataRef.current.personFileSize;
      const isGarmentFileEqual = (garmentFile ? garmentFile.name : null) === lastTryOnDataRef.current.garmentFileName &&
                                 (garmentFile ? garmentFile.size : null) === lastTryOnDataRef.current.garmentFileSize;
      if (isFormEqual && isPersonFileEqual && isGarmentFileEqual) {
        setError("Bạn đã phối đồ với các ảnh này rồi. Hãy thay đổi ảnh hoặc tùy chọn khác.");
        return;
      }
    }

    isTryOnSubmittingRef.current = true;
    setLoading(true);
    setError("");
    setResultUrl("");

    try {
      const payload = new FormData();
      payload.append("personImageUrl", form.personImageUrl);
      payload.append("garmentImageUrl", form.garmentImageUrl);
      payload.append("removeBackground", String(form.removeBackground));
      if (personFile) payload.append("personImage", personFile);
      if (garmentFile) payload.append("garmentImage", garmentFile);

      const response = await apiFetch("/api/try-on", {
        method: "POST",
        body: payload
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tạo ảnh phối đồ.");
      setResultUrl(data.result_url);
      if (data.plan) onUserUpdate({ ...user, ...data.plan });

      lastTryOnDataRef.current = {
        form: { ...form },
        personFileName: personFile ? personFile.name : null,
        personFileSize: personFile ? personFile.size : null,
        garmentFileName: garmentFile ? garmentFile.name : null,
        garmentFileSize: garmentFile ? garmentFile.size : null,
      };
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      isTryOnSubmittingRef.current = false;
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Phối đồ AI" />;

  return (
    <section className="tryon-page">
      <form className="panel tryon-panel" onSubmit={submitTryOn}>
        <div>
          <div className="panel-title">
            <Images size={20} />
            <h2>Phối đồ với AI Try-On</h2>
          </div>
          <p>
            Upload ảnh bản thân dáng đứng thẳng, rõ nét và ảnh quần áo nền đơn giản để tạo ảnh phối đồ.
          </p>
          <div className="plan-inline-note">
            {user.premium ? "Bạn đang dùng Premium: phối đồ không giới hạn và có lịch ăn 30 ngày." : `Gói Free còn ${user.remainingFreeTryOn ?? 0}/1 lượt phối đồ miễn phí.`}
            {!user.premium && <Link to="/premium"> Nâng cấp Premium</Link>}
          </div>
          {selectedProductName && <p className="selected-product-note">Đang thử phối: {selectedProductName}</p>}
        </div>

        <div className="tryon-upload-grid">
          <label className="upload-box tryon-upload">
            <Camera size={20} />
            <span>{personFile ? personFile.name : "Upload ảnh người"}</span>
            <input name="personImage" type="file" accept="image/png,image/jpeg,image/webp" onChange={updateFile} />
          </label>
          <label className="upload-box tryon-upload">
            <Shirt size={20} />
            <span>{garmentFile ? garmentFile.name : "Upload ảnh quần áo"}</span>
            <input name="garmentImage" type="file" accept="image/png,image/jpeg,image/webp" onChange={updateFile} />
          </label>
        </div>

        {(personPreview || garmentPreview) && (
          <div className="tryon-preview-grid">
            {personPreview && <img src={personPreview} alt="Ảnh người đã chọn" />}
            {garmentPreview && <img src={garmentPreview} alt="Ảnh quần áo đã chọn" />}
          </div>
        )}

        <div className="tryon-divider">Hoặc dán URL công khai để test nhanh</div>

        <label>
          URL ảnh người
          <input
            name="personImageUrl"
            value={form.personImageUrl}
            onChange={updateField}
            placeholder="https://example.com/person.jpg"
          />
        </label>

        <label>
          URL ảnh quần áo
          <input
            name="garmentImageUrl"
            value={form.garmentImageUrl}
            onChange={updateField}
            placeholder="https://example.com/garment.jpg"
          />
        </label>

        <label className="check-row">
          <input
            name="removeBackground"
            type="checkbox"
            checked={form.removeBackground}
            onChange={updateField}
          />
          Xóa nền ảnh kết quả
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Đang phối đồ..." : "Tạo ảnh phối đồ"}
        </button>
      </form>

      <section className="panel tryon-result">
        {loading ? (
          <LoadingPanel
            title="AI đang tạo ảnh phối đồ"
            description="Hệ thống đang xử lý ảnh người, ảnh trang phục và tạo kết quả phối đồ."
            inline
          />
        ) : resultUrl ? (
          <>
            <div className="tryon-img-container" onClick={() => setIsZoomed(true)}>
              <img src={resultUrl} alt="Kết quả phối đồ từ AI" />
              <span className="zoom-hint">
                <ZoomIn size={16} /> Nhấp để xem ảnh to
              </span>
            </div>
            <a className="secondary-link" href={resultUrl} download target="_blank" rel="noreferrer">
              Mở ảnh trong tab mới
            </a>
          </>
        ) : (
          <div className="empty-state inline-empty">
            <Images size={42} />
            <h2>Kết quả phối đồ sẽ hiển thị ở đây</h2>
            <p>Tính năng thử đồ hoạt động tốt nhất với ảnh người đứng thẳng, chính diện và ảnh quần áo nền đơn giản.</p>
          </div>
        )}
      </section>

      {isZoomed && (
        <div className="tryon-lightbox" onClick={() => setIsZoomed(false)}>
          <div className="tryon-lightbox-content">
            <img src={resultUrl} alt="Kết quả phối đồ phóng to" />
            <button className="tryon-lightbox-close" onClick={() => setIsZoomed(false)}>
              <X size={28} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function HomePage({ user }) {
  return (
    <section className="home-page">
      <section className="home-hero-v2">
        <div className="home-hero-copy">
          <p className="eyebrow">Health + Fashion Intelligence</p>
          <h1>Hiểu cơ thể hơn. Mặc đẹp hơn. <br></br>Sống khỏe hơn.</h1>
          <p>
            FitStyle AI phân tích chỉ số cơ thể và ảnh toàn thân để gợi ý mục tiêu sức khỏe,
            đánh giá outfit và đề xuất tủ đồ phù hợp với vóc dáng của từng người.
          </p>
          <div className="home-actions">
            <Link className="primary-link" to={user ? "/analyze" : "/register"}>
              <Sparkles size={18} />
              {user ? "Phân tích ngay" : "Bắt đầu miễn phí"}
            </Link>
            <Link className="secondary-link" to={user ? "/wardrobe" : "/login"}>
              {user ? <ShoppingBag size={18} /> : <LogIn size={18} />}
              {user ? "Xem tủ đồ" : "Đăng nhập"}
            </Link>
          </div>
          {user && !user.premium && (
            <div className="home-premium-note">
              <Sparkles size={18} />
              <span>Gói Free được phân tích thoải mái và có 1 lượt phối đồ. Premium mở phối đồ không giới hạn cùng lịch ăn 30 ngày.</span>
              <Link to="/premium">Xem gói 79k</Link>
            </div>
          )}
          <div className="home-icon-strip">
            <span><Camera size={16} /> Body scan</span>
            <span><Activity size={16} /> Health score</span>
            <span><Shirt size={16} /> Outfit rating</span>
            <span><Images size={16} /> Virtual try-on</span>
          </div>
          <div className="home-trust-row">
            <span><Activity size={15} /> BMI/TDEE</span>
            <span><Ruler size={15} /> Số đo cơ thể</span>
            <span><Shirt size={15} /> Outfit score</span>
            <span><ShoppingBag size={15} /> Smart wardrobe</span>
          </div>
        </div>

        <div className="home-visual">
          <img
            src="/hero-image.png"
            alt="Người mẫu thời trang trong trang phục hiện đại"
          />
          <div className="visual-card visual-card-top">
            <Shirt size={18} />
            <strong>Dáng người</strong>
            <span>Phân tích từ ảnh</span>
          </div>
          <div className="visual-card visual-card-bottom">
            <Activity size={18} />
            <strong>2,150 kcal</strong>
            <span>Calo mục tiêu mỗi ngày</span>
          </div>
          <div className="visual-card visual-card-mid">
            <Sparkles size={18} />
            <strong>Try-on</strong>
            <span>Thử phối trước khi mua</span>
          </div>
          <div className="visual-card visual-card-score">
            <Target size={18} />
            <strong>8.4/10</strong>
            <span>Độ hợp outfit</span>
          </div>
        </div>
      </section>

      <section className="home-proof-grid" aria-label="Điểm nổi bật của FitStyle AI">
        <article>
          <span><Camera size={20} /></span>
          <strong>AI đọc dáng từ ảnh</strong>
          <p>Nhận diện vai, eo, hông và tổng thể outfit từ ảnh toàn thân.</p>
        </article>
        <article>
          <span><Activity size={20} /></span>
          <strong>Gợi ý sức khỏe</strong>
          <p>Tính BMI, TDEE, calo mục tiêu và hướng tăng, giảm hoặc duy trì cân nặng.</p>
        </article>
        <article>
          <span><Shirt size={20} /></span>
          <strong>Styling theo dáng</strong>
          <p>Đề xuất form áo, quần, layer, màu sắc và điểm cần tránh.</p>
        </article>
        <article>
          <span><ShoppingBag size={20} /></span>
          <strong>Tủ đồ affiliate</strong>
          <p>Lọc sản phẩm phù hợp và mở link mua hàng nhanh khi người dùng thích.</p>
        </article>
      </section>

      <section className="home-metrics-strip">
        <div>
          <strong>4</strong>
          <span>nhóm dữ liệu: ảnh, chỉ số, số đo, mục tiêu</span>
        </div>
        <div>
          <strong>3</strong>
          <span>đầu ra: sức khỏe, dáng người, tủ đồ</span>
        </div>
        <div>
          <strong>1</strong>
          <span>luồng mua sắm </span>
        </div>
      </section>

      <section className="home-section home-process">
        <div className="section-heading">
          <h2>Cách FitStyle AI hoạt động</h2>
          <span>3 bước</span>
        </div>
        <div className="feature-grid">
          <article>
            <Camera size={22} />
            <h3>Upload ảnh và chỉ số</h3>
            <p>Người dùng nhập tuổi, chiều cao, cân nặng, số đo cơ thể và ảnh toàn thân rõ nét.</p>
          </article>
          <article>
            <Activity size={22} />
            <h3>Phân tích sức khỏe</h3>
            <p>Hệ thống tính BMI, TDEE, calo mục tiêu và đưa ra hướng tăng, giảm hoặc duy trì cân nặng.</p>
          </article>
          <article>
            <Shirt size={22} />
            <h3>Gợi ý phong cách</h3>
            <p>AI nhận diện dáng người, chấm điểm outfit và đề xuất sản phẩm trong tủ đồ phù hợp.</p>
          </article>
          <article>
            <ShoppingBag size={22} />
            <h3>Tủ đồ affiliate</h3>
            <p>Sản phẩm được gắn tag theo dáng người, phong cách và liên kết mua hàng.</p>
          </article>
        </div>
      </section>

      <section className="home-section home-split">
        <div>
          <p className="eyebrow">For users</p>
          <h2>Một trợ lý cá nhân cho cả sức khỏe lẫn phong cách.</h2>
          <p>
            Người dùng không cần tự đoán mình thuộc dáng nào. FitStyle AI biến dữ liệu cơ thể
            thành gợi ý dễ hiểu: nên cải thiện gì, mặc gì, tránh gì và thử phối đồ trước khi mua.
          </p>
        </div>
        <div className="home-benefit-list">
          <span>Gợi ý khách quan hơn nhờ số đo + ảnh</span>
          <span>Tủ đồ lọc theo dáng người, phong cách, giới tính</span>
          <span>Thử phối đồ với ảnh cá nhân trước khi mua</span>
        </div>
      </section>

    </section>
  );
}

function PremiumPage({ user, apiFetch, onUserUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkout, setCheckout] = React.useState(null);
  const [mealPlan, setMealPlan] = React.useState(null);
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [activeWeek, setActiveWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const formRef = React.useRef(null);

  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponError, setCouponError] = React.useState("");

  React.useEffect(() => {
    const invoice = searchParams.get("invoice");
    const payment = searchParams.get("payment");
    if (payment === "success" && invoice && user) confirmPayment(invoice);
  }, [searchParams, user]);

  async function refreshPlan() {
    const response = await apiFetch("/api/billing/plan");
    const data = await safeReadJson(response);
    if (response.ok && data.user) onUserUpdate(data.user);
  }

  async function startCheckout() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: appliedCoupon?.code || "" })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tạo thanh toán Premium.");

      if (data.freeUpgrade) {
        setMessage("Kích hoạt Premium thành công miễn phí bằng mã giảm giá!");
        onUserUpdate({ ...user, ...data.plan });
        setCheckout(null);
        setAppliedCoupon(null);
        setCouponCode("");
        return;
      }

      if (data.alreadyPremium) {
        setMessage("Tài khoản của bạn đang là Premium.");
        onUserUpdate({ ...user, ...data.plan });
        return;
      }

      setCheckout(data);
      setMessage("Đang chuyển sang cổng thanh toán SePay...");
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function applyCouponCode() {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const response = await apiFetch("/api/billing/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Mã giảm giá không hợp lệ.");
      setAppliedCoupon(data.coupon);
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  }

  async function confirmPayment(invoiceNumber) {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể xác nhận thanh toán.");
      onUserUpdate(data.user);
      setMessage("Thanh toán thành công. Premium đã được kích hoạt 30 ngày.");
      setSearchParams({});
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadMealPlan() {
    setLoading(true);
    setError("");

    try {
      await refreshPlan();
      const response = await apiFetch("/api/meal-plan");
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tải lịch ăn 30 ngày.");
      setMealPlan(data.mealPlan);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="FitStyle Premium" />;

  const premiumUntil = user.premiumUntil ? formatDate(user.premiumUntil) : "Chưa kích hoạt";

  return (
    <section className="premium-page">
      <section className="panel premium-hero-panel">
        <div>
          <p className="eyebrow">FitStyle Premium</p>
          <h2>Nâng cấp trải nghiệm sức khỏe và phối đồ.</h2>
          <p>
            Gói Premium 79.000đ/tháng mở khóa phối đồ không giới hạn và lịch ăn uống 30 ngày theo lượng calo mục tiêu từ kết quả phân tích của bạn.
          </p>

          {!user.premium && (
            <div className="coupon-application-container" style={{ margin: "var(--space-md) 0", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", maxWidth: "480px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Mã giảm giá (nếu có)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="MÃ GIẢM GIÁ"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={loading || appliedCoupon}
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
                {appliedCoupon ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                    style={{ padding: "8px 16px" }}
                  >
                    Hủy
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={applyCouponCode}
                    disabled={loading || !couponCode.trim()}
                    style={{ padding: "8px 16px" }}
                  >
                    Áp dụng
                  </button>
                )}
              </div>
              {couponError && <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "6px", margin: "6px 0 0 0" }}>{couponError}</p>}
              {appliedCoupon && (
                <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--success)" }}>
                  <span>Áp dụng mã <strong>{appliedCoupon.code}</strong> thành công! Giảm <strong>{appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : `${appliedCoupon.value.toLocaleString("vi-VN")}đ`}</strong>.</span>
                  <div style={{ marginTop: "4px", color: "var(--text-primary)" }}>
                    Giá gốc: <del>79.000đ</del> | Giá sau giảm: <strong>{appliedCoupon.finalAmount.toLocaleString("vi-VN")}đ</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="premium-actions">
            <button className="primary-button" type="button" onClick={startCheckout} disabled={loading || user.premium}>
              {user.premium ? "Đang dùng Premium" : loading ? "Đang xử lý..." : appliedCoupon ? `Nâng cấp ${appliedCoupon.finalAmount.toLocaleString("vi-VN")}đ/tháng` : "Nâng cấp 79.000đ/tháng"}
            </button>
            <button className="secondary-button" type="button" onClick={loadMealPlan} disabled={loading}>
              Xem lịch ăn 30 ngày
            </button>
          </div>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
        <div className="premium-price-card">
          <span>Premium</span>
          <strong>{appliedCoupon ? `${appliedCoupon.finalAmount.toLocaleString("vi-VN")}đ` : "79.000đ"}</strong>
          <small>/ tháng</small>
          <p>Hết hạn: {premiumUntil}</p>
        </div>
      </section>

      <div className="premium-feature-grid">
        <article className="panel">
          <Images size={24} />
          <h3>Phối đồ không giới hạn</h3>
          <p>Free được 1 lượt thử. Premium mở khóa thử phối outfit thoải mái.</p>
        </article>
        <article className="panel">
          <Dumbbell size={24} />
          <h3>Lịch ăn 30 ngày</h3>
          <p>Dựa trên target calories gần nhất sau khi phân tích chỉ số cơ thể.</p>
        </article>
        <article className="panel">
          <Target size={24} />
          <h3>Theo mục tiêu calo</h3>
          <p>Tăng, giảm hoặc duy trì cân nặng với khẩu phần rõ theo từng ngày.</p>
        </article>
      </div>

      {checkout?.checkoutUrl && (
        <div className="payment-redirect-overlay">
          <div className="payment-redirect-modal panel">
            <h3>Hóa đơn Premium sẵn sàng</h3>
            <p className="redirect-invoice">Mã hóa đơn: <strong>{checkout.order.invoiceNumber}</strong></p>
            <div className="redirect-details">
              <div>
                <span>Sản phẩm:</span>
                <strong>Đăng ký FitStyle Premium (30 ngày)</strong>
              </div>
              <div>
                <span>Số tiền cần thanh toán:</span>
                <strong className="redirect-price">{(checkout.order.amount || 79000).toLocaleString("vi-VN")}đ</strong>
              </div>
            </div>
            <form action={checkout.checkoutUrl} method="POST" className="redirect-form">
              {Object.entries(checkout.checkoutFields || {}).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} readOnly />
              ))}
              <button type="submit" className="primary-button redirect-btn">
                Tiến hành thanh toán qua SePay
              </button>
            </form>
            <button type="button" className="secondary-button redirect-cancel-btn" onClick={() => setCheckout(null)}>
              Hủy bỏ thanh toán
            </button>
          </div>
        </div>
      )}

      {mealPlan && (
        <section className="panel meal-plan-panel">
          <div className="section-heading">
            <div>
              <h2>Lịch ăn uống 30 ngày Premium</h2>
              <p>Mục tiêu khoảng {mealPlan.targetCalories} kcal/ngày — {mealPlan.direction}</p>
            </div>
            <span className="meal-plan-source">
              {mealPlan.generatedFromLatestAnalysis ? "⚡ Phân tích cá nhân hóa" : "📋 Thực đơn mẫu"}
            </span>
          </div>

          {/* Week Tabs */}
          <div className="week-tabs">
            {[1, 2, 3, 4, 5].map((w) => {
              const startDay = (w - 1) * 7 + 1;
              const endDay = Math.min(w * 7, 30);
              return (
                <button
                  key={w}
                  type="button"
                  className={`week-tab-btn ${activeWeek === w ? "active" : ""}`}
                  onClick={() => {
                    setActiveWeek(w);
                    setSelectedDay(startDay);
                  }}
                >
                  Tuần {w} <span className="week-range">(Ngày {startDay}-{endDay})</span>
                </button>
              );
            })}
          </div>

          {/* Day Circles Row */}
          <div className="day-circles-row">
            {mealPlan.days
              .filter((d) => d.day >= (activeWeek - 1) * 7 + 1 && d.day <= Math.min(activeWeek * 7, 30))
              .map((day) => (
                <button
                  key={day.day}
                  type="button"
                  className={`day-circle-btn ${selectedDay === day.day ? "active" : ""}`}
                  onClick={() => setSelectedDay(day.day)}
                >
                  <span className="day-num">D{day.day}</span>
                  <span className="day-cal">{day.calories} kcal</span>
                </button>
              ))}
          </div>

          {/* Active Day Detail Card */}
          {(() => {
            const activeDayObj = mealPlan.days.find((d) => d.day === selectedDay) || mealPlan.days[0];
            
            function renderMealItem(mealText, icon, title) {
              if (!mealText) return null;
              const parts = mealText.split(":");
              const header = parts[0] || "";
              const desc = parts.slice(1).join(":") || "";
              const calBadge = header.replace(title + " khoảng ", "").trim();
              return (
                <div className="meal-card-item">
                  <div className="meal-card-header-row">
                    <span className="meal-icon-title">
                      <span>{icon}</span>
                      <strong>{title}</strong>
                    </span>
                    <span className="meal-calorie-badge">{calBadge}</span>
                  </div>
                  <div className="meal-card-content">
                    <p>{desc.trim()}</p>
                  </div>
                </div>
              );
            }

            return (
              <div className="active-day-detail-panel" key={selectedDay}>
                <div className="active-day-header">
                  <div className="active-day-meta">
                    <h3>Ngày {activeDayObj.day}</h3>
                    <p className="active-day-focus">🎯 Tiêu điểm: {activeDayObj.focus}</p>
                  </div>
                  <div className="active-day-total-calories">
                    <span className="cal-value">{activeDayObj.calories}</span>
                    <span className="cal-unit">kcal / ngày</span>
                  </div>
                </div>

                <div className="active-day-meals-grid">
                  {renderMealItem(activeDayObj.breakfast, "🌅", "Bữa sáng")}
                  {renderMealItem(activeDayObj.lunch, "☀️", "Bữa trưa")}
                  {renderMealItem(activeDayObj.dinner, "🌆", "Bữa tối")}
                  {renderMealItem(activeDayObj.snack, "🍎", "Bữa phụ")}
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </section>
  );
}

function LockedPanel({ title }) {
  return (
    <section className="panel empty-state">
      <UserRound size={42} />
      <h2>{title}</h2>
      <p>Bạn cần đăng nhập để sử dụng trang này.</p>
    </section>
  );
}

function AuthPage({ mode, user, onSession }) {
  const navigate = useNavigate();
  const [form, setForm] = React.useState(initialAuthForm);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const isRegister = mode === "register";

  React.useEffect(() => {
    setError("");
    setForm(initialAuthForm);
  }, [mode]);

  if (user) return <Navigate to="/" replace />;

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister && form.password !== form.confirmPassword) {
        throw new Error("Mật khẩu nhập lại chưa khớp.");
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password
      };

      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể xác thực tài khoản.");

      onSession(data.token, data.user, isRegister ? true : form.rememberMe);
      navigate("/");
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-route">
      <AuthPanel
        mode={mode}
        form={form}
        loading={loading}
        error={error}
        onChange={updateField}
        onSubmit={submitAuth}
      />
    </section>
  );
}

function AuthPanel({ mode, form, loading, error, onChange, onSubmit }) {
  const isRegister = mode === "register";

  return (
    <section className="panel auth-panel">
      <div>
        <div className="panel-title">
          <UserRound size={20} />
          <h2>{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h2>
        </div>
        <p>Đăng nhập để trải nghiệm các tính năng của FitStyle.</p>
        {error && <p className="error">{error}</p>}
      </div>
      <form className="auth-form" onSubmit={onSubmit}>
        {isRegister && (
          <label>
            Tên
            <input name="name" value={form.name} onChange={onChange} placeholder="Nguyễn Văn A" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
        </label>
        <label>
          Mật khẩu
          <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Tối thiểu 6 ký tự" />
        </label>
        {isRegister && (
          <label>
            Nhập lại mật khẩu
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Nhập lại mật khẩu" />
          </label>
        )}
        {!isRegister && (
          <label className="remember-row">
            <input name="rememberMe" type="checkbox" checked={form.rememberMe} onChange={onChange} />
            Lưu đăng nhập
          </label>
        )}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
        </button>
        <Link className="text-button" to={isRegister ? "/login" : "/register"}>
          {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </Link>
      </form>
    </section>
  );
}

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toFriendlyNetworkError(error) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return `Không kết nối được backend tại ${API_URL}. Hãy kiểm tra server backend đang chạy và refresh lại trang.`;
  }

  return error.message || "Có lỗi không xác định.";
}

function UserBadge({ user, onLogout }) {
  return (
    <div className={`user-badge ${user.premium ? "is-premium" : ""}`}>
      <Link to="/profile" className="user-badge-link" title="Chỉnh sửa hồ sơ">
        {user.premium ? <Sparkles size={20} /> : <UserRound size={20} />}
        <div>
          <strong>{user.name}</strong>
          <span>{user.premium ? "PREMIUM" : user.role}</span>
        </div>
      </Link>
      {!user.premium && (
        <Link className="user-premium-link" to="/premium">
          Nâng cấp
        </Link>
      )}
      <button type="button" onClick={onLogout} title="Đăng xuất">
        <LogOut size={17} />
      </button>
    </div>
  );
}

function ProfilePage({ user, apiFetch, onUserUpdate }) {
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = React.useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = React.useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [profileMsg, setProfileMsg] = React.useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = React.useState({ text: "", type: "" });
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [loadingPassword, setLoadingPassword] = React.useState(false);
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (loadingProfile) return;
    setProfileMsg({ text: "", type: "" });
    setLoadingProfile(true);
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi cập nhật.");
      if (data.user) onUserUpdate(data.user);
      setProfileMsg({ text: data.message || "Cập nhật thành công!", type: "success" });
    } catch (err) {
      setProfileMsg({ text: err.message, type: "error" });
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (loadingPassword) return;
    setPasswordMsg({ text: "", type: "" });
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordMsg({ text: "Mật khẩu mới và xác nhận không khớp.", type: "error" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ text: "Mật khẩu mới phải có ít nhất 6 ký tự.", type: "error" });
      return;
    }
    setLoadingPassword(true);
    try {
      const res = await apiFetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi đổi mật khẩu.");
      setPasswordMsg({ text: data.message || "Đổi mật khẩu thành công!", type: "success" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setPasswordMsg({ text: err.message, type: "error" });
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-page-header">
        <div className="profile-avatar">
          {user.premium ? <Sparkles size={40} /> : <UserRound size={40} />}
        </div>
        <div className="profile-header-info">
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <span className={`profile-badge ${user.premium ? "is-premium" : ""}`}>
            {user.premium ? "✨ PREMIUM" : user.role === "admin" ? "👑 ADMIN" : "Tài khoản miễn phí"}
          </span>
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-card">
          <div className="profile-card-header">
            <UserRound size={22} />
            <h2>Thông tin cá nhân</h2>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <label className="profile-field">
              <span className="profile-field-label"><UserRound size={16} /> Tên hiển thị</span>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên của bạn"
                required
              />
            </label>
            <label className="profile-field">
              <span className="profile-field-label"><Mail size={16} /> Email</span>
              <input
                type="email"
                value={profileForm.email}
                disabled
                placeholder="Nhập email"
                required
              />
            </label>
            {profileMsg.text && (
              <div className={`profile-msg ${profileMsg.type}`}>{profileMsg.text}</div>
            )}
            <button type="submit" className="profile-submit-btn" disabled={loadingProfile}>
              <Save size={18} />
              {loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <Lock size={22} />
            <h2>Đổi mật khẩu</h2>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <label className="profile-field">
              <span className="profile-field-label"><Lock size={16} /> Mật khẩu hiện tại</span>
              <div className="profile-password-wrap">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button type="button" className="pw-toggle" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                  {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="profile-field">
              <span className="profile-field-label"><Lock size={16} /> Mật khẩu mới</span>
              <div className="profile-password-wrap">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="profile-field">
              <span className="profile-field-label"><Lock size={16} /> Xác nhận mật khẩu mới</span>
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                required
                minLength={6}
              />
            </label>
            {passwordMsg.text && (
              <div className={`profile-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
            )}
            <button type="submit" className="profile-submit-btn" disabled={loadingPassword}>
              <Lock size={18} />
              {loadingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function AnalyzePage({ user, apiFetch }) {
  const [form, setForm] = React.useState(initialForm);
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function updatePhoto(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setError("");
  }

  const isSubmittingRef = React.useRef(false);
  const lastSubmittedDataRef = React.useRef(null);

  async function submitAnalysis(event) {
    event.preventDefault();
    if (isSubmittingRef.current) return;

    if (!user) {
      setError("Bạn cần đăng nhập để sử dụng tính năng phân tích.");
      return;
    }

    if (lastSubmittedDataRef.current) {
      const isFormEqual = Object.keys(form).every(key => String(form[key]) === String(lastSubmittedDataRef.current.form[key]));
      const isFileEqual = (file ? file.name : null) === lastSubmittedDataRef.current.fileName &&
                          (file ? file.size : null) === lastSubmittedDataRef.current.fileSize;
      if (isFormEqual && isFileEqual) {
        setError("Bạn đã phân tích với các chỉ số này rồi. Hãy thay đổi chỉ số nếu muốn phân tích lại.");
        return;
      }
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, String(value));
      });
      if (file) payload.append("bodyPhoto", file);

      const response = await apiFetch("/api/analyze", {
        method: "POST",
        body: payload
      });
      const data = await safeReadJson(response);

      if (!response.ok) {
        const detail = data.errors?.join(" ") || data.message || "Không thể phân tích.";
        throw new Error(detail);
      }

      setResult(data);

      lastSubmittedDataRef.current = {
        form: { ...form },
        fileName: file ? file.name : null,
        fileSize: file ? file.size : null,
      };
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Phân tích cơ thể" />;

  return (
    <section className="analyze-page">
      <form className="panel analyze-panel" onSubmit={submitAnalysis}>
        <div>
          <div className="panel-title">
            <Camera size={20} />
            <h2>Phân tích dáng người và sức khỏe</h2>
          </div>
          <p>Nhập chỉ số cơ thể và upload ảnh toàn thân để AI phân tích dáng người, chấm điểm outfit và gợi ý phong cách.</p>
        </div>

        <div className="field-grid">
          <label>
            Tuổi
            <input name="age" type="number" value={form.age} onChange={updateField} min="16" max="80" />
          </label>
          <label>
            Giới tính
            <select name="gender" value={form.gender} onChange={updateField}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <label>
            Chiều cao (cm)
            <input name="heightCm" type="number" value={form.heightCm} onChange={updateField} min="120" max="230" />
          </label>
          <label>
            Cân nặng (kg)
            <input name="weightKg" type="number" value={form.weightKg} onChange={updateField} min="30" max="250" />
          </label>
        </div>

        <div className="field-grid">
          <label>
            Vòng cổ (cm)
            <input name="neckCm" type="number" value={form.neckCm} onChange={updateField} placeholder="Tùy chọn" />
          </label>
          <label>
            Vòng ngực (cm)
            <input name="chestCm" type="number" value={form.chestCm} onChange={updateField} placeholder="Tùy chọn" />
          </label>
          <label>
            Vòng eo (cm)
            <input name="waistCm" type="number" value={form.waistCm} onChange={updateField} placeholder="Tùy chọn" />
          </label>
          <label>
            Vòng hông (cm)
            <input name="hipCm" type="number" value={form.hipCm} onChange={updateField} placeholder="Tùy chọn" />
          </label>
        </div>

        <div className="field-grid">
          <label>
            Mức vận động
            <select name="activityLevel" value={form.activityLevel} onChange={updateField}>
              <option value="sedentary">Ít vận động</option>
              <option value="light">Nhẹ nhàng (1-3 buổi/tuần)</option>
              <option value="moderate">Trung bình (3-5 buổi/tuần)</option>
              <option value="active">Tích cực (5-7 buổi/tuần)</option>
            </select>
          </label>
          <label>
            Mục tiêu
            <select name="goal" value={form.goal} onChange={updateField}>
              <option value="lose">Giảm cân/giảm mỡ</option>
              <option value="maintain">Duy trì săn chắc hơn</option>
              <option value="gain">Tăng cân/tăng cơ</option>
            </select>
          </label>
        </div>

        <label className="upload-box">
          <Camera size={20} />
          <span>{file ? file.name : "Upload ảnh toàn thân (tùy chọn)"}</span>
          <input name="bodyPhoto" type="file" accept="image/png,image/jpeg,image/webp" onChange={updatePhoto} />
        </label>

        {preview && (
          <div className="tryon-preview-grid">
            <img src={preview} alt="Ảnh toàn thân đã chọn" />
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Đang phân tích..." : "Phân tích ngay"}
        </button>
      </form>

      {loading ? (
        <LoadingPanel
          title="AI đang phân tích"
          description="Hệ thống đang xử lý chỉ số cơ thể và ảnh toàn thân để tạo kết quả phân tích."
        />
      ) : (
        <Results result={result} />
      )}
    </section>
  );
}

function HistoryPage({ user, apiFetch }) {
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/analyses");
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không thể tải lịch sử phân tích.");
      setRecords(data.records || []);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Lịch sử phân tích" />;

  return (
    <section className="history-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Lịch sử phân tích</h2>
          <p>Xem lại các lần phân tích chỉ số cơ thể và dáng người trước đây.</p>
        </div>
        <Link className="primary-link" to="/analyze">
          <Camera size={17} />
          Phân tích mới
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="panel history-empty">Đang tải lịch sử...</div>
      ) : records.length === 0 ? (
        <div className="panel history-empty">
          <div className="empty-state">
            <History size={42} />
            <h2>Chưa có lịch sử phân tích</h2>
            <p>Bắt đầu phân tích dáng người và sức khỏe để xem kết quả ở đây.</p>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {records.map((record) => (
            <Link className="panel history-card" to={`/history/${record.id}`} key={record.id}>
              <div className="history-card-head">
                <strong>{record.summary?.bodyShape || "Chưa rõ dáng"}</strong>
                <span>{formatDate(record.createdAt)}</span>
              </div>
              <div className="history-card-stats">
                <span>
                  <Activity size={15} />
                  BMI {record.summary?.bmi || "?"}
                </span>
                <span>
                  <Shirt size={15} />
                  Outfit {record.summary?.outfitScore ?? "?"}/10
                </span>
                {record.summary?.bodyFat && (
                  <span>
                    <Percent size={15} />
                    Fat {record.summary.bodyFat}%
                  </span>
                )}
                <span>
                  <Target size={15} />
                  {record.summary?.direction || "Duy trì"}
                </span>
              </div>
              <div className="history-card-meta">
                <span>{record.profile?.gender === "female" ? "Nữ" : "Nam"}</span>
                <span>{record.profile?.heightCm}cm</span>
                <span>{record.profile?.weightKg}kg</span>
                <span>{record.photo?.received ? "Có ảnh" : "Không ảnh"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryDetailPage({ user, apiFetch }) {
  const { id } = useParams();
  const [record, setRecord] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user && id) loadDetail();
  }, [user, id]);

  async function loadDetail() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`/api/analyses/${id}`);
      const data = await safeReadJson(response);

      if (!response.ok) throw new Error(data.message || "Không tìm thấy lịch sử phân tích.");
      setRecord(data.record);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Chi tiết phân tích" />;

  return (
    <section className="history-detail-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Chi tiết phân tích</h2>
          <p>Kết quả đầy đủ của một lần phân tích dáng người và sức khỏe.</p>
        </div>
        <Link className="secondary-link" to="/history">
          <History size={17} />
          Quay lại lịch sử
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <LoadingPanel
          title="Đang tải kết quả"
          description="Hệ thống đang lấy dữ liệu phân tích từ lịch sử."
        />
      ) : record ? (
        <>
          <div className="panel history-detail-meta">
            <div>
              <span>Ngày phân tích</span>
              <strong>{formatDate(record.createdAt)}</strong>
            </div>
            <div>
              <span>Giới tính</span>
              <strong>{record.profile?.gender === "female" ? "Nữ" : "Nam"}</strong>
            </div>
            <div>
              <span>Chiều cao</span>
              <strong>{record.profile?.heightCm} cm</strong>
            </div>
            <div>
              <span>Cân nặng</span>
              <strong>{record.profile?.weightKg} kg</strong>
            </div>
            <div>
              <span>Tuổi</span>
              <strong>{record.profile?.age}</strong>
            </div>
            <div>
              <span>Ảnh</span>
              <strong>{record.photo?.received ? "Có ảnh" : "Không ảnh"}</strong>
            </div>
          </div>
          <Results result={record.result} />
        </>
      ) : (
        <div className="panel empty-state">
          <Sparkles size={42} />
          <h2>Không tìm thấy kết quả</h2>
          <p>Bản ghi phân tích không tồn tại hoặc bạn không có quyền xem.</p>
        </div>
      )}
    </section>
  );
}

function LoadingPanel({ title, description, inline = false }) {
  return (
    <section className={`panel loading-panel ${inline ? "inline-loading" : ""}`}>
      <Sparkles size={40} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="loading-bar" aria-label="Đang xử lý">
        <span />
      </div>
      <small>Quá trình này có thể mất vài giây trong lúc hệ thống xử lý ảnh.</small>
    </section>
  );
}

function Results({ result }) {
  if (!result) {
    return (
      <section className="panel empty-state">
        <Sparkles size={42} />
        <h2>Kết quả sẽ hiển thị ở đây</h2>
        <p>Nhập chỉ số, upload ảnh toàn thân và xem AI phân tích dáng người cùng gợi ý sức khỏe, outfit.</p>
      </section>
    );
  }

  const bodyFat = result.metrics.bodyFat;
  const outfitScore = result.vision?.outfitFit?.score;

  return (
    <section className="results">
      <div className="metric-grid">
        <Metric icon={<Activity />} label="BMI" value={result.metrics.bmi} note={result.metrics.bmiCategory.label} />
        <Metric icon={<Percent />} label="Body fat" value={bodyFat ? `${bodyFat.percent}%` : "Chưa đủ số đo"} note={bodyFat ? `${bodyFat.fatMassKg}kg mỡ, ${bodyFat.leanMassKg}kg nạc` : "Cần cổ/eo/hông"} />
        <Metric icon={<Target />} label="Calo mục tiêu" value={result.metrics.targetCalories} note="kcal/ngày" />
        <Metric icon={<Shirt />} label="Dáng AI" value={result.metrics.bodyShape.label} note={`Tin cậy ${Math.round(result.metrics.bodyShape.confidence * 100)}%`} />
      </div>

      <article className="panel result-card">
        <div className="panel-title">
          <Camera size={20} />
          <h2>AI phân tích ảnh</h2>
        </div>
        <div className="ai-result-head">
          <div>
            <span>Dáng người</span>
            <strong>{result.metrics.bodyShape.label}</strong>
            {result.metrics.bodyShape.description && <p>{result.metrics.bodyShape.description}</p>}
          </div>
          <span className="source-pill">{sourceLabel(result.metrics.bodyShape.source)}</span>
        </div>
        <div className="outfit-fit">
          <div className="outfit-fit-title">
            <strong>{outfitLevelLabel(result.vision?.outfitFit?.level)}</strong>
            <span>{outfitScore === null || outfitScore === undefined ? "Chưa chấm điểm" : `${outfitScore}/10`}</span>
          </div>
          <p>{result.vision?.outfitFit?.summary || result.vision?.outfitFeedback}</p>
        </div>
        <p className="summary">{result.vision?.photoQuality}</p>
        <List items={result.vision?.observations || []} />
        <p className="summary">{result.vision?.outfitFeedback}</p>
      </article>

      <article className="panel result-card">
        <div className="panel-title">
          <Dumbbell size={20} />
          <h2>Gợi ý sức khỏe</h2>
        </div>
        <p className="summary">{result.metrics.bmiCategory.summary}</p>
        <div className="highlight-line">
          <strong>{result.health.calorieMode}</strong>
          <span>{result.health.direction}</span>
        </div>
        <List items={result.health.tips} />
      </article>

      <article className="panel result-card">
        <div className="panel-title">
          <Shirt size={20} />
          <h2>Gợi ý phong cách</h2>
        </div>
        <p className="summary">{result.fashion.focus}</p>
        <h3>Nên mặc</h3>
        <List items={result.fashion.wear} />
        <h3>Nên tránh</h3>
        <List items={result.fashion.avoid} />
      </article>

      <article className="panel note-card">
        <p>{result.disclaimer}</p>
        <p>{bodyFat?.note || "Body fat cần số đo vòng cổ/eo/hông để ước tính bằng công thức."}</p>
        <p>{result.photo.note}</p>
      </article>
    </section>
  );
}

function sourceLabel(source) {
  if (source === "gemini_vision" || source === "openai_vision") return "AI phân tích từ ảnh";
  if (source === "demo_fallback") return "Demo fallback";
  if (source === "no_photo") return "Chưa có ảnh";
  return "Fallback";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function outfitLevelLabel(level) {
  const labels = {
    good: "Trang phục hiện tại khá phù hợp",
    okay: "Trang phục hiện tại tương đối ổn",
    not_ideal: "Trang phục hiện tại chưa thật sự tối ưu",
    unclear: "Chưa đủ thông tin để đánh giá outfit"
  };

  return labels[level] || labels.unclear;
}

function Metric({ icon, label, value, note }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="clean-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function AdminUsersPage({ user, apiFetch }) {
  const [users, setUsers] = React.useState([]);
  const [stats, setStats] = React.useState({ totalUsers: 0, premiumUsersCount: 0 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [editingUserId, setEditingUserId] = React.useState("");
  const [editForm, setEditForm] = React.useState({ role: "", plan: "", premiumUntil: "" });
  
  // States cho Search và Create
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    plan: "free",
    premiumUntil: ""
  });

  React.useEffect(() => {
    if (user?.role === "admin") loadUsers();
  }, [user]);

  if (!user || user.role !== "admin") return <LockedPanel title="Quản lý người dùng" />;

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/admin/users");
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tải danh sách người dùng.");
      setUsers(data.users || []);
      setStats(data.stats || { totalUsers: 0, premiumUsersCount: 0 });
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(u) {
    setEditingUserId(u._id);
    setEditForm({
      role: u.role,
      plan: u.plan,
      premiumUntil: u.premiumUntil ? u.premiumUntil.slice(0, 10) : ""
    });
  }

  async function saveUserEdit(userId) {
    setError("");
    setMessage("");
    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editForm.role,
          plan: editForm.plan,
          premiumUntil: editForm.plan === "premium" ? (editForm.premiumUntil ? new Date(editForm.premiumUntil).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) : null
        })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể cập nhật thông tin người dùng.");
      setMessage("Cập nhật thành công!");
      setEditingUserId("");
      loadUsers();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          plan: createForm.plan,
          premiumUntil: createForm.plan === "premium" ? (createForm.premiumUntil ? new Date(createForm.premiumUntil).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) : null
        })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tạo tài khoản mới.");
      
      setMessage("Thêm người dùng mới thành công!");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "customer", plan: "free", premiumUntil: "" });
      loadUsers();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userName}"?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể xóa người dùng.");
      
      setMessage("Đã xóa tài khoản thành công!");
      loadUsers();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    }
  }

  const filteredUsers = users.filter((u) =>
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.plan || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="admin-users-page">
      <div className="section-heading wardrobe-heading">
        <div>
          <h2>Quản lý người dùng</h2>
          <p>Xem danh sách tài khoản, thống kê số lượng tài khoản đã nâng cấp Premium và phân quyền.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          <button 
            className="primary-button" 
            type="button" 
            onClick={() => setIsCreateOpen(!isCreateOpen)}
          >
            {isCreateOpen ? "Đóng form" : "Thêm User"}
          </button>
          <button className="secondary-button" type="button" onClick={loadUsers} disabled={loading}>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Form thêm mới người dùng */}
      {isCreateOpen && (
        <form onSubmit={handleCreateUser} className="panel product-form" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div className="section-heading" style={{ marginBottom: "var(--space-xs)" }}>
            <h2>Thêm người dùng mới</h2>
          </div>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-md)" }}>
            <div>
              <label>Tên hiển thị <span style={{ color: "red" }}>*</span></label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div>
              <label>Email <span style={{ color: "red" }}>*</span></label>
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div>
              <label>Mật khẩu <span style={{ color: "red" }}>*</span></label>
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div>
              <label>Vai trò</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>
            <div>
              <label>Gói dịch vụ</label>
              <select
                value={createForm.plan}
                onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              >
                <option value="free">free</option>
                <option value="premium">premium</option>
              </select>
            </div>
            {createForm.plan === "premium" && (
              <div>
                <label>Hạn Premium (Để trống mặc định +30 ngày)</label>
                <input
                  type="date"
                  value={createForm.premiumUntil}
                  onChange={(e) => setCreateForm({ ...createForm, premiumUntil: e.target.value })}
                  style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
                />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
            <button className="primary-button" type="submit">Lưu lại</button>
            <button className="secondary-button" type="button" onClick={() => setIsCreateOpen(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="dashboard-kpi-grid">
        <DashboardKpi label="Tổng tài khoản" value={stats.totalUsers} note="Toàn bộ người dùng đăng ký" />
        <DashboardKpi label="Tài khoản Premium" value={stats.premiumUsersCount} note="Gói trả phí đang hoạt động" />
        <DashboardKpi label="Tỉ lệ Premium" value={stats.totalUsers > 0 ? `${((stats.premiumUsersCount / stats.totalUsers) * 100).toFixed(1)}%` : "0%"} note="Tỉ lệ chuyển đổi" />
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="panel admin-users-table-container">
        <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap", padding: "var(--space-md) var(--space-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <h2>Danh sách người dùng</h2>
            <span className="count-badge" style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
              {filteredUsers.length}
            </span>
          </div>
          <div className="search-bar-container" style={{ flex: "1", maxWidth: "350px" }}>
            <input
              type="text"
              placeholder="Tìm theo tên, email, vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#fff",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>
        </div>

        {loading && users.length === 0 ? (
          <p className="loading" style={{ padding: "var(--space-lg)" }}>Đang tải danh sách...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-state" style={{ padding: "var(--space-lg)", textAlign: "center", color: "var(--text-secondary)" }}>Không tìm thấy người dùng phù hợp.</p>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Gói dịch vụ</th>
                <th>Premium Đến ngày</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isEditing = editingUserId === u._id;
                const isPremiumActive = u.plan === "premium" && u.premiumUntil && new Date(u.premiumUntil) > new Date();

                return (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        >
                          <option value="customer">customer</option>
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.plan}
                          onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                        >
                          <option value="free">free</option>
                          <option value="premium">premium</option>
                        </select>
                      ) : (
                        <span className={`plan-badge ${isPremiumActive ? "premium" : "free"}`}>
                          {isPremiumActive ? "Premium" : "Free"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        editForm.plan === "premium" ? (
                          <input
                            type="date"
                            value={editForm.premiumUntil}
                            onChange={(e) => setEditForm({ ...editForm, premiumUntil: e.target.value })}
                          />
                        ) : "-"
                      ) : (
                        u.premiumUntil ? formatDate(u.premiumUntil) : "-"
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button className="primary-button btn-xs" onClick={() => saveUserEdit(u._id)}>Lưu</button>
                          <button className="secondary-button btn-xs" onClick={() => setEditingUserId("")}>Hủy</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="secondary-button btn-xs" onClick={() => startEdit(u)}>Sửa</button>
                          <button className="secondary-button danger-button btn-xs" onClick={() => handleDeleteUser(u._id, u.name)}>Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function AdminCouponsPage({ user, apiFetch }) {
  const [coupons, setCoupons] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [editingCouponId, setEditingCouponId] = React.useState("");
  const [editForm, setEditForm] = React.useState({ code: "", type: "percentage", value: 0, maxUses: 1, isActive: true });
  
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    code: "",
    type: "percentage",
    value: "",
    maxUses: "",
    isActive: true
  });

  React.useEffect(() => {
    if (user?.role === "admin") loadCoupons();
  }, [user]);

  if (!user || user.role !== "admin") return <LockedPanel title="Quản lý mã giảm giá" />;

  async function loadCoupons() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/api/admin/coupons");
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tải danh sách mã giảm giá.");
      setCoupons(data.coupons || []);
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c) {
    setEditingCouponId(c._id);
    setEditForm({
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      isActive: c.isActive
    });
  }

  async function saveCouponEdit(id) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiFetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể cập nhật mã giảm giá.");
      
      setMessage(`Đã lưu mã giảm giá ${editForm.code.toUpperCase()}`);
      setEditingCouponId("");
      loadCoupons();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCoupon(id, code) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá ${code}?`)) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiFetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể xóa mã giảm giá.");
      
      setMessage(`Đã xóa mã giảm giá ${code}`);
      loadCoupons();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await apiFetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: createForm.code.trim().toUpperCase(),
          type: createForm.type,
          value: Number(createForm.value),
          maxUses: Number(createForm.maxUses),
          isActive: createForm.isActive
        })
      });
      const data = await safeReadJson(response);
      if (!response.ok) throw new Error(data.message || "Không thể tạo mã giảm giá.");
      
      setMessage(`Đã tạo mã giảm giá ${createForm.code.toUpperCase()} thành công.`);
      setIsCreateOpen(false);
      setCreateForm({ code: "", type: "percentage", value: "", maxUses: "", isActive: true });
      loadCoupons();
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
      setLoading(false);
    }
  }

  const activeCount = coupons.filter(c => c.isActive).length;

  return (
    <section className="admin-users-page coupons-page">
      <div className="section-heading wardrobe-heading" style={{ paddingBottom: "var(--space-md)", paddingLeft: "var(--space-lg)", paddingRight: "var(--space-lg)", paddingTop: "var(--space-md)" }}>
        <div>
          <h2>Quản lý mã giảm giá</h2>
          <p>Tạo và thiết lập mã giảm giá Premium theo % hoặc số tiền cố định, giới hạn lượt sử dụng.</p>
        </div>
        <button className="primary-link" onClick={() => setIsCreateOpen(!isCreateOpen)}>
          {isCreateOpen ? "Đóng form tạo" : "Tạo mã mới"}
        </button>
      </div>

      {isCreateOpen && (
        <form className="panel admin-product-form" onSubmit={handleCreateCoupon} style={{ margin: "var(--space-md) var(--space-lg)", padding: "var(--space-md)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
          <h3>Tạo mã giảm giá mới</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-sm)", marginTop: "var(--space-sm)" }}>
            <div>
              <label>Mã giảm giá (viết hoa, không dấu)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: GIAM30K, KM10"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div>
              <label>Loại giảm giá</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              >
                <option value="percentage">Giảm theo %</option>
                <option value="fixed">Giảm số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label>Giá trị giảm</label>
              <input
                type="number"
                required
                min="0"
                placeholder={createForm.type === "percentage" ? "Ví dụ: 10 (tương đương 10%)" : "Ví dụ: 30000 (tương đương 30k)"}
                value={createForm.value}
                onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div>
              <label>Số lượt dùng tối đa</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ví dụ: 50"
                value={createForm.maxUses}
                onChange={(e) => setCreateForm({ ...createForm, maxUses: e.target.value })}
                style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
              <input
                type="checkbox"
                id="isActive"
                checked={createForm.isActive}
                onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                style={{ width: "18px", height: "18px" }}
              />
              <label htmlFor="isActive" style={{ margin: 0, cursor: "pointer" }}>Kích hoạt ngay</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-md)" }}>
            <button className="primary-button" type="submit" disabled={loading}>Lưu mã</button>
            <button className="secondary-button" type="button" onClick={() => setIsCreateOpen(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="dashboard-kpi-grid" style={{ margin: "var(--space-md) var(--space-lg)" }}>
        <DashboardKpi label="Tổng số mã" value={coupons.length} />
        <DashboardKpi label="Đang hoạt động" value={activeCount} />
        <DashboardKpi label="Đã vô hiệu hóa" value={coupons.length - activeCount} />
      </div>

      {error && <p className="error-message" style={{ margin: "0 var(--space-lg) var(--space-sm) var(--space-lg)" }}>{error}</p>}
      {message && <p className="success-message" style={{ margin: "0 var(--space-lg) var(--space-sm) var(--space-lg)" }}>{message}</p>}

      <div className="panel admin-users-table-container" style={{ margin: "0 var(--space-lg) var(--space-lg) var(--space-lg)" }}>
        {loading && coupons.length === 0 ? (
          <p className="loading" style={{ padding: "var(--space-lg)" }}>Đang tải danh sách mã giảm giá...</p>
        ) : coupons.length === 0 ? (
          <p className="empty-state" style={{ padding: "var(--space-lg)", textAlign: "center", color: "var(--text-secondary)" }}>Chưa cấu hình mã giảm giá nào.</p>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Lượt dùng tối đa</th>
                <th>Đã dùng</th>
                <th>Còn lại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isEditing = editingCouponId === c._id;
                const remaining = Math.max(0, c.maxUses - (c.usedCount || 0));

                return (
                  <tr key={c._id}>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                          style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", width: "120px" }}
                        />
                      ) : (
                        <code style={{ fontSize: "1.05rem", color: "var(--warning)", fontWeight: "700" }}>{c.code}</code>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff" }}
                        >
                          <option value="percentage">Phần trăm (%)</option>
                          <option value="fixed">Cố định (VND)</option>
                        </select>
                      ) : (
                        <span>{c.type === "percentage" ? "Phần trăm" : "Cố định"}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.value}
                          onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                          style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", width: "100px" }}
                        />
                      ) : (
                        <strong>{c.type === "percentage" ? `${c.value}%` : `${c.value.toLocaleString("vi-VN")}đ`}</strong>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.maxUses}
                          onChange={(e) => setEditForm({ ...editForm, maxUses: Number(e.target.value) })}
                          style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", width: "80px" }}
                        />
                      ) : (
                        <span>{c.maxUses}</span>
                      )}
                    </td>
                    <td>{c.usedCount || 0}</td>
                    <td>
                      <span className={remaining === 0 ? "error-message" : ""} style={{ fontWeight: remaining === 0 ? "700" : "normal" }}>
                        {remaining}
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          style={{ width: "18px", height: "18px" }}
                        />
                      ) : (
                        <span className={`plan-badge ${c.isActive && remaining > 0 ? "premium" : "free"}`}>
                          {c.isActive && remaining > 0 ? "Hoạt động" : "Bị khóa/Hết lượt"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button className="primary-button btn-xs" onClick={() => saveCouponEdit(c._id)}>Lưu</button>
                          <button className="secondary-button btn-xs" onClick={() => setEditingCouponId("")}>Hủy</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="secondary-button btn-xs" onClick={() => startEdit(c)}>Sửa</button>
                          <button className="secondary-button danger-button btn-xs" onClick={() => handleDeleteCoupon(c._id, c.code)}>Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function ChatWidgets({ apiFetch }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "model", text: "Xin chào! Tôi là trợ lý ảo AI của FitStyle. Bạn cần tư vấn gì về vóc dáng, sức khỏe hay phong cách thời trang hôm nay?" }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));

      const response = await fetch(`${API_URL}/api/chat-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text, history })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi hệ thống");

      setMessages(prev => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", text: "Xin lỗi, hiện tại tôi gặp sự cố kết nối. Bạn hãy thử lại sau nhé!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-widgets-container">
      {/* Ô chat Messenger (bên trên) */}
      <a 
        href="https://www.facebook.com/profile.php?id=61590549851322" 
        target="_blank" 
        rel="noopener noreferrer"
        className="chat-widget-btn messenger-btn"
        title="Liên hệ Facebook Page"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.91 1.448 5.513 3.719 7.156.195.14.318.365.318.608v2.302c0 .546.565.922 1.07.712l2.56-1.066a.82.82 0 0 1 .593-.016c.553.155 1.134.238 1.74.238 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm1.03 12.35l-2.03-2.17-3.96 2.17 4.36-4.64 2.03 2.17 3.96-2.17-4.36 4.64z"/>
        </svg>
      </a>

      {/* Ô chat AI Bot (bên dưới) */}
      <button 
        className={`chat-widget-btn chat-bot-btn ${isOpen ? "active" : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với AI"
      >
        <Sparkles size={24} />
      </button>

      {/* Cửa sổ chat AI */}
      {isOpen && (
        <div className="chat-box-window">
          <div className="chat-box-header">
            <div>
              <Sparkles size={18} />
              <strong>Trợ lý FitStyle AI</strong>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
          </div>
          <div className="chat-box-body">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.role}`}>
                <div className="chat-message-bubble">
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message model">
                <div className="chat-message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-box-footer" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Hỏi về thời trang & sức khỏe..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || loading}>Gửi</button>
          </form>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);



