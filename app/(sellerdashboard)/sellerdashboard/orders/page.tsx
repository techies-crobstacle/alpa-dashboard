"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Loader2, RefreshCcw, X, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CreditCard, MapPin, Calendar, ClipboardList, DollarSign, Hash, Download, AlertTriangle, TrendingUp, ShoppingCart, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

import { toast } from "sonner";
import {
  getAllowedTransitions,
  getRequiredFields,
  validateStatusUpdate,
  getStatusLabel,
  getStatusBadgeVariant,
  isTerminalStatus,
} from "@/lib/orderStatusRules";

const BASE_URL = "https://alpa-be.onrender.com";

// --- API HELPERS ---
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  
  if (!token) {
    console.warn("No authentication token found");
    toast.error("Please log in again to access orders");
    return {
      "Content-Type": "application/json"
    };
  }
  
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

type OrderItem = {
  id: string;
  orderId: string;
  subOrderId?: string | null;
  productId: string;
  quantity: number;
  price: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    images: string[];
    price: string;
    sellerId: string;
  };
};

type Order = {
  id: string;
  parentOrderId?: string | null;
  type: "DIRECT" | "SUB_ORDER";
  status: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  statusReason?: string | null;
  subtotal: string | number;
  items: OrderItem[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    addressLine: string;
    orderSummary: {
      subtotal: string;
      gstAmount: string;
      grandTotal: string;
      gstDetails: any;
      gstInclusive: boolean;
      shippingCost: string;
      gstPercentage: string;
      subtotalExGST: string;
      shippingMethod: any;
    };
  };
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  shippingPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Status Update Modal ──────────────────────────────────────────────────────

interface StatusModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

function StatusUpdateModal({ order, onClose, onSuccess }: StatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");

  if (!order) return null;
  const allowedTransitions = getAllowedTransitions(order.status);
  const requiredFields = getRequiredFields(selectedStatus);
  const needsTracking = requiredFields.includes("trackingNumber");
  const needsReason = requiredFields.includes("reason");
  const terminal = isTerminalStatus(order.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setApiError("");
    const payload: Record<string, string> = {
      status: selectedStatus,
      ...(trackingNumber && { trackingNumber }),
      ...(estimatedDelivery && { estimatedDelivery }),
      ...(reason && { reason }),
      ...(notes && { notes }),
    };
    const { valid, errors } = validateStatusUpdate(selectedStatus, payload);
    if (!valid) { setValidationErrors(errors); return; }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
      const authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${BASE_URL}/api/seller/orders/update-status/${order.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      
      // Handle new response structure with subOrder field
      const responseData = await res.json();
      const updatedSubOrder = responseData.subOrder || responseData.order; // Backward compatibility
      
      // If shipping, persist tracking info via the dedicated tracking endpoint
      if (selectedStatus === "SHIPPED" && trackingNumber && estimatedDelivery) {
        await fetch(`${BASE_URL}/api/seller/orders/tracking/${order.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ trackingNumber, estimatedDelivery }),
        });
      }
      
      // Show success message with updated status
      const statusLabel = getStatusLabel(selectedStatus);
      if (updatedSubOrder?.trackingNumber && selectedStatus === "SHIPPED") {
        toast.success(`Order updated to ${statusLabel}. Tracking: ${updatedSubOrder.trackingNumber}`);
      } else {
        toast.success(`Order updated to ${statusLabel}`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to update status";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Update Order Status</CardTitle>
              <CardDescription className="mt-0.5">
                Order #{typeof order.id === "string" ? order.id.slice(-6).toUpperCase() : order.id}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">Current Status</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>{getStatusLabel(order.status)}</Badge>
          </div>
          {terminal ? (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">This order is in a terminal status and cannot be updated further.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Status <span className="text-destructive">*</span></Label>
                <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setValidationErrors([]); }}>
                  <SelectTrigger><SelectValue placeholder="— Select new status —" /></SelectTrigger>
                  <SelectContent>
                    {allowedTransitions.map((s) => (
                      <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsTracking && (
                <>
                  <div className="space-y-1.5">
                    <Label>Tracking Number <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. TRK12345" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estimated Delivery Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                </>
              )}
              {needsReason && (
                <div className="space-y-1.5">
                  <Label>Reason <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="Provide a reason for this status change..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="resize-none" />
                </div>
              )}
              {selectedStatus && (
                <div className="space-y-1.5">
                  <Label>Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Textarea placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none" />
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive flex items-start gap-1.5"><span>•</span><span>{err}</span></p>
                  ))}
                </div>
              )}
              {apiError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{apiError}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={!selectedStatus || loading}>
                  {loading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Updating...</> : "Update Status"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrdersPage() {
    // Only declare expandedOrderId once at the top of the component
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState({ trackingNumber: "", estimatedDelivery: "" });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const fmtDate = (val: any) => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== "ALL" && o.status.toUpperCase() !== filterStatus) return false;
    // Use local date string (YYYY-MM-DD) to avoid UTC/timezone drift
    const orderLocalDate = new Date(o.createdAt).toLocaleDateString("en-CA"); // "YYYY-MM-DD"
    if (filterDateFrom && orderLocalDate < filterDateFrom) return false;
    if (filterDateTo && orderLocalDate > filterDateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    setExpandedOrderId(null);
  };

  const getPaginationPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedOrderId(null);
  }, [filterDateFrom, filterDateTo, filterStatus]);

  // 1. GET Orders
  const fetchOrders = async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BASE_URL}/api/seller/orders`, { 
        headers: getAuthHeaders(),
        cache: 'no-cache' // Prevent caching issues
      });
      
      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = await res.text().catch(() => errorMessage);
        }

        // Handle specific error cases
        if (res.status === 401) {
          setError("Authentication failed. Please log in again.");
          toast.error("Authentication failed. Please log in again.");
          return;
        } else if (res.status === 403) {
          setError("Access denied. You don't have permission to view orders.");
          toast.error("Access denied. You don't have permission to view orders.");
          return;
        } else if (res.status >= 500) {
          if (errorMessage.includes('findMany')) {
            setError("Database connection issue. The server is experiencing problems.");
            toast.error("Database connection issue. Please try again later.");
          } else {
            setError(`Server error: ${errorMessage}`);
            toast.error("Server error. Please try again later.");
          }
          console.error(`Server error ${res.status}:`, errorMessage);
          return;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log("Orders data received:", data); // Debug log
      
      if (!data.success && data.message) {
        throw new Error(data.message);
      }
      
      setOrders(data.orders || []);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Unable to connect to server. Please check your connection.";
        toast.error("Unable to connect to server. Please check your connection.");
      } else if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('findMany')) {
          errorMessage = "Database connection issue. The server is experiencing problems.";
          toast.error("Database connection issue detected. Please contact support if this persists.");
        } else {
          toast.error(`Failed to load orders: ${errorMessage}`);
        }
      }
      
      setError(errorMessage);
      setOrders([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  // Retry function with exponential backoff
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      toast.info(`Retrying... (${retryCount + 1}/3)`);
      setTimeout(() => fetchOrders(true), 1000 * Math.pow(2, retryCount)); // Exponential backoff
    } else {
      toast.error("Max retries reached. Please contact support.");
    }
  };

  // 2. UPDATE Status — replaced by StatusUpdateModal

  // 3. ADD Tracking
  const submitTracking = async () => {
    if (!activeTrackingOrder) return;
    const { valid, errors } = validateStatusUpdate("SHIPPED", { trackingNumber: trackingData.trackingNumber, estimatedDelivery: trackingData.estimatedDelivery });
    if (!valid) { toast.error(errors[0]); return; }
    try {
      const res = await fetch(`${BASE_URL}/api/seller/orders/tracking/${activeTrackingOrder.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(trackingData),
      });
      if (!res.ok) throw new Error();
      toast.success("Tracking information updated");
      setActiveTrackingOrder(null);
      setTrackingData({ trackingNumber: "", estimatedDelivery: "" });
      fetchOrders();
    } catch {
      toast.error("Failed to update tracking");
    }
  };

  // 4. Download Invoice
  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoiceId(orderId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
      const response = await fetch(`${BASE_URL}/api/orders/invoice/${orderId}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download invoice");
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully.");
    } catch (err: any) {
      console.error('Download invoice error:', err);
      toast.error(err.message || "Failed to download invoice.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 text-center space-y-2">
              <Skeleton className="h-8 w-10 mx-auto" />
              <Skeleton className="h-5 w-20 mx-auto rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order card skeletons */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Card header row */}
            <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            {/* Card body */}
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-full rounded-md mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Error state
  if (error && !loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage customer purchases and shipping status.</p>
          </div>
        </div>

        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Unable to Load Orders</h3>
              <p className="text-muted-foreground max-w-md">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fetchOrders()} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              {retryCount > 0 && retryCount < 3 && (
                <Button variant="outline" onClick={handleRetry} disabled={loading}>
                  Auto Retry ({retryCount}/3)
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support with error code: DB_CONNECTION_ERROR
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Helper to render shipping address safely
  function renderOrderDetails(order: Order) {
    let addr: any = {};
    if (order.shippingAddress) {
      if (typeof order.shippingAddress === "string") {
        try { addr = JSON.parse(order.shippingAddress); } catch { addr = {}; }
      } else {
        addr = order.shippingAddress;
      }
    }
    const summary = addr.orderSummary || {};
    const addressFields = [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "street", label: "Street" },
      { key: "suburb", label: "Suburb" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zipCode", label: "ZIP Code" },
      { key: "zipcode", label: "Postcode" },
      { key: "postcode", label: "Postcode" },
      { key: "country", label: "Country" },
    ];
    const seenLabels = new Set<string>();
    const addressRows = addressFields.filter(({ key, label }) => {
      const val = addr[key];
      if (!val || seenLabels.has(label)) return false;
      seenLabels.add(label);
      return true;
    });
    const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
    const subtotal = summary.subtotal ?? summary.subTotal ?? "";
    const shipping = summary.shippingCost ?? summary.shipping ?? summary.shippingMethod?.price ?? "";
    const discount = summary.discount ?? "";
    const gst = summary.gst ?? summary.tax ?? "";
    const total = order.subtotal;

    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Order Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-medium">#{order.id.slice(-6).toUpperCase()}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><Badge variant="secondary">{order.status.toUpperCase()}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{order.type === "DIRECT" ? "Direct Order" : "Sub-order"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium">{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Status</span><span className="font-medium">{order.paymentStatus}</span></div>
            {order.trackingNumber && <div className="flex justify-between"><span className="text-muted-foreground">Tracking</span><span className="font-medium">{order.trackingNumber}</span></div>}
            {order.estimatedDelivery && <div className="flex justify-between"><span className="text-muted-foreground">Est. Delivery</span><span className="font-medium">{fmtDate(order.estimatedDelivery)}</span></div>}
            {order.parentOrderId && <div className="flex justify-between"><span className="text-muted-foreground">Parent Order</span><span className="font-medium">#{order.parentOrderId.slice(-6).toUpperCase()}</span></div>}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{order.customerName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{order.customerEmail}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{order.customerPhone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[60%]">{order.shippingAddressLine}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">City</span><span className="font-medium">{order.shippingCity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-medium">{order.shippingState}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Zip Code</span><span className="font-medium">{order.shippingZipCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-medium">{order.shippingCountry}</span></div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {subtotal !== "" && <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{subtotal}</span></div>}
            {shipping !== "" && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-medium">₹{typeof shipping === "object" ? JSON.stringify(shipping) : shipping}</span></div>}
            {discount !== "" && Number(discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium text-green-600">-₹{discount}</span></div>}
            {gst !== "" && <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span className="font-medium">₹{gst}</span></div>}
            <div className="border-t pt-2 flex justify-between font-bold text-base"><span>My Order Total</span><span>₹{total}</span></div>
            {order.items && order.items.length > 0 && (
              <div className="border-t pt-2 space-y-1">
                <p className="text-muted-foreground font-medium mb-1">Items</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs"><span className="truncate max-w-[60%]">{item.product.title} x{item.quantity}</span><span>₹{item.price}</span></div>
                ))}
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <Button
                variant="default"
                size="sm"
                disabled={downloadingInvoiceId === order.id}
                onClick={() => handleDownloadInvoice(order.id)}
                className="gap-2"
              >
                {downloadingInvoiceId === order.id ? (
                  <><Loader2 className="animate-spin h-4 w-4" />Downloading...</>
                ) : (
                  <><Download className="h-4 w-4" />Download Invoice</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- CSV Export Helpers ---
  const downloadCSV = (csvContent: string, filename: string) => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) { toast.error("No orders to export."); return; }
    const headers = [
      "Order ID", "Date", "Customer Name", "Customer Email", "Customer Phone",
      "Status", "Payment Method", "Payment Status", "Items Count",
      "Shipping Address", "City", "State", "ZIP", "Country",
      "Order Total (₹)",
    ];
    const rows = filteredOrders.map((o) => [
      o.id.slice(-6).toUpperCase(),
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      o.customerName || "",
      o.customerEmail || "",
      o.customerPhone || "",
      o.status.toUpperCase(),
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.shippingAddressLine || "",
      o.shippingCity || "",
      o.shippingState || "",
      o.shippingZipCode || "",
      o.shippingCountry || "",
      parseFloat(String(o.subtotal) || "0").toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCsvValue).join(",")).join("\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `orders-report-${date}.csv`);
    toast.success(`Exported ${filteredOrders.length} orders to CSV.`);
  };

  const handleExportTopProducts = () => {
    if (filteredOrders.length === 0) { toast.error("No orders to analyse."); return; }
    // Aggregate product sales across all orders
    const productMap = new Map<string, { title: string; productId: string; unitsSold: number; revenue: number }>();
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const key = item.productId;
        const existing = productMap.get(key);
        const itemRevenue = parseFloat(String(item.price) || "0") * item.quantity;
        if (existing) {
          existing.unitsSold += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          productMap.set(key, {
            title: item.product.title || "Unknown",
            productId: item.productId,
            unitsSold: item.quantity,
            revenue: itemRevenue,
          });
        }
      }
    }
    const sorted = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const headers = ["Rank", "Product ID", "Product Name", "Units Sold", "Total Revenue (₹)"];
    const rows = sorted.map((p, i) => [
      i + 1,
      p.productId.slice(-8).toUpperCase(),
      p.title,
      p.unitsSold,
      p.revenue.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCsvValue).join(",")).join("\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `top-products-by-sales-${date}.csv`);
    toast.success(`Exported ${sorted.length} products ranked by sales.`);
  };

  const hasActiveFilters = filterDateFrom !== "" || filterDateTo !== "" || filterStatus !== "ALL";

  // --- Overview statistics computed from filtered orders ---
  const totalGrossValue = filteredOrders.reduce((sum, o) => sum + parseFloat(String(o.subtotal) || "0"), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalGrossValue / filteredOrders.length : 0;
  const totalItemsSold = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0), 0);
  const statusCounts = filteredOrders.reduce<Record<string, number>>((acc, o) => {
    const s = o.status.toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusDisplayOrder = ["PENDING", "PROCESSING", "DELIVERED", "COMPLETED", "CANCELLED", "RETURNED", "REFUNDED"];
  const sortedStatusEntries = Object.entries(statusCounts)
    .filter(([s]) => statusDisplayOrder.includes(s))
    .sort(([a], [b]) => {
      const ai = statusDisplayOrder.indexOf(a);
      const bi = statusDisplayOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer purchases and shipping status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportOrders} disabled={filteredOrders.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
        </div>
      </div>


      {/* ── Order Overview ─────────────────────────────────────────── */}
      {filteredOrders.length > 0 && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold mt-1">{orders.length}</p>
                    {hasActiveFilters && <p className="text-xs text-muted-foreground mt-0.5">{filteredOrders.length} filtered</p>}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                    <p className="text-2xl font-bold mt-1">₹{avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                    <p className="text-2xl font-bold mt-1">{totalItemsSold}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          {sortedStatusEntries.length > 0 && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {sortedStatusEntries.map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <Badge variant={getStatusBadgeVariant(status.toLowerCase())} className="mt-1.5 text-xs">
                      {getStatusLabel(status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Filters ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Filter Orders</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">From Date</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9 text-sm w-[160px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">To Date</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9 text-sm w-[160px]" min={filterDateFrom || undefined} />
            </div>
            <div className="h-9 w-px bg-border self-end mb-0.5 hidden sm:block" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Order Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 text-sm w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {["PENDING","PROCESSING","CONFIRMED","SHIPPED","DELIVERED","COMPLETED","CANCELLED","RETURNED","REFUNDED"].map((s) => (
                    <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 ml-auto">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterStatus("ALL"); }}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              {orders.length > 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  <span className="font-semibold text-foreground">{filteredOrders.length}</span> {filteredOrders.length === 1 ? "result" : "results"}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      

      {orders.length === 0 && !error ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Package className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Orders Found</h3>
              <p className="text-muted-foreground">You haven't received any orders yet, or they might not be loading properly.</p>
            </div>
            <Button variant="outline" onClick={() => fetchOrders()} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Orders
            </Button>
          </div>
        </Card>
      ) : filteredOrders.length === 0 && hasActiveFilters ? (
        <Card className="p-10 text-center">
          <div className="flex flex-col items-center space-y-3">
            <Package className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold">No Orders Match Your Filters</h3>
              <p className="text-muted-foreground text-sm">Try adjusting the date range or status filter.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterStatus("ALL"); }}>
              <X className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
            </Button>
          </div>
        </Card>
      ) : filteredOrders.length > 0 ? (
        <div className="grid gap-4">{paginatedOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center gap-1"><ClipboardList className="h-4 w-4" /> Customer</p>
                    <p className="text-sm text-muted-foreground">{order.customerName || "Guest"}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="flex items-center gap-1">
                      <Hash className="h-3 w-3" /> {order.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {order.type === "DIRECT" ? "Direct" : "Sub-order"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">₹{order.subtotal}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                    <Eye className="h-4 w-4" />
                    {expandedOrderId === order.id ? "Hide" : "View"}
                    {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Items Summary */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Order Items</Label>
                    <div className="text-sm space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {item.product.images?.[0] && (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.title || "Product image"}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                              unoptimized
                            />
                          )}
                          <span>{item.product.title} <span className="text-muted-foreground">x {item.quantity}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Actions: Update Status */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Management</Label>
                    {isTerminalStatus(order.status) ? (
                      <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>Terminal — no further changes.</span>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setActiveStatusOrder(order)}>
                        <ClipboardList className="h-4 w-4" /> Update Status
                      </Button>
                    )}
                  </div>
                  {/* Actions: Tracking */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</Label>
                    {order.trackingNumber ? (
                       <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                          <p className="flex items-center gap-2 text-blue-700 font-medium">
                            <Truck className="h-4 w-4" /> {renderValue(order.trackingNumber)}
                          </p>
                          <p className="text-blue-600/80 text-xs mt-1">Est: {fmtDate(order.estimatedDelivery)}</p>
                       </div>
                    ) : !isTerminalStatus(order.status) ? (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTrackingOrder(order)}>
                        <Truck className="h-4 w-4" /> Add Tracking
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tracking info.</p>
                    )}
                  </div>
                </div>
                {expandedOrderId === order.id && renderOrderDetails(order)}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}</span>
              {"–"}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span>
              {" of "}
              <span className="font-medium text-foreground">{filteredOrders.length}</span>
              {" orders"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Per page:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPaginationPages().map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">&hellip;</span>
              ) : (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => handlePageChange(page as number)}>{page}</Button>
              )
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {activeStatusOrder && (
        <StatusUpdateModal
          order={activeStatusOrder}
          onClose={() => setActiveStatusOrder(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* Tracking Modal */}
      {activeTrackingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add Tracking Info</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setActiveTrackingOrder(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Enter details for Order #{activeTrackingOrder.id.slice(-6)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input 
                  placeholder="e.g. 25422565632" 
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData({...trackingData, trackingNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Date</Label>
                <Input 
                  placeholder="e.g. 23 December 2025" 
                  value={trackingData.estimatedDelivery}
                  onChange={(e) => setTrackingData({...trackingData, estimatedDelivery: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={submitTracking}>Save Tracking</Button>
                <Button variant="outline" className="flex-1" onClick={() => setActiveTrackingOrder(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}