import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Activity, BarChart3, Camera, Dumbbell, ExternalLink, History, Home, Images, LogIn, LogOut, Percent, Ruler, Shirt, ShoppingBag, Sparkles, Target, UserRound, UserPlus } from "lucide-react";
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
  return {
    token,
    user: savedUser ? JSON.parse(savedUser) : null,
    remember: Boolean(localStorage.getItem("fitstyle_token"))
  };
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const savedSession = React.useMemo(readSavedSession, []);
  const [token, setToken] = React.useState(savedSession.token);
  const [user, setUser] = React.useState(savedSession.user);
  const [rememberSession, setRememberSession] = React.useState(savedSession.remember);

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
      <header className="site-header">
        <Link className="brand-mark" to="/">
          <span><Sparkles size={18} /></span>
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

      <section className="intro" aria-hidden="true">
        <div>
          <p className="eyebrow">Health + Style</p>
          <h1>FitStyle AI</h1>
          <p className="intro-copy">
            Upload ảnh toàn thân để AI nhận diện dáng người, kết hợp chỉ số cơ thể để gợi ý sức khỏe và phong cách.
          </p>
        </div>
        <div className="intro-actions">
          <div className="intro-badge">
            <Sparkles size={18} />
            Body Scan + Style
          </div>
          {user && <UserBadge user={user} onLogout={logout} />}
        </div>
      </section>

      {user && (
        <nav className="app-nav">
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
        </nav>
      )}

      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/analyze" element={<AnalyzePage user={user} apiFetch={apiFetch} />} />
        <Route path="/login" element={<AuthPage mode="login" user={user} onSession={saveSession} />} />
        <Route path="/register" element={<AuthPage mode="register" user={user} onSession={saveSession} />} />
        <Route path="/history" element={<HistoryPage user={user} apiFetch={apiFetch} />} />
        <Route path="/history/:id" element={<HistoryDetailPage user={user} apiFetch={apiFetch} />} />
        <Route path="/try-on" element={<TryOnPage user={user} apiFetch={apiFetch} />} />
        <Route path="/wardrobe" element={<WardrobePage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/products" element={<AdminProductsPage user={user} apiFetch={apiFetch} />} />
        <Route path="/admin/products/manage" element={<AdminProductManagePage user={user} apiFetch={apiFetch} />} />
      </Routes>
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
        <div className="section-heading">
          <h2>Sản phẩm hiện có</h2>
          <span>{loading ? "Đang tải..." : products.length}</span>
        </div>
        {products.length === 0 ? (
          <p className="manage-empty">Chưa có sản phẩm trong database.</p>
        ) : (
          <div className="manage-product-list">
            {products.map((product) => (
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

function TryOnPage({ user, apiFetch }) {
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
  const selectedProductName = searchParams.get("productName") || "";

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateFile(event) {
    const file = event.target.files?.[0] || null;

    if (event.target.name === "personImage") {
      setPersonFile(file);
      setPersonPreview(file ? URL.createObjectURL(file) : "");
    } else {
      setGarmentFile(file);
      setGarmentPreview(file ? URL.createObjectURL(file) : "");
    }
  }

  async function submitTryOn(event) {
    event.preventDefault();

    if (!user) {
      setError("Bạn cần đăng nhập để dùng tính năng phối đồ.");
      return;
    }

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
    } catch (err) {
      setError(toFriendlyNetworkError(err));
    } finally {
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
            <img src={resultUrl} alt="Kết quả phối đồ từ AI" />
            <a className="secondary-link" href={resultUrl} target="_blank" rel="noreferrer">
              Mở ảnh kết quả
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
    </section>
  );
}

function HomePage({ user }) {
  return (
    <section className="home-page">
      <section className="home-hero-v2">
        <div className="home-hero-copy">
          <p className="eyebrow">Health + Fashion Intelligence</p>
          <h1>Hiểu cơ thể hơn. Mặc đẹp hơn. Sống khỏe hơn.</h1>
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
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
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

function AnalyzePage({ user, apiFetch }) {
  const navigate = useNavigate();
  const [form, setForm] = React.useState(initialForm);
  const [photo, setPhoto] = React.useState(null);
  const [preview, setPreview] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function submitAnalysis(event) {
    event.preventDefault();

    if (!user) {
      setError("Bạn cần đăng nhập để phân tích và lưu lịch sử.");
      return;
    }

    setLoading(true);
    setError("");

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (photo) payload.append("bodyPhoto", photo);

    try {
      const response = await apiFetch("/api/analyze", {
        method: "POST",
        body: payload
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join(" ") || data.message || "Không thể phân tích dữ liệu.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="workspace">
        <form className="panel form-panel" onSubmit={submitAnalysis}>
          <div className="panel-title">
            <Ruler size={20} />
            <h2>Thông tin cơ thể</h2>
          </div>

          <ProfileForm form={form} onChange={updateField} />

          <label className="upload-box">
            <Camera size={20} />
            <span>{photo ? photo.name : "Upload ảnh toàn thân để AI phân tích dáng người"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} />
          </label>

          {preview && <img className="photo-preview" src={preview} alt="Ảnh toàn thân đã upload" />}

          {error && <p className="error">{error}</p>}

          <button className="primary-button" type="submit" disabled={loading || !user}>
            {!user ? "Đăng nhập để phân tích" : loading ? "Đang phân tích..." : "Phân tích ngay"}
          </button>
          {result?.historyId && (
            <button className="secondary-button" type="button" onClick={() => navigate(`/history/${result.historyId}`)}>
              Mở chi tiết lịch sử
            </button>
          )}
        </form>

        {loading ? (
          <LoadingPanel
            title="AI đang phân tích ảnh và chỉ số"
            description="Hệ thống đang đọc ảnh toàn thân, tính BMI/TDEE và tạo gợi ý sức khỏe, phong cách."
          />
        ) : (
          <Results result={result} />
        )}
      </section>
    </>
  );
}

function ProfileForm({ form, onChange }) {
  return (
    <>
      <div className="field-grid">
        <label>
          Tuổi
          <input name="age" type="number" min="16" max="80" value={form.age} onChange={onChange} />
        </label>
        <label>
          Giới tính
          <select name="gender" value={form.gender} onChange={onChange}>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </label>
        <label>
          Chiều cao (cm)
          <input name="heightCm" type="number" min="120" max="230" value={form.heightCm} onChange={onChange} />
        </label>
        <label>
          Cân nặng (kg)
          <input name="weightKg" type="number" min="30" max="250" value={form.weightKg} onChange={onChange} />
        </label>
      </div>

      <div className="measurement-block">
        <div>
          <strong>Số đo để ước tính body fat</strong>
          <p>Không bắt buộc, nhưng nên có cổ/ngực/eo/hông để kết quả khách quan hơn ảnh đơn thuần.</p>
        </div>
        <div className="field-grid">
          <label>
            Vòng cổ (cm)
            <input name="neckCm" type="number" min="20" max="180" value={form.neckCm} onChange={onChange} />
          </label>
          <label>
            Vòng ngực (cm)
            <input name="chestCm" type="number" min="20" max="180" value={form.chestCm} onChange={onChange} />
          </label>
          <label>
            Vòng eo (cm)
            <input name="waistCm" type="number" min="20" max="180" value={form.waistCm} onChange={onChange} />
          </label>
          <label className="wide-field">
            Vòng hông (cm, cần cho nữ)
            <input name="hipCm" type="number" min="20" max="180" value={form.hipCm} onChange={onChange} />
          </label>
        </div>
      </div>

      <label>
        Mức độ vận động
        <select name="activityLevel" value={form.activityLevel} onChange={onChange}>
          <option value="sedentary">Ít vận động</option>
          <option value="light">Nhẹ, 1-3 buổi/tuần</option>
          <option value="moderate">Vừa, 3-5 buổi/tuần</option>
          <option value="active">Nhiều, 6-7 buổi/tuần</option>
        </select>
      </label>

      <label>
        Mục tiêu
        <select name="goal" value={form.goal} onChange={onChange}>
          <option value="lose">Giảm cân/giảm mỡ</option>
          <option value="maintain">Duy trì, săn chắc hơn</option>
          <option value="gain">Tăng cân/tăng cơ</option>
        </select>
      </label>
    </>
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
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Không thể tải lịch sử.");
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Lịch sử phân tích" />;

  return (
    <section className="history-section history-page">
      <div className="section-heading">
        <h2>{user.role === "admin" ? "Lịch sử toàn hệ thống" : "Lịch sử phân tích"}</h2>
        <span>{loading ? "Đang tải..." : `${records.length} bản ghi`}</span>
      </div>
      {error && <p className="error">{error}</p>}
      {records.length === 0 ? (
        <div className="panel history-empty">Chưa có lịch sử. Mỗi lần bấm phân tích, kết quả sẽ được lưu lại ở đây.</div>
      ) : (
        <div className="history-grid">
          {records.map((record) => (
            <Link className="history-card" key={record.id} to={`/history/${record.id}`}>
              <span>{formatDate(record.createdAt)}</span>
              <strong>{record.summary.bodyShape || "Chưa có dáng"}</strong>
              <small>
                BMI {record.summary.bmi}
                {record.summary.bodyFat ? ` • BF ${record.summary.bodyFat}%` : ""}
                {record.summary.outfitScore !== null ? ` • Outfit ${record.summary.outfitScore}/10` : ""}
              </small>
              <em>{record.summary.direction}</em>
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
    if (user) loadRecord();
  }, [user, id]);

  async function loadRecord() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`/api/analyses/${id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Không thể mở chi tiết lịch sử.");
      setRecord(data.record);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <LockedPanel title="Chi tiết lịch sử" />;

  return (
    <section className="detail-page">
      <div className="section-heading">
        <div>
          <h2>Chi tiết phân tích</h2>
          {record && <p>{formatDate(record.createdAt)}</p>}
        </div>
        <Link className="secondary-link" to="/history">Quay lại lịch sử</Link>
      </div>
      {loading && <div className="panel history-empty">Đang tải chi tiết...</div>}
      {error && <p className="error">{error}</p>}
      {record && <Results result={record.result} />}
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

  if (user) return <Navigate to="/analyze" replace />;

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
      navigate("/analyze");
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
        <p>Đăng nhập để lưu lịch sử phân tích. Tài khoản đầu tiên trong hệ thống sẽ tự động là admin.</p>
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
    <div className="user-badge">
      <UserRound size={18} />
      <div>
        <strong>{user.name}</strong>
        <span>{user.role}</span>
      </div>
      <button type="button" onClick={onLogout} title="Đăng xuất">
        <LogOut size={17} />
      </button>
    </div>
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

createRoot(document.getElementById("root")).render(<App />);
