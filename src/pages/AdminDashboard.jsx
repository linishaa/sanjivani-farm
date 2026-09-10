import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useProducts } from "../context/ProductContext";

const API_BASE_URL =
  "https://sanjivani-farmbackend.onrender.com";

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: "⌂",
  },
  {
    id: "orders",
    label: "Orders",
    icon: "▤",
  },
  {
    id: "customers",
    label: "Customers",
    icon: "♙",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: "◷",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "▦",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "✦",
  },
];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Fresh Cow Milk",
    price: 55,
    stock: 50,
    unit: "1 L",
    category: "Milk",
    status: "in-stock",
  },
  {
    id: 2,
    name: "Fresh Curd",
    price: 50,
    stock: 30,
    unit: "500 g",
    category: "Dairy",
    status: "in-stock",
  },
  {
    id: 3,
    name: "Paneer",
    price: 120,
    stock: 20,
    unit: "250 g",
    category: "Dairy",
    status: "in-stock",
  },
  {
    id: 4,
    name: "Butter",
    price: 90,
    stock: 15,
    unit: "200 g",
    category: "Dairy",
    status: "in-stock",
  },
  {
    id: 5,
    name: "Ghee",
    price: 280,
    stock: 10,
    unit: "500 ml",
    category: "Dairy",
    status: "in-stock",
  },
];

function formatCurrency(value) {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function getOrderAmount(order) {
  return Number(
    order?.total ??
      order?.total_amount ??
      order?.amount ??
      order?.grand_total ??
      0
  );
}

function getOrderCustomer(order) {
  return (
    order?.customer_name ||
    order?.name ||
    order?.customer?.name ||
    "Customer"
  );
}

function getOrderEmail(order) {
  return (
    order?.customer_email ||
    order?.email ||
    order?.customer?.email ||
    "—"
  );
}

function getOrderStatus(order) {
  return (
    order?.status ||
    order?.payment_status ||
    order?.order_status ||
    "Processing"
  );
}

function getOrderId(order, index) {
  return (
    order?.order_id ||
    order?.id ||
    order?.payment_id ||
    `ORD-${String(index + 1).padStart(4, "0")}`
  );
}

function normalizeUsers(users) {
  if (!Array.isArray(users)) return [];

  return users
    .filter(Boolean)
    .map((user, index) => ({
      id:
        user?.id ||
        user?.user_id ||
        user?.email ||
        user?.phone ||
        index,
      name:
        user?.name ||
        user?.full_name ||
        user?.username ||
        "Customer",
      email: user?.email || "",
      phone:
        user?.phone ||
        user?.mobile ||
        user?.phone_number ||
        "",
    }));
}

function getLocalUsers() {
  const possibleKeys = [
    "users",
    "registered_users",
    "customers",
    "all_users",
    "userList",
  ];

  for (const key of possibleKeys) {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) continue;

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeUsers(parsed);
      }
    } catch {
      // Ignore invalid localStorage data.
    }
  }

  return [];
}

function MetricCard({
  icon,
  label,
  value,
  description,
  positive,
}) {
  return (
    <div className="admin-metric-card">
      <div className="admin-metric-top">
        <div className="admin-metric-icon">{icon}</div>

        {positive !== undefined && (
          <span
            className={`admin-metric-trend ${
              positive ? "positive" : "neutral"
            }`}
          >
            {positive ? "Active" : "Overview"}
          </span>
        )}
      </div>

      <div className="admin-metric-label">{label}</div>

      <div className="admin-metric-value">{value}</div>

      <div className="admin-metric-description">
        {description}
      </div>
    </div>
  );
}

function EmptyState({ icon = "◌", title, description }) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  let className = "neutral";

  if (
    normalized.includes("success") ||
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("active") ||
    normalized.includes("delivered") ||
    normalized.includes("in-stock")
  ) {
    className = "success";
  } else if (
    normalized.includes("pending") ||
    normalized.includes("processing")
  ) {
    className = "warning";
  } else if (
    normalized.includes("cancel") ||
    normalized.includes("fail") ||
    normalized.includes("out")
  ) {
    className = "danger";
  }

  return (
    <span className={`admin-status-badge ${className}`}>
      {status || "Unknown"}
    </span>
  );
}

