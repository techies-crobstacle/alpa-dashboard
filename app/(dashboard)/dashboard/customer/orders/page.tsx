"use client"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Loader2, Truck, Calendar, ClipboardList, DollarSign, Eye, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

const BASE_URL = "https://alpa-be-1.onrender.com";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

type OrderItem = {
  product: { images?: string[]; title?: string };
  title?: string;
  quantity: number;
  price?: string;
};
type Order = {
  id: string;
  createdAt: string;
  status: string;
  items?: OrderItem[];
  totalAmount: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  paymentMethod?: string;
  shippingAddress?: string;
};

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">View your order history and track your shipments.</p>
        </div>
      </div>
      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow>
                    <TableCell>#{order.id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>${order.totalAmount}</TableCell>
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1"><Truck className="h-4 w-4" /> {order.trackingNumber}</span>
                          <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tracking</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                        {expandedOrderId === order.id ? <><Eye className="h-4 w-4" /> Hide <ChevronUp className="h-4 w-4" /></> : <><Eye className="h-4 w-4" /> View <ChevronDown className="h-4 w-4" /></>}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedOrderId === order.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/40 p-0">
                        <div className="p-4 space-y-2">
                          <div><strong>Status:</strong> {order.status}</div>
                          <div><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                          <div><strong>Total Amount:</strong> ${order.totalAmount}</div>
                          <div><strong>Payment Method:</strong> {order.paymentMethod}</div>
                          <div><strong>Shipping Address:</strong> {order.shippingAddress}</div>
                          <div><strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}</div>
                          <div><strong>Estimated Delivery:</strong> {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}</div>
                          <div><strong>Items:</strong>
                            <ul className="list-disc ml-6">
                              {order.items?.map((item, i) => (
                                <li key={i}>
                                  {item.product?.title || item.title} x {item.quantity} @ ${item.price}
                                  {item.product?.images?.[0] && (
                                    <Image src={item.product.images[0]} alt={item.product.title || "Product image"} width={32} height={32} className="inline ml-2 rounded object-cover" unoptimized />
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
