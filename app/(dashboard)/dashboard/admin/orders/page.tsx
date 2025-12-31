
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck ,Loader2 } from "lucide-react";
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
  id: string;
  createdAt?: string;
  customerName?: string;
  status?: string;
  items?: OrderItem[];
  totalAmount?: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
};

export default function AdminOrdersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<{ trackingNumber: string; estimatedDelivery: string }>({ trackingNumber: "", estimatedDelivery: "" });
  const [layout, setLayout] = useState<'table' | 'card'>('card');

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
      const res = await api.get(`/api/admin/orders/by-seller/${sellerId}`);
      setOrders(Array.isArray(res) ? res : res.orders || []);
    } catch {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Optionally, add tracking update logic if admin can update tracking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const submitTracking = async () => {
    if (!activeTrackingOrder) return;
    try {
      await api.put(`/api/admin/orders/tracking/${activeTrackingOrder.id}`, trackingData);
      toast.success("Tracking information updated");
      setActiveTrackingOrder(null);
      setTrackingData({ trackingNumber: "", estimatedDelivery: "" });
      fetchOrders(selectedSeller);
    } catch {
      toast.error("Failed to update tracking");
    }
  };

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
                    <p className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">{order.customerName || "Guest"}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                    {order.status?.toUpperCase?.()}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Items Summary */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">Order Items</Label>
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
                      <p className="font-bold pt-2 border-t">Total: ${order.totalAmount}</p>
                    </div>
                  </div>

                  {/* Actions: Update Status (admin may not update, so omit or make read-only) */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">Status</Label>
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                      {order.status?.toUpperCase?.()}
                    </Badge>
                  </div>

                  {/* Actions: Tracking */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">Shipping</Label>
                    {order.trackingNumber ? (
                       <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                          <p className="flex items-center gap-2 text-blue-700 font-medium">
                            <Truck className="h-4 w-4" /> {order.trackingNumber}
                          </p>
                          <p className="text-blue-600/80 text-xs mt-1">Est: {order.estimatedDelivery}</p>
                       </div>
                    ) : (
                      <span className="text-muted-foreground">No tracking info</span>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Tracking Modal (optional for admin) */}
      {/*
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
      */}
    </div>
  );
}