export default function AdminDashboard() {
  const productContext = useProducts() || {};

  const contextOrders = Array.isArray(productContext.orders)
    ? productContext.orders
    : [];

  const subscriptions = Array.isArray(productContext.subscriptions)
    ? productContext.subscriptions
    : [];

  const [activeTab, setActiveTab] = useState("overview");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [registeredUsers, setRegisteredUsers] = useState([]);

  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState(null);

  const [backendOrders, setBackendOrders] = useState([]);

  const [ordersLoading, setOrdersLoading] = useState(false);

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_products_stock");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Use defaults.
    }

    return DEFAULT_PRODUCTS;
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    unit: "",
    category: "Dairy",
  });

  const [offerTitle, setOfferTitle] = useState("");

  const [offerText, setOfferText] = useState("");

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const [showBroadcastConfirm, setShowBroadcastConfirm] =
    useState(false);

  const [broadcastResult, setBroadcastResult] = useState(null);

  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [orderSearch, setOrderSearch] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");

  const [inventorySearch, setInventorySearch] = useState("");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // --- FETCH FUNCTIONS (Moved up to fix hoisting issue) ---

  const fetchBackendUsers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load customers."
        );
      }

      const users = normalizeUsers(data?.users || []);

      // API is primary; set even if empty
      setRegisteredUsers(users);
    } catch (error) {
      console.error("[AdminDashboard] Admin customer fetch error:", error);
      setCustomersError(
        error.message || "Failed to fetch customers."
      );
      // Fallback: keep existing registeredUsers (from localStorage/orders)
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const fetchBackendOrders = useCallback(async () => {
    setOrdersLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/orders`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load orders."
        );
      }

      const receivedOrders = Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data)
        ? data
        : [];

      setBackendOrders([...receivedOrders].reverse());
    } catch (error) {
      console.error("[AdminDashboard] Admin order fetch error:", error);

      // Keep dashboard usable if backend endpoint is unavailable
      setBackendOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // --- EFFECTS ---

  // Load fallback customers from localStorage / orders
  useEffect(() => {
    try {
      const users = getLocalUsers();

      if (users.length > 0) {
        setRegisteredUsers(users);
      } else if (contextOrders.length > 0) {
        const unique = [];

        const seen = new Set();

        contextOrders.forEach((order) => {
          const email =
            order?.customer_email ||
            order?.email ||
            order?.customer?.email ||
            "";

          const phone =
            order?.customer_phone ||
            order?.phone ||
            order?.customer?.phone ||
            "";

          const key =
            email ||
            phone ||
            `${order?.customer_name || order?.name || ""}`;

          if (!key || seen.has(key)) return;

          seen.add(key);

          unique.push({
            id: key,
            name:
              order?.customer_name ||
              order?.name ||
              "Customer",
            email,
            phone,
          });
        });

        setRegisteredUsers(unique);
      }
    } catch {
      setRegisteredUsers([]);
    }
  }, [contextOrders]);

  // Persist inventory
  useEffect(() => {
    try {
      localStorage.setItem(
        "admin_products_stock",
        JSON.stringify(products)
      );
    } catch {
      // Ignore localStorage failures.
    }
  }, [products]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch backend data when needed
  useEffect(() => {
    if (activeTab === "orders" || activeTab === "overview") {
      fetchBackendOrders();
    }
    // Fetch users on overview so the metric is correct immediately,
    // and also on customers tab.
    if (activeTab === "customers" || activeTab === "overview") {
      fetchBackendUsers();
    }
  }, [activeTab, fetchBackendOrders, fetchBackendUsers]);

  // --- DERIVED STATE ---

  const displayOrders = useMemo(() => {
    if (backendOrders.length > 0) {
      return backendOrders;
    }

    return contextOrders;
  }, [backendOrders, contextOrders]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    if (!query) return displayOrders;

    return displayOrders.filter((order, index) => {
      const values = [
        getOrderCustomer(order),
        getOrderEmail(order),
        getOrderStatus(order),
        getOrderId(order, index),
      ];

      return values.some((value) =>
        String(value).toLowerCase().includes(query)
      );
    });
  }, [displayOrders, orderSearch]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return registeredUsers;

    return registeredUsers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [registeredUsers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.unit,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [products, inventorySearch]);

  const totalRevenue = useMemo(() => {
    return displayOrders.reduce(
      (sum, order) => sum + getOrderAmount(order),
      0
    );
  }, [displayOrders]);

  const totalOrders = displayOrders.length;

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const status = String(
        subscription?.status || "active"
      ).toLowerCase();

      return (
        status === "active" ||
        status === "running" ||
        status === "confirmed"
      );
    }).length;
  }, [subscriptions]);

  const inStockProducts = products.filter(
    (product) => Number(product.stock || 0) > 0
  ).length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  ).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 0
  ).length;

  const recentOrders = displayOrders.slice(0, 5);

  // --- EVENT HANDLERS ---

  function changeTab(tab) {
    setActiveTab(tab);
    setSidebarOpen(false);
    setMobileNavOpen(false);
    setSearchTerm("");
  }

  function showNotification(type, message) {
    setNotification({
      type,
      message,
    });
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification(
        "error",
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification(
        "error",
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
  }

  function openBroadcastConfirmation(event) {
    event.preventDefault();

    if (!offerTitle.trim() && !offerText.trim() && !imageFile) {
      showNotification(
        "error",
        "Add an offer title, message, or poster before sending."
      );

      return;
    }

    setShowBroadcastConfirm(true);
  }

  async function sendBroadcast() {
    setShowBroadcastConfirm(false);
    setBroadcastLoading(true);

    setBroadcastStatus({
      type: "loading",
      message:
        "Sending your offer to registered customers...",
    });

    try {
      const formData = new FormData();

      const combinedMessage = [
        offerTitle.trim(),
        offerText.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      formData.append(
        "offer_text",
        combinedMessage
      );

      formData.append(
        "message",
        combinedMessage
      );

      if (imageFile) {
        formData.append("poster", imageFile);
        formData.append("image", imageFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/broadcast-offer`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Broadcast failed."
        );
      }

      const result = {
        success: data?.success !== false,
        message:
          data?.message ||
          "Broadcast request completed.",
        sentCount: Number(data?.sent_count || 0),
        failedCount: Number(data?.failed_count || 0),
        emailSentCount: Number(data?.email_sent_count || 0),
        totalRecipients: registeredUsers.length,
      };

      setBroadcastResult(result);

      setBroadcastStatus({
        type: result.emailSentCount > 0 || result.sentCount > 0 ? "success" : "warning",
        message: result.message,
      });

      setOfferTitle("");
      setOfferText("");
      setImageFile(null);
      setImagePreview("");

      showNotification(
        result.emailSentCount > 0 ? "success" : "warning",
        result.emailSentCount > 0
          ? "Offer broadcast completed."
          : "Broadcast completed, but no messages were confirmed."
      );
    } catch (error) {
      console.error("Broadcast error:", error);

      const message =
        error?.message ||
        "Something went wrong while sending the offer.";

      setBroadcastStatus({
        type: "error",
        message,
      });

      showNotification("error", message);
    } finally {
      setBroadcastLoading(false);
    }
  }

  function toggleProductStock(productId) {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== productId) return product;

        const currentStock = Number(product.stock || 0);

        return {
          ...product,
          stock: currentStock > 0 ? 0 : 10,
          status:
            currentStock > 0 ? "out-of-stock" : "in-stock",
        };
      })
    );
  }

  function deleteProduct(productId) {
    const confirmed = window.confirm(
      "Remove this product from the dashboard inventory?"
    );

    if (!confirmed) return;

    setProducts((current) =>
      current.filter((product) => product.id !== productId)
    );

    showNotification(
      "success",
      "Product removed from inventory."
    );
  }

  function handleNewProductChange(event) {
    const { name, value } = event.target;

    setNewProduct((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function addProduct(event) {
    event.preventDefault();

    if (!newProduct.name.trim()) {
      showNotification(
        "error",
        "Enter a product name."
      );

      return;
    }

    if (
      newProduct.price === "" ||
      Number(newProduct.price) < 0
    ) {
      showNotification(
        "error",
        "Enter a valid product price."
      );

      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name.trim(),
      price: Number(newProduct.price),
      stock: Number(newProduct.stock || 0),
      unit: newProduct.unit.trim() || "1 unit",
      category:
        newProduct.category.trim() || "Dairy",
      status:
        Number(newProduct.stock || 0) > 0
          ? "in-stock"
          : "out-of-stock",
    };

    setProducts((current) => [
      ...current,
      product,
    ]);

    setNewProduct({
      name: "",
      price: "",
      stock: "",
      unit: "",
      category: "Dairy",
    });

    showNotification(
      "success",
      "Product added to inventory."
    );
  }

  // --- RENDER FUNCTIONS ---

  function renderOverview() {
    return (
      <>
        <section className="admin-page-heading">
          <div>
            <span className="admin-eyebrow">
              SANJIVANI FARM
            </span>

            <h1>Good afternoon, Admin</h1>

            <p>
              Here's what's happening across your farm
              store today.
            </p>
          </div>

          <button
            className="admin-primary-button"
            onClick={() => changeTab("marketing")}
          >
            <span>✦</span>
            Create Offer
          </button>
        </section>

        <section className="admin-metrics-grid">
          <MetricCard
            icon="₹"
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            description="Based on available order records"
            positive
          />

          <MetricCard
            icon="▤"
            label="Total Orders"
            value={totalOrders}
            description="Orders received"
            positive
          />

          <MetricCard
            icon="♙"
            label="Customers"
            value={registeredUsers.length}
            description="Registered customer records"
            positive
          />

          <MetricCard
            icon="◷"
            label="Subscriptions"
            value={activeSubscriptions}
            description="Currently active"
            positive
          />
        </section>

        <section className="admin-overview-grid">
          <div className="admin-panel admin-large-panel">
            <div className="admin-panel-header">
              <div>
                <span className="admin-section-kicker">
                  SALES ACTIVITY
                </span>

                <h2>Recent Orders</h2>
              </div>

              <button
                className="admin-text-button"
                onClick={() => changeTab("orders")}
              >
                View all →
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                icon="▤"
                title="No orders yet"
                description="New orders will appear here once customers complete checkout."
              />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order, index) => (
                      <tr key={getOrderId(order, index)}>
                        <td>
                          <strong>
                            {getOrderId(order, index)}
                          </strong>
                        </td>

                        <td>
                          {getOrderCustomer(order)}
                        </td>

                        <td>
                          {formatDate(
                            order?.date ||
                              order?.created_at ||
                              order?.createdAt
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              getOrderAmount(order)
                            )}
                          </strong>
                        </td>

                        <td>
                          <StatusBadge
                            status={getOrderStatus(order)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="admin-section-kicker">
                  INVENTORY
                </span>

                <h2>Stock Overview</h2>
              </div>

              <button
                className="admin-icon-button"
                onClick={() => changeTab("inventory")}
                title="Open inventory"
              >
                →
              </button>
            </div>

            <div className="admin-stock-summary">
              <div className="admin-stock-row">
                <div className="admin-stock-label">
                  <span className="admin-stock-dot green" />
                  In stock
                </div>

                <strong>{inStockProducts}</strong>
              </div>

              <div className="admin-stock-row">
                <div className="admin-stock-label">
                  <span className="admin-stock-dot orange" />
                  Low stock
                </div>

                <strong>{lowStockProducts}</strong>
              </div>

              <div className="admin-stock-row">
                <div className="admin-stock-label">
                  <span className="admin-stock-dot red" />
                  Out of stock
                </div>

                <strong>{outOfStockProducts}</strong>
              </div>
            </div>

            <div className="admin-quick-actions">
              <button
                onClick={() => changeTab("inventory")}
              >
                Manage Inventory
              </button>

              <button
                onClick={() => changeTab("customers")}
              >
                View Customers
              </button>

              <button
                onClick={() => changeTab("marketing")}
              >
                Send an Offer
              </button>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-highlight-panel">
          <div className="admin-highlight-content">
            <span className="admin-section-kicker">
              CUSTOMER ENGAGEMENT
            </span>

            <h2>
              Have something fresh to share?
            </h2>

            <p>
              Publish your latest farm offer and reach
              your customer base from one place.
            </p>

            <button
              className="admin-dark-button"
              onClick={() => changeTab("marketing")}
            >
              Open Marketing →
            </button>
          </div>

          <div className="admin-highlight-art">
            ✦
          </div>
        </section>
      </>
    );
  }

  function renderOrders() {
    return (
      <>
        <section className="admin-page-heading compact">
          <div>
            <span className="admin-eyebrow">
              SALES
            </span>

            <h1>Orders</h1>

            <p>
              Review recent transactions and customer
              orders.
            </p>
          </div>

          <button
            className="admin-secondary-button"
            onClick={fetchBackendOrders}
            disabled={ordersLoading}
          >
            {ordersLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-toolbar">
            <div>
              <span className="admin-result-count">
                {filteredOrders.length} orders
              </span>
            </div>

            <div className="admin-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(event) =>
                  setOrderSearch(event.target.value)
                }
              />
            </div>
          </div>

          {ordersLoading && displayOrders.length === 0 ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon="▤"
              title="No orders found"
              description={
                orderSearch
                  ? "Try a different search term."
                  : "Orders will appear here when customers place them."
              }
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={`${getOrderId(order, index)}-${index}`}>
                      <td>
                        <strong>
                          {getOrderId(order, index)}
                        </strong>
                      </td>

                      <td>
                        {getOrderCustomer(order)}
                      </td>

                      <td className="admin-muted-cell">
                        {getOrderEmail(order)}
                      </td>

                      <td>
                        {formatDate(
                          order?.date ||
                            order?.created_at ||
                            order?.createdAt
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            getOrderAmount(order)
                          )}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge
                          status={getOrderStatus(order)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderCustomers() {
    return (
      <>
        <section className="admin-page-heading compact">
          <div>
            <span className="admin-eyebrow">
              CUSTOMER BASE
            </span>

            <h1>Customers</h1>

            <p>
              Manage your registered customer records.
            </p>
          </div>

          <button
            className="admin-secondary-button"
            onClick={fetchBackendUsers}
            disabled={customersLoading}
          >
            {customersLoading
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </section>

        <section className="admin-metrics-grid small">
          <MetricCard
            icon="♙"
            label="Registered"
            value={registeredUsers.length}
            description="Customer records"
            positive
          />

          <MetricCard
            icon="✉"
            label="With Email"
            value={
              registeredUsers.filter(
                (user) => user.email
              ).length
            }
            description="Email addresses available"
          />

          <MetricCard
            icon="☎"
            label="With Phone"
            value={
              registeredUsers.filter(
                (user) => user.phone
              ).length
            }
            description="Phone numbers available"
          />

          <MetricCard
            icon="✦"
            label="Reachable"
            value={
              registeredUsers.filter(
                (user) => user.email || user.phone
              ).length
            }
            description="Email or phone available"
          />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-toolbar">
            <div>
              <span className="admin-result-count">
                {filteredCustomers.length} customers
              </span>
            </div>

            <div className="admin-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(event.target.value)
                }
              />
            </div>
          </div>

          {customersLoading && registeredUsers.length === 0 ? (
            <div className="admin-loading">
              <div className="admin-spinner" />
              Loading customers...
            </div>
          ) : customersError && registeredUsers.length === 0 ? (
            <div className="admin-empty-state" style={{ minHeight: '220px' }}>
              <div className="admin-empty-icon">!</div>
              <h3>Something went wrong</h3>
              <p>{customersError}</p>
              <button
                className="admin-primary-button"
                onClick={fetchBackendUsers}
                style={{ marginTop: '12px' }}
              >
                Try Again
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              icon="♙"
              title={
                customerSearch
                  ? "No customers found"
                  : "No registered customers yet"
              }
              description={
                customerSearch
                  ? "Try another search."
                  : "Registered customers will appear here once they sign up."
              }
            />
          ) : (
            <div className="admin-customer-grid">
              {filteredCustomers.map((customer, index) => (
                <div
                  className="admin-customer-card"
                  key={`${customer.id}-${index}`}
                >
                  <div className="admin-customer-avatar">
                    {String(customer.name || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="admin-customer-info">
                    <h3>{customer.name}</h3>

                    <p>
                      {customer.email || "No email"}
                    </p>

                    <span>
                      {customer.phone || "No phone"}
                    </span>
                  </div>

                  <div className="admin-customer-status">
                    <span className="admin-live-dot" />
                    Registered
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderSubscriptions() {
    return (
      <>
        <section className="admin-page-heading compact">
          <div>
            <span className="admin-eyebrow">
              RECURRING ORDERS
            </span>

            <h1>Subscriptions</h1>

            <p>
              Monitor your active subscription customers.
            </p>
          </div>
        </section>

        <section className="admin-metrics-grid">
          <MetricCard
            icon="◷"
            label="Active"
            value={activeSubscriptions}
            description="Currently running"
            positive
          />

          <MetricCard
            icon="▤"
            label="Total"
            value={subscriptions.length}
            description="Subscription records"
          />

          <MetricCard
            icon="₹"
            label="Subscription Revenue"
            value={formatCurrency(
              subscriptions.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item?.amount ||
                      item?.total ||
                      item?.price ||
                      0
                  ),
                0
              )
            )}
            description="Available subscription values"
          />
        </section>

        <section className="admin-panel">
          {subscriptions.length === 0 ? (
            <EmptyState
              icon="◷"
              title="No subscriptions available"
              description="Active subscription information will appear here."
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {subscriptions.map(
                    (subscription, index) => (
                      <tr
                        key={
                          subscription?.id ||
                          subscription?.subscription_id ||
                          index
                        }
                      >
                        <td>
                          <strong>
                            {subscription?.name ||
                              subscription?.customer_name ||
                              "Customer"}
                          </strong>
                        </td>

                        <td>
                          {subscription?.plan ||
                            subscription?.plan_name ||
                            subscription?.type ||
                            "Subscription"}
                        </td>

                        <td>
                          {formatCurrency(
                            subscription?.amount ||
                              subscription?.total ||
                              subscription?.price ||
                              0
                          )}
                        </td>

                        <td>
                          {formatDate(
                            subscription?.start_date ||
                              subscription?.startDate ||
                              subscription?.created_at
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              subscription?.status ||
                              "Active"
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderInventory() {
    return (
      <>
        <section className="admin-page-heading compact">
          <div>
            <span className="admin-eyebrow">
              PRODUCT MANAGEMENT
            </span>

            <h1>Inventory</h1>

            <p>
              Keep your farm products and stock levels
              organized.
            </p>
          </div>
        </section>

        <section className="admin-metrics-grid small">
          <MetricCard
            icon="▦"
            label="Products"
            value={products.length}
            description="Products in dashboard"
          />

          <MetricCard
            icon="✓"
            label="In Stock"
            value={inStockProducts}
            description="Currently available"
            positive
          />

          <MetricCard
            icon="!"
            label="Low Stock"
            value={lowStockProducts}
            description="5 units or less"
          />

          <MetricCard
            icon="×"
            label="Out of Stock"
            value={outOfStockProducts}
            description="Currently unavailable"
          />
        </section>

        <div className="admin-two-column">
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="admin-section-kicker">
                  ADD PRODUCT
                </span>

                <h2>New Product</h2>
              </div>
            </div>

            <form
              className="admin-form"
              onSubmit={addProduct}
            >
              <label>
                Product Name
                <input
                  name="name"
                  value={newProduct.name}
                  onChange={handleNewProductChange}
                  placeholder="e.g. Fresh Paneer"
                />
              </label>

              <div className="admin-form-row">
                <label>
                  Price
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={newProduct.price}
                    onChange={handleNewProductChange}
                    placeholder="120"
                  />
                </label>

                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleNewProductChange}
                    placeholder="20"
                  />
                </label>
              </div>

              <div className="admin-form-row">
                <label>
                  Unit
                  <input
                    name="unit"
                    value={newProduct.unit}
                    onChange={handleNewProductChange}
                    placeholder="250 g"
                  />
                </label>

                <label>
                  Category
                  <input
                    name="category"
                    value={newProduct.category}
                    onChange={handleNewProductChange}
                    placeholder="Dairy"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="admin-primary-button full"
              >
                + Add Product
              </button>
            </form>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="admin-section-kicker">
                  PRODUCT LIST
                </span>

                <h2>Current Inventory</h2>
              </div>

              <div className="admin-search compact-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search..."
                  value={inventorySearch}
                  onChange={(event) =>
                    setInventorySearch(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="admin-inventory-list">
              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon="▦"
                  title="No products"
                  description="No inventory items match your search."
                />
              ) : (
                filteredProducts.map((product) => {
                  const stock = Number(
                    product.stock || 0
                  );

                  return (
                    <div
                      className="admin-inventory-item"
                      key={product.id}
                    >
                      <div className="admin-product-icon">
                        {product.name
                          ?.charAt(0)
                          ?.toUpperCase() || "P"}
                      </div>

                      <div className="admin-product-details">
                        <h3>{product.name}</h3>

                        <p>
                          {product.category} ·{" "}
                          {product.unit}
                        </p>
                      </div>

                      <div className="admin-product-stock">
                        <strong>
                          {stock}
                        </strong>

                        <span>units</span>
                      </div>

                      <div className="admin-product-price">
                        {formatCurrency(
                          product.price
                        )}
                      </div>

                      <button
                        className={`admin-stock-button ${
                          stock > 0
                            ? "available"
                            : "unavailable"
                        }`}
                        onClick={() =>
                          toggleProductStock(
                            product.id
                          )
                        }
                      >
                        {stock > 0
                          ? "In stock"
                          : "Out of stock"}
                      </button>

                      <button
                        className="admin-delete-button"
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                        title="Delete product"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  function renderMarketing() {
    return (
      <>
        <section className="admin-page-heading compact">
          <div>
            <span className="admin-eyebrow">
              CUSTOMER ENGAGEMENT
            </span>

            <h1>Marketing</h1>

            <p>
              Create an offer and reach your Sanjivani
              Farm customers.
            </p>
          </div>
        </section>

        <div className="admin-marketing-grid">
          <section className="admin-panel admin-campaign-panel">
            <div className="admin-panel-header">
              <div>
                <span className="admin-section-kicker">
                  NEW CAMPAIGN
                </span>

                <h2>Create an Offer</h2>

                <p className="admin-panel-description">
                  Prepare your message, add a poster, and
                  broadcast it to your customer base.
                </p>
              </div>
            </div>

            <form
              className="admin-form campaign-form"
              onSubmit={openBroadcastConfirmation}
            >
              <label>
                Offer Title
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(event) =>
                    setOfferTitle(event.target.value)
                  }
                  placeholder="e.g. Weekend Fresh Milk Offer"
                  maxLength={100}
                />

                <span className="admin-input-hint">
                  {offerTitle.length}/100
                </span>
              </label>

              <label>
                Offer Message
                <textarea
                  value={offerText}
                  onChange={(event) =>
                    setOfferText(event.target.value)
                  }
                  placeholder="Write the offer details your customers should receive..."
                  rows={7}
                  maxLength={1000}
                />

                <span className="admin-input-hint">
                  {offerText.length}/1000
                </span>
              </label>

              <div className="admin-upload-box">
                {!imagePreview ? (
                  <label className="admin-upload-label">
                    <div className="admin-upload-icon">
                      ↑
                    </div>

                    <strong>
                      Add offer poster
                    </strong>

                    <span>
                      JPG, PNG or WEBP · Maximum 5 MB
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                ) : (
                  <div className="admin-upload-preview">
                    <img
                      src={imagePreview}
                      alt="Offer preview"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                    >
                      Remove poster
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-channel-section">
                <span className="admin-field-label">
                  DELIVERY CHANNELS
                </span>

                <div className="admin-channel-grid">
                  <div className="admin-channel pending">
                    <div className="admin-channel-icon">
                      WA
                    </div>

                    <div>
                      <strong>WhatsApp</strong>

                      <span>
                        Setup Pending
                      </span>
                    </div>

                    <button 
                      className="admin-channel-setup-btn"
                      type="button"
                      onClick={() => showNotification("info", "Please ask the client to provide their Meta Business account details to connect WhatsApp.")}
                    >
                      Connect
                    </button>
                  </div>

                  <div className="admin-channel active">
                    <div className="admin-channel-icon email">
                      @
                    </div>

                    <div>
                      <strong>Email</strong>

                      <span>
                        Active
                      </span>
                    </div>

                    <div className="admin-channel-check">
                      ✓
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-recipient-box">
                <div className="admin-recipient-icon">
                  ♙
                </div>

                <div>
                  <strong>
                    Customer broadcast
                  </strong>

                  <span>
                    The backend broadcast service will
                    process the available customer
                    records.
                  </span>
                </div>

                <div className="admin-recipient-count">
                  {registeredUsers.length}
                </div>
              </div>

              {broadcastStatus && (
                <div
                  className={`admin-broadcast-status ${broadcastStatus.type}`}
                >
                  {broadcastStatus.type === "loading" ? (
                    <div className="admin-spinner small" />
                  ) : (
                    <span>
                      {broadcastStatus.type ===
                      "success"
                        ? "✓"
                        : broadcastStatus.type ===
                          "warning"
                        ? "!"
                        : "×"}
                    </span>
                  )}

                  <p>
                    {broadcastStatus.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="admin-primary-button full campaign-send-button"
                disabled={broadcastLoading}
              >
                {broadcastLoading ? (
                  <>
                    <div className="admin-spinner small white" />
                    Sending Offer...
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Review & Broadcast Offer
                  </>
                )}
              </button>
            </form>
          </section>

          <div className="admin-marketing-side">
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <span className="admin-section-kicker">
                    LIVE PREVIEW
                  </span>

                  <h2>Customer View</h2>
                </div>
              </div>

              <div className="admin-message-preview">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Campaign poster preview"
                  />
                )}

                <div className="admin-preview-body">
                  <span className="admin-preview-label">
                    SANJIVANI FARM
                  </span>

                  <h3>
                    {offerTitle ||
                      "Your offer title appears here"}
                  </h3>

                  <p>
                    {offerText ||
                      "Your offer message will be displayed here. Add your campaign details to preview the customer experience."}
                  </p>

                  <div className="admin-preview-footer">
                    <span>
                      Fresh from our farm
                    </span>

                    <span>✦</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-panel admin-marketing-info">
              <span className="admin-section-kicker">
                IMPORTANT
              </span>

              <h2>
                Broadcast responsibly
              </h2>

              <p>
                Only send relevant offers to customers
                who have opted into the applicable
                communication channel.
              </p>

              <div className="admin-info-list">
                <div>
                  <span>01</span>
                  <p>
                    Keep offers clear and concise.
                  </p>
                </div>

                <div>
                  <span>02</span>
                  <p>
                    Use a strong, relevant poster.
                  </p>
                </div>

                <div>
                  <span>03</span>
                  <p>
                    Verify the audience before
                    broadcasting.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }

  function renderActivePage() {
    switch (activeTab) {
      case "orders":
        return renderOrders();

      case "customers":
        return renderCustomers();

      case "subscriptions":
        return renderSubscriptions();

      case "inventory":
        return renderInventory();

      case "marketing":
        return renderMarketing();

      case "overview":
      default:
        return renderOverview();
    }
  }

  return (
    <div className="admin-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-shell {
          min-height: 100vh;
          background: #f6f7f4;
          color: #172018;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .admin-layout {
          min-height: 100vh;
          display: flex;
        }

        .admin-sidebar {
          width: 250px;
          flex-shrink: 0;
          background: #101712;
          color: #fff;
          min-height: 100vh;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
        }

        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 10px 28px;
        }

        .admin-brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: #dfead8;
          color: #162119;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 18px;
        }

        .admin-brand-text {
          display: flex;
          flex-direction: column;
        }

        .admin-brand-text strong {
          font-size: 15px;
          letter-spacing: .03em;
        }

        .admin-brand-text span {
          font-size: 10px;
          color: #8f9b91;
          margin-top: 3px;
          letter-spacing: .14em;
        }

        .admin-nav-label {
          color: #69746b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
          padding: 12px 12px 9px;
        }

        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-nav-button {
          border: 0;
          background: transparent;
          color: #aeb7b0;
          padding: 12px 12px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          transition: .2s ease;
        }

        .admin-nav-button:hover {
          background: #19211b;
          color: #fff;
        }

        .admin-nav-button.active {
          background: #dfead8;
          color: #152019;
        }

        .admin-nav-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .admin-sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #252e28;
          padding-top: 18px;
        }

        .admin-sidebar-card {
          background: #18201a;
          border: 1px solid #29332c;
          border-radius: 14px;
          padding: 14px;
        }

        .admin-sidebar-card span {
          color: #8e9a91;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .admin-sidebar-card strong {
          display: block;
          margin-top: 5px;
          font-size: 12px;
        }

        .admin-main {
          flex: 1;
          min-width: 0;
        }

        .admin-topbar {
          height: 72px;
          padding: 0 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,.82);
          border-bottom: 1px solid #e7ebe5;
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .admin-breadcrumb {
          font-size: 12px;
          color: #7d877e;
        }

        .admin-breadcrumb strong {
          color: #1c251e;
        }

        .admin-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-top-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: #69756d;
        }

        .admin-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5b8b58;
          display: inline-block;
        }

        .admin-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #172019;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-mobile-menu {
          display: none;
          border: 0;
          background: transparent;
          font-size: 22px;
          cursor: pointer;
        }

        .admin-content {
          max-width: 1500px;
          margin: 0 auto;
          padding: 38px 34px 60px;
        }

        .admin-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 30px;
        }

        .admin-page-heading.compact {
          margin-bottom: 26px;
        }

        .admin-eyebrow,
        .admin-section-kicker {
          display: block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
          color: #778278;
        }

        .admin-page-heading h1 {
          margin: 8px 0 7px;
          font-size: clamp(28px, 3vw, 40px);
          line-height: 1.05;
          letter-spacing: -.04em;
          color: #142017;
        }

        .admin-page-heading p {
          margin: 0;
          color: #788279;
          font-size: 14px;
        }

        .admin-primary-button,
        .admin-secondary-button,
        .admin-dark-button {
          border: 0;
          border-radius: 11px;
          padding: 12px 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          transition: .2s ease;
        }

        .admin-primary-button {
          background: #172019;
          color: #fff;
          box-shadow: 0 8px 22px rgba(23,32,25,.13);
        }

        .admin-primary-button:hover {
          transform: translateY(-1px);
          background: #27352a;
        }

        .admin-primary-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .admin-primary-button.full {
          width: 100%;
        }

        .admin-secondary-button {
          background: #fff;
          border: 1px solid #dde3dc;
          color: #253028;
        }

        .admin-secondary-button:hover {
          border-color: #aeb9af;
        }

        .admin-dark-button {
          background: #172019;
          color: #fff;
        }

        .admin-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .admin-metrics-grid.small {
          margin-bottom: 20px;
        }

        .admin-metric-card {
          background: #fff;
          border: 1px solid #e6eae4;
          border-radius: 16px;
          padding: 19px;
          min-height: 158px;
          box-shadow: 0 7px 24px rgba(28,42,31,.035);
        }

        .admin-metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .admin-metric-icon {
          width: 37px;
          height: 37px;
          border-radius: 11px;
          background: #f0f4ed;
          color: #314034;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
        }

        .admin-metric-trend {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .1em;
          font-weight: 800;
        }

        .admin-metric-trend.positive {
          color: #5b785a;
        }

        .admin-metric-trend.neutral {
          color: #8a938c;
        }

        .admin-metric-label {
          color: #788179;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .admin-metric-value {
          font-size: 27px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -.04em;
          color: #172019;
        }

        .admin-metric-description {
          color: #a0a8a1;
          font-size: 10px;
          margin-top: 7px;
        }

        .admin-overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(300px, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .admin-panel {
          background: #fff;
          border: 1px solid #e6eae4;
          border-radius: 17px;
          box-shadow: 0 7px 24px rgba(28,42,31,.035);
          overflow: hidden;
        }

        .admin-large-panel {
          min-width: 0;
        }

        .admin-panel-header {
          padding: 21px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .admin-panel-header h2 {
          margin: 5px 0 0;
          font-size: 17px;
          letter-spacing: -.02em;
          color: #172019;
        }

        .admin-panel-description {
          margin: 8px 0 0;
          color: #7d867f;
          font-size: 12px;
          line-height: 1.6;
          max-width: 580px;
        }

        .admin-text-button {
          background: transparent;
          border: 0;
          color: #546858;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-icon-button {
          width: 31px;
          height: 31px;
          border-radius: 9px;
          background: #f1f4ef;
          border: 0;
          cursor: pointer;
        }

        .admin-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }

        .admin-table th {
          text-align: left;
          padding: 11px 22px;
          background: #fafbf9;
          border-top: 1px solid #edf0eb;
          border-bottom: 1px solid #edf0eb;
          color: #8a938c;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 800;
        }

        .admin-table td {
          padding: 15px 22px;
          border-bottom: 1px solid #eef1ed;
          color: #3e4941;
          font-size: 12px;
          vertical-align: middle;
        }

        .admin-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .admin-table tbody tr:hover {
          background: #fbfcfa;
        }

        .admin-muted-cell {
          color: #89928b !important;
        }

        .admin-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 100px;
          font-size: 9px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .admin-status-badge.success {
          background: #edf6eb;
          color: #527450;
        }

        .admin-status-badge.warning {
          background: #fbf4df;
          color: #8b6d2d;
        }

        .admin-status-badge.danger {
          background: #fbedeb;
          color: #a15d55;
        }

        .admin-status-badge.neutral {
          background: #f0f2ef;
          color: #6f7871;
        }

        .admin-stock-summary {
          padding: 2px 22px 18px;
        }

        .admin-stock-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 0;
          border-bottom: 1px solid #edf0eb;
          font-size: 12px;
        }

        .admin-stock-row:last-child {
          border-bottom: 0;
        }

        .admin-stock-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #667067;
        }

        .admin-stock-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .admin-stock-dot.green {
          background: #6f9469;
        }

        .admin-stock-dot.orange {
          background: #c49a4a;
        }

        .admin-stock-dot.red {
          background: #bb6c65;
        }

        .admin-quick-actions {
          padding: 0 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .admin-quick-actions button {
          width: 100%;
          text-align: left;
          padding: 11px 13px;
          border: 1px solid #e6eae4;
          background: #fafbf9;
          border-radius: 9px;
          color: #475249;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-quick-actions button:hover {
          background: #f1f4ef;
        }

        .admin-highlight-panel {
          padding: 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 180px;
          background: #e9efe4;
          border-color: #dce5d7;
        }

        .admin-highlight-content h2 {
          margin: 7px 0 7px;
          font-size: 23px;
          letter-spacing: -.03em;
        }

        .admin-highlight-content p {
          margin: 0 0 18px;
          max-width: 600px;
          color: #647064;
          font-size: 12px;
          line-height: 1.7;
        }

        .admin-highlight-art {
          width: 115px;
          height: 115px;
          border-radius: 50%;
          background: rgba(255,255,255,.52);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 45px;
          color: #63745e;
          margin-right: 25px;
        }

        .admin-panel-toolbar {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #edf0eb;
        }

        .admin-result-count {
          color: #788179;
          font-size: 11px;
          font-weight: 700;
        }

        .admin-search {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 36px;
          min-width: 230px;
          border: 1px solid #e0e5df;
          border-radius: 9px;
          padding: 0 11px;
          background: #fff;
        }

        .admin-search span {
          color: #8b958d;
        }

        .admin-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #243027;
          font-size: 11px;
        }

        .admin-loading {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #788179;
          font-size: 12px;
        }

        .admin-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #dce3da;
          border-top-color: #27352a;
          border-radius: 50%;
          animation: adminSpin .7s linear infinite;
        }

        .admin-spinner.small {
          width: 13px;
          height: 13px;
        }

        .admin-spinner.white {
          border-color: rgba(255,255,255,.3);
          border-top-color: #fff;
        }

        @keyframes adminSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .admin-empty-state {
          min-height: 220px;
          padding: 35px 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .admin-empty-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: #f0f4ed;
          color: #71806f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 12px;
        }

        .admin-empty-state h3 {
          margin: 0 0 6px;
          font-size: 14px;
        }

        .admin-empty-state p {
          margin: 0;
          max-width: 400px;
          color: #8a938c;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-customer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 20px;
        }

        .admin-customer-card {
          border: 1px solid #e7ebe5;
          border-radius: 13px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .admin-customer-avatar {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #eaf0e6;
          color: #4f654d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
        }

        .admin-customer-info {
          min-width: 0;
          flex: 1;
        }

        .admin-customer-info h3 {
          margin: 0 0 4px;
          font-size: 12px;
        }

        .admin-customer-info p,
        .admin-customer-info span {
          display: block;
          margin: 0;
          color: #879087;
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-customer-info span {
          margin-top: 3px;
        }

        .admin-customer-status {
          font-size: 9px;
          color: #748076;
          white-space: nowrap;
        }

        .admin-customer-status .admin-live-dot {
          margin-right: 4px;
        }

        .admin-two-column {
          display: grid;
          grid-template-columns: minmax(290px, .75fr) minmax(0, 1.5fr);
          gap: 20px;
        }

        .admin-form {
          padding: 0 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .admin-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #576158;
          font-size: 10px;
          font-weight: 800;
        }

        .admin-form input,
        .admin-form textarea {
          width: 100%;
          border: 1px solid #dde3dc;
          border-radius: 9px;
          background: #fbfcfa;
          color: #263128;
          padding: 11px 12px;
          font-family: inherit;
          font-size: 12px;
          outline: 0;
          transition: .2s ease;
        }

        .admin-form input:focus,
        .admin-form textarea:focus {
          border-color: #9ba99c;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(105,127,103,.08);
        }

        .admin-form textarea {
          resize: vertical;
          min-height: 130px;
          line-height: 1.6;
        }

        .admin-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .admin-inventory-list {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-inventory-item {
          display: grid;
          grid-template-columns: 39px minmax(120px, 1fr) 60px 70px 88px 30px;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border: 1px solid #e8ece7;
          border-radius: 11px;
        }

        .admin-product-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eff3ec;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #536451;
        }

        .admin-product-details {
          min-width: 0;
        }

        .admin-product-details h3 {
          margin: 0 0 4px;
          font-size: 11px;
        }

        .admin-product-details p {
          margin: 0;
          color: #8b948d;
          font-size: 9px;
        }

        .admin-product-stock {
          text-align: center;
        }

        .admin-product-stock strong {
          display: block;
          font-size: 12px;
        }

        .admin-product-stock span {
          display: block;
          font-size: 8px;
          color: #969e97;
        }

        .admin-product-price {
          font-size: 11px;
          font-weight: 800;
        }

        .admin-stock-button {
          border: 0;
          border-radius: 7px;
          padding: 7px 6px;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-stock-button.available {
          background: #edf5eb;
          color: #587354;
        }

        .admin-stock-button.unavailable {
          background: #f9ecea;
          color: #a05c55;
        }

        .admin-delete-button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 7px;
          background: #f8efed;
          color: #a86a61;
          cursor: pointer;
          font-size: 15px;
        }

        .admin-marketing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(310px, .75fr);
          gap: 20px;
          align-items: start;
        }

        .campaign-form {
          padding-top: 2px;
        }

        .admin-input-hint {
          color: #9ca49d;
          font-size: 8px;
          font-weight: 500;
          text-align: right;
          margin-top: -4px;
        }

        .admin-upload-box {
          border: 1px dashed #cfd7cd;
          border-radius: 13px;
          overflow: hidden;
          background: #fafbf9;
        }

        .admin-upload-label {
          min-height: 145px;
          display: flex !important;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          padding: 20px;
        }

        .admin-upload-label input {
          display: none;
        }

        .admin-upload-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #edf2ea;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 9px;
          font-size: 16px;
          color: #60705e;
        }

        .admin-upload-label strong {
          font-size: 11px;
          color: #455046;
        }

        .admin-upload-label span {
          font-size: 9px;
          color: #949c95;
          margin-top: 4px;
        }

        .admin-upload-preview {
          position: relative;
          min-height: 180px;
        }

        .admin-upload-preview img {
          display: block;
          width: 100%;
          max-height: 270px;
          object-fit: cover;
        }

        .admin-upload-preview button {
          position: absolute;
          top: 10px;
          right: 10px;
          border: 0;
          border-radius: 8px;
          padding: 7px 10px;
          background: rgba(18,24,19,.78);
          color: #fff;
          font-size: 9px;
          cursor: pointer;
        }

        .admin-channel-section {
          padding-top: 3px;
        }

        .admin-field-label {
          display: block;
          color: #68736b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .12em;
          margin-bottom: 9px;
        }

        .admin-channel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .admin-channel {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border: 1px solid #e2e7e0;
          border-radius: 10px;
        }

        .admin-channel.active {
          background: #f8fbf6;
          border-color: #d8e2d3;
        }

        .admin-channel.pending {
          background: #fdfaf3;
          border-color: #ebe3d3;
        }

        .admin-channel-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #dcebd9;
          color: #496247;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
        }

        .admin-channel-icon.email {
          background: #edf0ea;
          color: #5d685e;
          font-size: 13px;
        }

        .admin-channel strong {
          display: block;
          font-size: 9px;
          color: #4a554c;
        }

        .admin-channel span {
          display: block;
          margin-top: 2px;
          font-size: 7px;
          color: #929a93;
        }

        .admin-channel-check {
          margin-left: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #536c50;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
        }

        .admin-channel-setup-btn {
          margin-left: auto;
          border: 0;
          background: #e5ebe2;
          color: #556b52;
          font-size: 8px;
          font-weight: 800;
          padding: 5px 8px;
          border-radius: 6px;
          cursor: pointer;
        }

        .admin-channel-setup-btn:hover {
          background: #d8e2d3;
        }

        .admin-recipient-box {
          border: 1px solid #e4e9e2;
          background: #fafbf9;
          border-radius: 11px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-recipient-icon {
          width: 33px;
          height: 33px;
          border-radius: 9px;
          background: #e9f0e5;
          color: #5c7058;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-recipient-box strong {
          display: block;
          font-size: 10px;
        }

        .admin-recipient-box span {
          display: block;
          margin-top: 3px;
          color: #8b948c;
          font-size: 8px;
          line-height: 1.4;
        }

        .admin-recipient-box > div:nth-child(2) {
          flex: 1;
        }

        .admin-recipient-count {
          font-size: 18px;
          font-weight: 900;
          color: #334133;
        }

        .admin-broadcast-status {
          display: flex;
          align-items: center;
          gap: 9px;
          border-radius: 10px;
          padding: 11px 12px;
        }

        .admin-broadcast-status p {
          margin: 0;
          font-size: 10px;
          line-height: 1.5;
        }

        .admin-broadcast-status.success {
          background: #edf6eb;
          color: #567653;
        }

        .admin-broadcast-status.warning {
          background: #fbf5e4;
          color: #8b702f;
        }

        .admin-broadcast-status.error {
          background: #fbedeb;
          color: #a05d55;
        }

        .admin-broadcast-status.loading {
          background: #f0f3ef;
          color: #677168;
        }

        .campaign-send-button {
          min-height: 46px;
        }

        .admin-message-preview {
          margin: 0 20px 20px;
          border: 1px solid #e1e6df;
          border-radius: 15px;
          overflow: hidden;
          background: #f8faf7;
        }

        .admin-message-preview > img {
          width: 100%;
          height: 180px;
          display: block;
          object-fit: cover;
        }

        .admin-preview-body {
          padding: 18px;
        }

        .admin-preview-label {
          color: #789073;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .admin-preview-body h3 {
          margin: 7px 0 8px;
          font-size: 18px;
          line-height: 1.2;
          letter-spacing: -.025em;
        }

        .admin-preview-body p {
          margin: 0;
          color: #707b72;
          font-size: 11px;
          line-height: 1.7;
          white-space: pre-line;
        }

        .admin-preview-footer {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e3e8e1;
          display: flex;
          justify-content: space-between;
          color: #88938a;
          font-size: 8px;
        }

        .admin-marketing-info {
          padding-bottom: 20px;
        }

        .admin-marketing-info > .admin-section-kicker,
        .admin-marketing-info > h2,
        .admin-marketing-info > p {
          margin-left: 20px;
          margin-right: 20px;
        }

        .admin-marketing-info h2 {
          margin-top: 7px;
          margin-bottom: 7px;
          font-size: 17px;
        }

        .admin-marketing-info > p {
          color: #7d867e;
          font-size: 10px;
          line-height: 1.7;
        }

        .admin-info-list {
          margin-top: 18px;
          padding: 0 20px;
        }

        .admin-info-list > div {
          display: flex;
          gap: 10px;
          padding: 10px 0;
          border-top: 1px solid #edf0eb;
        }

        .admin-info-list span {
          font-size: 9px;
          font-weight: 800;
          color: #8d998e;
        }

        .admin-info-list p {
          margin: 0;
          color: #657067;
          font-size: 10px;
        }

        .compact-search {
          min-width: 150px;
        }

        .admin-notification {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 200;
          max-width: 380px;
          background: #172019;
          color: #fff;
          padding: 13px 15px;
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,.2);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }

        .admin-notification.success {
          background: #29402d;
        }

        .admin-notification.warning {
          background: #69562c;
        }

        .admin-notification.error {
          background: #633832;
        }

        .admin-notification-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.13);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 150;
          background: rgba(9,14,10,.58);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .admin-modal {
          width: min(460px, 100%);
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 25px 80px rgba(0,0,0,.25);
          overflow: hidden;
        }

        .admin-modal-header {
          padding: 23px 23px 10px;
        }

        .admin-modal-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #e9f0e5;
          color: #587053;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 13px;
        }

        .admin-modal-header h2 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -.03em;
        }

        .admin-modal-body {
          padding: 0 23px 20px;
        }

        .admin-modal-body p {
          margin: 8px 0 0;
          color: #768078;
          font-size: 11px;
          line-height: 1.7;
        }

        .admin-confirm-preview {
          margin-top: 15px;
          background: #f6f8f5;
          border: 1px solid #e5eae3;
          border-radius: 11px;
          padding: 12px;
        }

        .admin-confirm-preview strong {
          display: block;
          font-size: 11px;
        }

        .admin-confirm-preview p {
          margin: 4px 0 0;
          font-size: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .admin-modal-actions {
          padding: 15px 23px 21px;
          display: flex;
          gap: 9px;
          justify-content: flex-end;
          border-top: 1px solid #edf0eb;
        }

        .admin-modal-cancel {
          border: 1px solid #dde3dc;
          background: #fff;
          color: #556057;
          border-radius: 9px;
          padding: 10px 15px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-modal-send {
          border: 0;
          background: #172019;
          color: #fff;
          border-radius: 9px;
          padding: 10px 15px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-result-modal {
          text-align: center;
          padding: 28px 25px 24px;
        }

        .admin-result-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #eaf2e7;
          color: #567653;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          font-size: 25px;
          font-weight: 900;
        }

        .admin-result-modal h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -.03em;
        }

        .admin-result-modal > p {
          margin: 8px auto 20px;
          color: #7a837c;
          font-size: 11px;
          line-height: 1.6;
          max-width: 350px;
        }

        .admin-result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          margin-bottom: 20px;
        }

        .admin-result-stat {
          background: #f7f9f6;
          border: 1px solid #e7ebe5;
          border-radius: 10px;
          padding: 11px 5px;
        }

        .admin-result-stat strong {
          display: block;
          font-size: 17px;
        }

        .admin-result-stat span {
          display: block;
          color: #89918a;
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-top: 3px;
        }

        @media (max-width: 1100px) {
          .admin-sidebar {
            width: 220px;
          }

          .admin-content {
            padding-left: 24px;
            padding-right: 24px;
          }

          .admin-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-overview-grid,
          .admin-marketing-grid,
          .admin-two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .admin-sidebar {
            position: fixed;
            left: -270px;
            width: 250px;
            transition: left .25s ease;
          }

          .admin-sidebar.open {
            left: 0;
          }

          .admin-mobile-menu {
            display: block;
          }

          .admin-topbar {
            padding: 0 18px;
          }

          .admin-content {
            padding: 25px 16px 45px;
          }

          .admin-page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-page-heading .admin-primary-button,
          .admin-page-heading .admin-secondary-button {
            width: 100%;
          }

          .admin-metrics-grid {
            grid-template-columns: 1fr 1fr;
          }

          .admin-customer-grid {
            grid-template-columns: 1fr;
          }

          .admin-panel-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-search {
            width: 100%;
            min-width: 0;
          }

          .admin-highlight-art {
            display: none;
          }

          .admin-channel-grid {
            grid-template-columns: 1fr;
          }

          .admin-inventory-item {
            grid-template-columns: 39px 1fr 30px;
          }

          .admin-product-stock,
          .admin-product-price,
          .admin-stock-button {
            display: none;
          }

          .admin-delete-button {
            grid-column: 3;
          }
        }

        @media (max-width: 500px) {
          .admin-top-status {
            display: none;
          }

          .admin-metrics-grid {
            grid-template-columns: 1fr;
          }

          .admin-form-row {
            grid-template-columns: 1fr;
          }

          .admin-content {
            padding-left: 12px;
            padding-right: 12px;
          }

          .admin-page-heading h1 {
            font-size: 30px;
          }

          .admin-panel-header {
            padding: 18px;
          }

          .admin-form {
            padding-left: 18px;
            padding-right: 18px;
          }

          .admin-table th,
          .admin-table td {
            padding-left: 14px;
            padding-right: 14px;
          }

          .admin-result-stats {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .admin-notification {
            left: 12px;
            right: 12px;
            bottom: 12px;
            max-width: none;
          }
        }
      `}</style>

      <div className="admin-layout">
        <aside
          className={`admin-sidebar ${
            sidebarOpen ? "open" : ""
          }`}
        >
          <div className="admin-brand">
            <div className="admin-brand-mark">
              S
            </div>

            <div className="admin-brand-text">
              <strong>Sanjivani</strong>
              <span>Farm Admin</span>
            </div>
          </div>

          <div className="admin-nav-label">
            MANAGEMENT
          </div>

          <nav className="admin-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-button ${
                  activeTab === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  changeTab(item.id)
                }
              >
                <span className="admin-nav-icon">
                  {item.icon}
                </span>

                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-bottom">
            <div className="admin-sidebar-card">
              <span>Store status</span>

              <strong>
                ● Online & operational
              </strong>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <button
                className="admin-mobile-menu"
                onClick={() =>
                  setSidebarOpen(
                    (current) => !current
                  )
                }
              >
                ☰
              </button>

              <div className="admin-breadcrumb">
                Sanjivani Farm /{" "}
                <strong>
                  {
                    NAV_ITEMS.find(
                      (item) =>
                        item.id === activeTab
                    )?.label
                  }
                </strong>
              </div>
            </div>

            <div className="admin-top-actions">
              <div className="admin-top-status">
                <span className="admin-live-dot" />
                Store online
              </div>

              <div className="admin-avatar">
                A
              </div>
            </div>
          </header>

          <div className="admin-content">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {notification && (
        <div
          className={`admin-notification ${notification.type}`}
        >
          <div className="admin-notification-icon">
            {notification.type === "success"
              ? "✓"
              : notification.type === "warning"
              ? "!"
              : "×"}
          </div>

          <span>{notification.message}</span>
        </div>
      )}

      {showBroadcastConfirm && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowBroadcastConfirm(false);
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div className="admin-modal-icon">
                ✦
              </div>

              <h2>
                Broadcast this offer?
              </h2>
            </div>

            <div className="admin-modal-body">
              <p>
                You are about to send this campaign
                through the currently configured
                broadcast services.
              </p>

              <div className="admin-confirm-preview">
                <strong>
                  {offerTitle ||
                    "Sanjivani Farm Offer"}
                </strong>

                <p>
                  {offerText ||
                    "Poster-only offer"}
                </p>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                className="admin-modal-cancel"
                onClick={() =>
                  setShowBroadcastConfirm(false)
                }
              >
                Cancel
              </button>

              <button
                className="admin-modal-send"
                onClick={sendBroadcast}
              >
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {broadcastResult && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-result-modal">
              <div className="admin-result-icon">
                {broadcastResult.emailSentCount > 0 || broadcastResult.sentCount > 0
                  ? "✓"
                  : "!"}
              </div>

              <h2>
                {broadcastResult.emailSentCount > 0 || broadcastResult.sentCount > 0
                  ? "Offer broadcast completed"
                  : "Broadcast completed"}
              </h2>

              <p>
                {broadcastResult.message}
              </p>

              <div className="admin-result-stats">
                <div className="admin-result-stat">
                  <strong>
                    {broadcastResult.emailSentCount}
                  </strong>

                  <span>
                    Emails Sent
                  </span>
                </div>

                <div className="admin-result-stat">
                  <strong>
                    {broadcastResult.sentCount}
                  </strong>

                  <span>
                    WhatsApp Sent
                  </span>
                </div>

                <div className="admin-result-stat">
                  <strong>
                    {broadcastResult.totalRecipients}
                  </strong>

                  <span>
                    Customers
                  </span>
                </div>
              </div>

              <button
                className="admin-primary-button full"
                onClick={() =>
                  setBroadcastResult(null)
                }
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}