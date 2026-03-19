
"use client"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Truck, Calendar, ClipboardList, DollarSign, Eye, ChevronDown, ChevronUp, Package, CheckCircle2, XCircle, Download, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isTerminalStatus, getStatusBadgeVariant } from "@/lib/orderStatusRules";

const BASE_URL = "https://alpa-be.onrender.com";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

type OrderItem = {
  title: string;
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
  subOrderStatus?: string | null;
  sellerId: string;
  sellerName: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
};

// NEW: Sub-order type for multi-seller orders
type SubOrder = {
  id: string | null;
  sellerId: string;
  sellerName: string;
  status: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  subtotal: number;
  itemCount: number;
  items: {
    id: string;
    productId: string;
    productTitle: string;
    productImages: string[];
    quantity: number;
    price: string;
  }[];
  statusReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Order = {
  id: string;
  displayId: string;
  userId: string;
  type: "DIRECT" | "MULTI_SELLER";
  totalAmount: string;
  status: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  statusReason?: string | null;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string | null;
  paymentStatus: string;
  couponCode?: string | null;
  discountAmount?: string | null;
  originalTotal?: string | null;
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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  shippingPhone: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  subOrders: SubOrder[];
  sellerCount: number;
  itemCount: number;
};

const OrderProgressTracker = ({ order }: { order: Order }) => {
  const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
  
  // For multi-seller orders, determine aggregated status
  const getAggregatedStatus = (order: Order): string => {
    if (!order.subOrders || order.subOrders.length === 0) {
      return order.status.toLowerCase();
    }
    
    const subOrderStatuses = order.subOrders.map(sub => sub.status.toLowerCase());
    
    // If any cancelled/refunded, show that status
    if (subOrderStatuses.some(status => status === 'cancelled')) return 'cancelled';
    if (subOrderStatuses.some(status => status === 'refund' || status === 'partial_refund')) {
      return subOrderStatuses.includes('partial_refund') ? 'partial_refund' : 'refund';
    }
    
    // For progression: use the minimum status (least progressed)
    const statusIndexes = subOrderStatuses.map(status => statuses.indexOf(status)).filter(idx => idx !== -1);
    if (statusIndexes.length === 0) return order.status.toLowerCase();
    
    const minIndex = Math.min(...statusIndexes);
    return statuses[minIndex];
  };
  
  const statusStr = getAggregatedStatus(order);
  const isCancelled = statusStr === 'cancelled';
  const isRefund = statusStr === 'refund' || statusStr === 'partial_refund';

  const getStatusIndex = (orderStatus: string) => {
    return statuses.indexOf(orderStatus);
  };

  // For refund states, show as fully delivered + refund indicator
  const currentIndex = isRefund ? statuses.length - 1 : getStatusIndex(statusStr);

  if (isCancelled) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center mb-2">
              <XCircle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <span className="text-sm font-medium">Cancelled</span>
          </div>
        </div>
      </div>
    );
  }

  if (isRefund) {
    return (
      <div className="w-full py-6 space-y-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-primary -z-10 mx-6" />
          {statuses.map((statusName) => {
            let icon = null;
            if (statusName === 'confirmed') icon = <ClipboardList className="h-6 w-6" />;
            else if (statusName === 'processing') icon = <Package className="h-6 w-6" />;
            else if (statusName === 'shipped') icon = <Truck className="h-6 w-6" />;
            else if (statusName === 'delivered') icon = <CheckCircle2 className="h-6 w-6" />;
            return (
              <div key={statusName} className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
                  {icon}
                </div>
                <span className="text-sm font-medium">{statusName.charAt(0).toUpperCase() + statusName.slice(1)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {statusStr === 'partial_refund' ? 'Partial Refund Processed' : 'Refund Processed'}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">This order has been refunded and is now closed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted -z-10 mx-6">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
          />
        </div>

        {/* Status Steps */}
        {statuses.map((statusName, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          let icon = null;
          if (statusName === 'confirmed') icon = <ClipboardList className="h-6 w-6" />;
          else if (statusName === 'processing') icon = <Package className="h-6 w-6" />;
          else if (statusName === 'shipped') icon = <Truck className="h-6 w-6" />;
          else if (statusName === 'delivered') icon = <CheckCircle2 className="h-6 w-6" />;
          return (
            <div key={statusName} className="flex flex-col items-center flex-1">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
              >
                {icon}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Multi-seller sub-order status breakdown */}
      {order.subOrders && order.subOrders.length > 1 && (
        <div className="mt-6 pt-4 border-t space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Details by Seller
          </h4>
          <div className="grid gap-3">
            {order.subOrders.map((subOrder, index) => (
              <div key={subOrder.id || index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{subOrder.sellerName}</span>
                    <Badge variant={getStatusBadgeVariant(subOrder.status)} className="text-xs">
                      {subOrder.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${typeof subOrder.subtotal === 'string' ? subOrder.subtotal : subOrder.subtotal.toFixed(2)} • {subOrder.itemCount || subOrder.items.length} item{(subOrder.itemCount || subOrder.items.length) !== 1 ? 's' : ''}
                  </div>
                  {subOrder.trackingNumber && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Tracking: {subOrder.trackingNumber}
                      {subOrder.estimatedDelivery && (
                        <span className="text-muted-foreground">
                          • Est: {new Date(subOrder.estimatedDelivery).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  {subOrder.statusReason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {subOrder.statusReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Cancel Order Modal (requires mandatory reason) ---
const CancelOrderModal = ({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/api/orders/cancel/${order.displayId}`, { reason });
      toast.success("Order cancelled successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" /> Cancel Order
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Order <strong>#{order.displayId}</strong>
        </p>
        <div className="space-y-2">
          <Label htmlFor="cancelReason">
            Reason for cancellation <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cancelReason"
            placeholder="Please explain why you want to cancel this order..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Back</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />} Confirm Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Refund Request Modal ---
const RefundRequestModal = ({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [requestType, setRequestType] = useState<"FULL_REFUND" | "PARTIAL_REFUND">("FULL_REFUND");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund request.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/orders/refund-request/${order.displayId}`, { requestType, reason });
      toast.success("Refund request submitted successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit refund request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Request Refund
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Order <strong>#{order.displayId}</strong>
        </p>
        <div className="space-y-2">
          <Label>Refund Type <span className="text-destructive">*</span></Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRequestType("FULL_REFUND")}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                requestType === "FULL_REFUND"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              Full Refund
            </button>
            <button
              type="button"
              onClick={() => setRequestType("PARTIAL_REFUND")}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                requestType === "PARTIAL_REFUND"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              Partial Refund
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="refundReason">
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="refundReason"
            placeholder="Describe the issue and reason for refund..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Note</p>
          <p>This will create a support ticket. Our team will review your request within 2-3 business days. The order status will be updated after review.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Back</Button>
          <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />} Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrdersLoadingSkeleton = () => {
  return (
    <div className="p-6 mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Order #</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tracking</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-8 w-24 rounded-md" /></td>
                <td className="px-4 py-3"><Skeleton className="h-8 w-24 rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
      const res = await fetch(`${BASE_URL}/api/orders/my-orders`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const parseShippingAddress = (order: Order): Record<string, string> => {
    const result: Record<string, string> = {};

    // Extract fields from the new API structure
    if (order.shippingAddressLine) {
      result["Address Line"] = order.shippingAddressLine;
    }
    if (order.shippingCity) {
      result["City"] = order.shippingCity;
    }
    if (order.shippingState) {
      result["State"] = order.shippingState;
    }
    if (order.shippingZipCode) {
      result["Zip Code"] = order.shippingZipCode;
    }
    if (order.shippingCountry) {
      result["Country"] = order.shippingCountry;
    }
    if (order.shippingPhone) {
      result["Phone"] = order.shippingPhone;
    }
    if (order.customerName) {
      result["Customer Name"] = order.customerName;
    }
    if (order.customerEmail) {
      result["Email"] = order.customerEmail;
    }

    // Also include the addressLine from shippingAddress object if available
    if (order.shippingAddress?.addressLine) {
      result["Full Address"] = order.shippingAddress.addressLine;
    }

    return result;
  };

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

  // Cancel is now handled by CancelOrderModal (mandatory reason required)

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoiceId(orderId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
      const cleanId = orderId.replace(/^#/, "");
      const response = await fetch(`${BASE_URL}/api/orders/invoice/${cleanId}`, {
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
      link.download = `invoice-${cleanId}.pdf`;
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

  if (loading) return <OrdersLoadingSkeleton />;

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">View your order history and track your shipments.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/customerdashboard/returnPolicy'}>
          <ClipboardList className="h-4 w-4 mr-2" /> My Refund Requests
        </Button>
      </div>
      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tracking</th>
                <th className="px-4 py-3 text-left text-sm font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">#{order.displayId}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === "DELIVERED" ? "default" : order.status === "CANCELLED" ? "destructive" : "secondary"}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-right">
                        <span className="font-semibold">${order.totalAmount}</span>
                        {order.sellerCount > 1 && (
                          <span className="text-xs text-muted-foreground">
                            {order.sellerCount} sellers
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {order.subOrders && order.subOrders.length > 1 ? (
                        // Multi-seller order - show tracking summary
                        <div className="flex flex-col">
                          {(() => {
                            const trackedOrders = order.subOrders.filter(sub => sub.trackingNumber);
                            if (trackedOrders.length === 0) {
                              return <span className="text-muted-foreground">No tracking</span>;
                            } else if (trackedOrders.length === order.subOrders.length) {
                              return <span className="text-green-600 text-sm flex items-center gap-1">
                                <Truck className="h-3 w-3" /> All shipped
                              </span>;
                            } else {
                              return <span className="text-amber-600 text-sm flex items-center gap-1">
                                <Truck className="h-3 w-3" /> {trackedOrders.length}/{order.subOrders.length} shipped
                              </span>;
                            }
                          })()}
                        </div>
                      ) : order.trackingNumber ? (
                        // Single seller order with tracking
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1"><Truck className="h-4 w-4" /> {order.trackingNumber}</span>
                          <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery ? fmtDate(order.estimatedDelivery) : 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tracking</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingInvoiceId === order.displayId}
                        onClick={() => handleDownloadInvoice(order.displayId)}
                        className="gap-1"
                      >
                        {downloadingInvoiceId === order.displayId ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Invoice
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                        {expandedOrderId === order.id ? <><Eye className="h-4 w-4" /> Hide <ChevronUp className="h-4 w-4" /></> : <><Eye className="h-4 w-4" /> View <ChevronDown className="h-4 w-4" /></>}
                      </Button>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={7} className="bg-muted/40 p-0">
                        <div className="p-6 space-y-6">
                          {/* Progress Tracker */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Order Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <OrderProgressTracker order={order} />
                            </CardContent>
                          </Card>

                          {/* Order Details */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-sm text-muted-foreground">Status</span>
                                  <p className="font-medium">{order.status.toUpperCase()}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Created At</span>
                                  <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Total Amount</span>
                                  <p className="font-medium">${order.totalAmount}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Payment Method</span>
                                  <p className="font-medium">{order.paymentMethod}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Payment Status</span>
                                  <p className="font-medium">{order.paymentStatus}</p>
                                </div>
                                {order.trackingNumber && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Tracking Number</span>
                                    <p className="font-medium">{order.trackingNumber}</p>
                                  </div>
                                )}
                                {order.estimatedDelivery && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                                    <p className="font-medium">{fmtDate(order.estimatedDelivery)}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-sm text-muted-foreground">Seller Count</span>
                                  <p className="font-medium">{order.sellerCount}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Item Count</span>
                                  <p className="font-medium">{order.itemCount}</p>
                                </div>
                              </div>

                              {/* Shipping Address Table */}
                              {(() => {
                                const addressFields = parseShippingAddress(order);
                                const entries = Object.entries(addressFields);
                                if (entries.length === 0) return (
                                  <div className="pt-2 border-t">
                                    <span className="text-sm text-muted-foreground">Shipping Address</span>
                                    <p className="font-medium">N/A</p>
                                  </div>
                                );
                                return (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                      Shipping Address
                                    </p>
                                    <div className="rounded-lg border overflow-hidden">
                                      <table className="w-full text-sm">
                                        <tbody>
                                          {entries.map(([label, value], idx) => (
                                            <tr key={label} className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                                              <td className="px-4 py-2.5 text-muted-foreground font-medium w-1/3 border-r">{label}</td>
                                              <td className="px-4 py-2.5 font-medium">{value}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()}
                              {/* Cancel Order Button (opens modal with mandatory reason) */}
                              {order.status.toLowerCase() === "confirmed" && (
                                <Button
                                  variant="destructive"
                                  onClick={() => setCancelModalOrder(order)}
                                  className="mt-4"
                                >
                                  Cancel Order
                                </Button>
                              )}

                              {/* Request Refund Button (DELIVERED orders only) */}
                              {order.status.toLowerCase() === "delivered" && (
                                <Button
                                  variant="outline"
                                  onClick={() => setRefundModalOrder(order)}
                                  className="mt-4 ml-2"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" /> Request Refund
                                </Button>
                              )}

                              {/* Download Invoice Button */}
                              <Button
                                variant="default"
                                disabled={downloadingInvoiceId === order.displayId}
                                onClick={() => handleDownloadInvoice(order.displayId)}
                                className="mt-4 ml-4"
                              >
                                {downloadingInvoiceId === order.displayId ? (
                                  <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Invoice
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Order Items */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {order.subOrders && order.subOrders.length > 0 ? (
                                // Multi-seller order - group by sellers
                                <div className="space-y-6">
                                  {order.subOrders.map((subOrder, subIndex) => (
                                    <div key={subOrder.id || subIndex} className="space-y-3">
                                      <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Package className="h-4 w-4 text-primary" />
                                          </div>
                                          <div>
                                            <h3 className="font-semibold text-sm">{subOrder.sellerName}</h3>
                                            <p className="text-xs text-muted-foreground">
                                              ${subOrder.subtotal} • 
                                              {subOrder.itemCount} item{subOrder.itemCount !== 1 ? 's' : ''}
                                            </p>
                                          </div>
                                        </div>
                                        <Badge variant={subOrder.status === "DELIVERED" ? "default" : subOrder.status === "CANCELLED" ? "destructive" : "secondary"} className="text-xs">
                                          {subOrder.status.toUpperCase()}
                                        </Badge>
                                      </div>
                                      
                                      <div className="space-y-3 pl-6">
                                        {subOrder.items.map((item, i) => (
                                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                                            {item.productImages?.[0] && (
                                              <Image 
                                                src={item.productImages[0]} 
                                                alt={item.productTitle || "Product image"} 
                                                width={64} 
                                                height={64} 
                                                className="rounded object-cover" 
                                                unoptimized 
                                              />
                                            )}
                                            <div className="flex-1">
                                              <p className="font-medium">{item.productTitle}</p>
                                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">${item.price}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {subOrder.trackingNumber && (
                                        <div className="ml-6 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                            <Truck className="h-4 w-4" />
                                            <span className="font-medium">Tracking: {subOrder.trackingNumber}</span>
                                          </div>
                                          {subOrder.estimatedDelivery && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                              Estimated delivery: {new Date(subOrder.estimatedDelivery).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Single seller order - display items directly
                                <div className="space-y-3">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                                      {item.product.images?.[0] && (
                                        <Image 
                                          src={item.product.images[0]} 
                                          alt={item.product.title || "Product image"} 
                                          width={64} 
                                          height={64} 
                                          className="rounded object-cover" 
                                          unoptimized 
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium">{item.product.title}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Sold by: {item.sellerName}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">${item.price}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
      {refundModalOrder && (
        <RefundRequestModal
          order={refundModalOrder}
          onClose={() => setRefundModalOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};

export default CustomerOrdersPage;