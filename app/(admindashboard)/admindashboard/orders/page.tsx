
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Loader2, X, Eye, ChevronDown, ChevronLeft, ChevronRight, CreditCard, MapPin, Calendar, ClipboardList, DollarSign, Hash, Download, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  getAllowedTransitions,
  getRequiredFields,
  validateStatusUpdate,
  getStatusLabel,
  getStatusBadgeVariant,
  isTerminalStatus,
} from "@/lib/orderStatusRules";

type Seller = {
  id: string;
  name: string;
  email: string;
};

type OrderItem = {
  product?: {
    title?: string;
    images?: string[];
  };
  title?: string;
  quantity: number;
};

type Order = {
  id: any;
  createdAt: any;
  customerName?: any;
  status: any;
  items?: OrderItem[];
  totalAmount: any;
  trackingNumber?: any;
  estimatedDelivery?: any;
  paymentMethod?: any;
  statusReason?: any;
  shippingAddress?: any;
  shippingCity?: any;
  shippingState?: any;
  shippingPostcode?: any;
  shippingPhone?: any;
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
      await api.put(`/api/seller/orders/update-status/${order.id}`, payload);
      // If shipping, persist tracking info via the dedicated tracking endpoint
      if (selectedStatus === "SHIPPED" && trackingNumber && estimatedDelivery) {
        await api.put(`/api/seller/orders/tracking/${order.id}`, {
          trackingNumber,
          estimatedDelivery,
        });
      }
      toast.success(`Order updated to ${getStatusLabel(selectedStatus)}`);
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
          ) : allowedTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No status transitions available.</p>
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
                    <p key={i} className="text-sm text-destructive flex items-start gap-1.5"><span className="mt-0.5">•</span><span>{err}</span></p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [activeStatusOrder, setActiveStatusOrder] = useState<Order | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [layout, setLayout] = useState<'table' | 'card'>('table');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) {
        setIsSellerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      fetchOrders(selectedSeller);
    } else {
      setOrders([]);
    }
    setCurrentPage(1);
  }, [selectedSeller]);

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await api.get("/api/users/all");
      const sellersOnly = Array.isArray(res)
        ? res.filter((u: { role: string }) => u.role === "SELLER")
        : (res.users || []).filter((u: { role: string }) => u.role === "SELLER");
      setSellers(sellersOnly);
      if (sellersOnly.length > 0) setSelectedSeller(sellersOnly[0].id);
    } catch {
      toast.error("Failed to load sellers");
    } finally {
      setLoadingSellers(false);
    }
  };

  const fetchOrders = async (sellerId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/orders/by-seller/${sellerId}`, {
        headers: {
          Authorization: ""
        }
      });
      setOrders(Array.isArray(res) ? res : res.orders || []);
    } catch {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Add tracking update logic for admin using seller endpoints
  const submitTracking = async () => {
    if (!activeTrackingOrder) return;
    const { valid, errors } = validateStatusUpdate("SHIPPED", { trackingNumber, estimatedDelivery: estimatedDelivery });
    if (!valid) { toast.error(errors[0]); return; }
    try {
      await api.put(`/api/seller/orders/tracking/${activeTrackingOrder.id}`, { 
        trackingNumber, 
        estimatedDelivery 
      });
      toast.success("Tracking information updated");
      setActiveTrackingOrder(null);
      setTrackingNumber("");
      setEstimatedDelivery("");
      fetchOrders(selectedSeller);
    } catch {
      toast.error("Failed to update tracking");
    }
  };

  // Optimized input handlers
  const handleTrackingNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingNumber(e.target.value);
  }, []);

  const handleEstimatedDeliveryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEstimatedDelivery(e.target.value);
  }, []);

  const handleCloseTrackingModal = useCallback(() => {
    setActiveTrackingOrder(null);
    setTrackingNumber("");
    setEstimatedDelivery("");
  }, []);

  // Download invoice functionality
  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoiceId(orderId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/orders/invoice/${orderId}`, {
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



  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getPaginationPages = () => {
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

  if (loadingSellers) return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-[250px] rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
      {/* Order card skeletons */}
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage orders by seller.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:items-end w-full md:w-auto md:justify-end justify-between">
          {/* Seller Dropdown */}
          <div className="min-w-[260px] relative" ref={sellerDropdownRef}>
            <label className="block mb-1 font-medium">Select Seller</label>
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
              onClick={() => setIsSellerDropdownOpen((v) => !v)}
            >
              <span className={selectedSeller ? "text-foreground font-medium" : "text-muted-foreground"}>
                {selectedSeller ? (() => {
                  const s = sellers.find((s) => s.id === selectedSeller);
                  if (!s) return "Select a seller";
                  return (
                    <span className="flex items-center gap-2">
                      {s.name}
                      <span className="text-xs text-muted-foreground font-normal">{s.email}</span>
                    </span>
                  );
                })() : "Select a seller"}
              </span>
              <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isSellerDropdownOpen && "rotate-180")} />
            </div>

            {isSellerDropdownOpen && (
              <div className="absolute z-[60] left-0 w-full mt-1 bg-background rounded-lg border shadow-xl p-1 min-w-[380px] animate-in fade-in zoom-in-95">
                <div className="max-h-[300px] overflow-y-auto">
                  {sellers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No sellers found.</div>
                  ) : sellers.map((seller) => (
                    <div
                      key={seller.id}
                      className={cn(
                        "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                        selectedSeller === seller.id && "bg-primary/5 text-primary font-medium"
                      )}
                      onClick={(e) => { e.stopPropagation(); setSelectedSeller(seller.id); setIsSellerDropdownOpen(false); }}
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary transition-all",
                        selectedSeller === seller.id ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                      )}>
                        {selectedSeller === seller.id && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{seller.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{seller.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-end">
            <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
            <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-28 rounded-full" />
                      <Skeleton className="h-9 w-full rounded-md mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
        ) : layout === 'card' ? (
          paginatedOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Order #{order.id?.slice(-6)?.toUpperCase?.()}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center gap-1"><ClipboardList className="h-4 w-4" /> Customer</p>
                    <p className="text-sm text-muted-foreground">{order.customerName || "Guest"}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {order.status?.toUpperCase?.()}
                  </Badge>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => router.push(`/admindashboard/orders/${order.id}?sellerId=${selectedSeller}`)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Items Summary */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Order Items</Label>
                    <div className="text-sm space-y-1">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {item.product?.images?.[0] && (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.title || "Product image"}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span>{item.product?.title || item.title} <span className="text-muted-foreground">x {item.quantity}</span></span>
                        </div>
                      ))}
                      {/* <p className="font-bold pt-2 border-t flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total: ${order.totalAmount}</p> */}
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
                            <Truck className="h-4 w-4" /> {order.trackingNumber}
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
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                      <TableCell>#{order.id?.slice(-6)?.toUpperCase?.()}</TableCell>
                      <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</TableCell>
                      <TableCell>{order.customerName || "Guest"}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                          {order.status?.toUpperCase?.()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {item.product?.images?.[0] && (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.title || "Product image"}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-cover rounded inline-block"
                              />
                            )}
                            <span>{item.product?.title || item.title} <span className="text-muted-foreground">x {item.quantity}</span></span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>${order.totalAmount}</TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{order.trackingNumber}</span>
                            <span className="text-xs text-muted-foreground">Est: {fmtDate(order.estimatedDelivery)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No tracking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!isTerminalStatus(order.status) && (
                            <Button variant="outline" size="sm" onClick={() => setActiveStatusOrder(order)}>
                              Update
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => router.push(`/admindashboard/orders/${order.id}?sellerId=${selectedSeller}`)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </div>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          {/* Left: count info + per-page */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + 1, orders.length)}
              </span>
              {"–"}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * itemsPerPage, orders.length)}
              </span>
              {" of "}
              <span className="font-medium text-foreground">{orders.length}</span>
              {" orders"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Per page:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPaginationPages().map((page, idx) =>
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">
                  &hellip;
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
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
          onSuccess={() => fetchOrders(selectedSeller)}
        />
      )}

      {/* Tracking Modal */}
      {activeTrackingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add Tracking Info</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseTrackingModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Enter details for Order #{activeTrackingOrder.id?.slice(-6)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input 
                  placeholder="e.g. 25422565632" 
                  value={trackingNumber}
                  onChange={handleTrackingNumberChange}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Date</Label>
                <Input 
                  type="date"
                  value={estimatedDelivery}
                  onChange={handleEstimatedDeliveryChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={submitTracking}>Save Tracking</Button>
                <Button variant="outline" className="flex-1" onClick={handleCloseTrackingModal}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

