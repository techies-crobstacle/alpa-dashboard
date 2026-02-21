
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Loader2, X, Eye, ChevronDown, ChevronUp, CreditCard, MapPin, Calendar, ClipboardList, DollarSign, Hash, Download } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
  shippingAddress?: any;
  shippingCity?: any;
  shippingState?: any;
  shippingPostcode?: any;
  shippingPhone?: any;
};

export default function AdminOrdersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [layout, setLayout] = useState<'table' | 'card'>('card');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      fetchOrders(selectedSeller);
    } else {
      setOrders([]);
    }
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

  // 2. UPDATE Status
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/api/seller/orders/update-status/${orderId}`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(selectedSeller);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Add tracking update logic for admin using seller endpoints
  const submitTracking = async () => {
    if (!activeTrackingOrder) return;
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com"}/api/orders/invoice/${orderId}`, {
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

  // Helper to render shipping address safely
  function renderShippingAddress(address: any) {
    if (!address) return "N/A";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const { address: addrText, street, suburb, postcode, fullAddress, orderSummary } = address;
      const parts = [fullAddress, addrText, street, suburb, postcode, orderSummary].filter(p => p && typeof p === 'string');
      return parts.length > 0 ? parts.join(", ") : JSON.stringify(address);
    }
    return String(address);
  }

  if (loadingSellers) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage orders by seller.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto md:justify-end justify-between">
          <div className="min-w-[250px]">
            <label className="block mb-1 font-medium">Select Seller</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              disabled={loadingSellers}
            >
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} ({seller.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
            <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
        ) : layout === 'card' ? (
          orders.map((order) => (
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
                      <p className="font-bold pt-2 border-t flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total: ${order.totalAmount}</p>
                    </div>
                  </div>

                  {/* Actions: Update Status */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Management</Label>
                    <Select onValueChange={(val) => updateStatus(order.id, val)} defaultValue={order.status || "pending"}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions: Tracking */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</Label>
                    {order.trackingNumber ? (
                       <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                          <p className="flex items-center gap-2 text-blue-700 font-medium">
                            <Truck className="h-4 w-4" /> {order.trackingNumber}
                          </p>
                          <p className="text-blue-600/80 text-xs mt-1">Est: {order.estimatedDelivery}</p>
                       </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTrackingOrder(order)}>
                        <Truck className="h-4 w-4" /> Add Tracking
                      </Button>
                    )}
                  </div>
                </div>
                {expandedOrderId === order.id && (
                  <div className="mt-6 border-t pt-4 space-y-4 bg-muted/40 rounded p-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 font-medium"><Hash className="h-4 w-4" /><strong>Order ID:</strong> {renderValue(order.id)}</div>
                      <div className="flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4" /><strong>Status:</strong> {renderValue(order.status).toUpperCase()}</div>
                      <div className="flex items-center gap-2 font-medium"><Calendar className="h-4 w-4" /><strong>Created At:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</div>
                      <div className="flex items-center gap-2 font-medium"><DollarSign className="h-4 w-4" /><strong>Total Amount:</strong> ${renderValue(order.totalAmount)}</div>
                      <div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4" /><strong>Payment Method:</strong> {renderValue(order.paymentMethod)}</div>
                      <div className="flex items-center gap-2 font-medium"><Truck className="h-4 w-4" /><strong>Tracking Number:</strong> {renderValue(order.trackingNumber || 'N/A')}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4" /><strong>Shipping Address:</strong></div>
                        <p className="ml-6 font-medium">{renderShippingAddress(order.shippingAddress)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong className="text-muted-foreground mr-1">City:</strong> <span className="font-medium">{renderValue(order.shippingCity)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">State:</strong> <span className="font-medium">{renderValue(order.shippingState)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">Postcode:</strong> <span className="font-medium">{renderValue(order.shippingPostcode)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">Phone:</strong> <span className="font-medium">{renderValue(order.shippingPhone)}</span></div>
                      </div>
                    </div>

                    {/* Download Invoice Button */}
                    {order.status && order.status.toLowerCase() !== 'pending' && (
                      <div className="mt-4 pt-2 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          disabled={downloadingInvoiceId === order.id}
                          onClick={() => handleDownloadInvoice(order.id)}
                          className="gap-2"
                        >
                          {downloadingInvoiceId === order.id ? (
                            <>
                              <Loader2 className="animate-spin h-4 w-4" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download Invoice
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2 font-medium"><ClipboardList className="h-4 w-4" /><strong>Items:</strong></div>
                      <ul className="list-disc ml-8 space-y-1">
                        {order.items?.map((item, i) => (
                          <li key={i}>
                            <span className="font-medium">{renderValue(item.product?.title || item.title)}</span> x {renderValue(item.quantity)} @ ${renderValue((item as any).price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
                {orders.map((order) => (
                  <>
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
                            <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No tracking</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                          {expandedOrderId === order.id ? "Hide" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedOrderId === order.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/40 p-0">
                          <div className="p-6 space-y-4 text-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Order Details */}
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div><strong className="text-muted-foreground mr-1">Order ID:</strong> <span className="font-medium">{renderValue(order.id)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Status:</strong> <span className="font-medium">{renderValue(order.status).toUpperCase()}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Created At:</strong> <span className="font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Total Amount:</strong> <span className="font-medium">${renderValue(order.totalAmount)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Payment:</strong> <span className="font-medium">{renderValue(order.paymentMethod)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Tracking:</strong> <span className="font-medium">{renderValue(order.trackingNumber || 'N/A')}</span></div>
                                </div>
                                <div className="border-t pt-3">
                                  <strong className="text-muted-foreground">Shipping Address:</strong>
                                  <p className="font-medium">{renderShippingAddress(order.shippingAddress)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><strong className="text-muted-foreground mr-1">City:</strong> <span className="font-medium">{renderValue(order.shippingCity)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">State:</strong> <span className="font-medium">{renderValue(order.shippingState)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Postcode:</strong> <span className="font-medium">{renderValue(order.shippingPostcode)}</span></div>
                                  <div><strong className="text-muted-foreground mr-1">Phone:</strong> <span className="font-medium">{renderValue(order.shippingPhone)}</span></div>
                                </div>
                              </div>
                              
                              {/* Management Section */}
                              <div className="space-y-4 border-l pl-6">
                                {/* Download Invoice Button */}
                                {order.status && order.status.toLowerCase() !== 'pending' && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Invoice</Label>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      disabled={downloadingInvoiceId === order.id}
                                      onClick={() => handleDownloadInvoice(order.id)}
                                      className="w-full gap-2"
                                    >
                                      {downloadingInvoiceId === order.id ? (
                                        <>
                                          <Loader2 className="animate-spin h-4 w-4" />
                                          Downloading...
                                        </>
                                      ) : (
                                        <>
                                          <Download className="h-4 w-4" />
                                          Download Invoice
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                                {/* Status Update */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Update Status</Label>
                                  <Select onValueChange={(val) => updateStatus(order.id, val)} defaultValue={renderValue(order.status) || "pending"}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue>
                                        {order.status ? renderValue(order.status).charAt(0).toUpperCase() + renderValue(order.status).slice(1) : "Pending"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Tracking Management */}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Tracking Management</Label>
                                  {!order.trackingNumber && (
                                    <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTrackingOrder(order)}>
                                      <Truck className="h-4 w-4" /> Add Tracking
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Items List */}
                            <div className="space-y-2 border-t pt-4">
                              <strong className="font-medium">Order Items:</strong>
                              <ul className="list-disc ml-6 space-y-1">
                                {order.items?.map((item, i) => (
                                  <li key={i}>
                                    <span className="font-medium">{renderValue(item.product?.title || item.title)}</span> x {renderValue(item.quantity)} @ ${renderValue((item as any).price)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
                  placeholder="e.g. 23 December 2025" 
                  value={estimatedDelivery}
                  onChange={handleEstimatedDeliveryChange}
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
