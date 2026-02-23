// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Package, Truck, Loader2, RefreshCcw, X, Eye, ChevronDown, ChevronUp, CreditCard, MapPin, Calendar, ClipboardList, DollarSign, Hash } from "lucide-react";
// import Image from "next/image";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 
// import { toast } from "sonner";

// const BASE_URL = "https://alpa-be-1.onrender.com";

// // --- API HELPERS ---
// const getAuthHeaders = () => {
//   // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWppZjNrOTEwMDAyd296eDdma3BidWhxIiwidXNlclR5cGUiOiJzZWxsZXIiLCJyb2xlIjoiU0VMTEVSIiwiaWF0IjoxNzY2NDg0NTEzLCJleHAiOjE3NjkwNzY1MTN9.Y82RBMLKkta1bb1Lj7ZsWjKdHky4AwQe1lg80_yjjCk";
//   const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
//   return {
//     "Content-Type": "application/json",
//     "Authorization": `Bearer ${token}`,
//   };
// };

// type OrderItem = {
//   product: {
//     images?: string[];
//     title?: string;
//   };
//   title?: string;
//   quantity: number;
//   price?: string;
// };
// type Order = {
//   id: string;
//   createdAt: string;
//   customerName?: string;
//   status: string;
//   items?: OrderItem[];
//   totalAmount: number;
//   trackingNumber?: string;
//   estimatedDelivery?: string;
//   paymentMethod?: string;
//   shippingAddress?: string;
// };

// function getUserRole() {
//   if (typeof window !== "undefined") {
//     return localStorage.getItem("role") || "USER";
//   }
//   return null;
// }

// export default function OrdersPage() {
//   const router = useRouter();
//   const [role, setRole] = useState<string | null>(null);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
//   const [trackingData, setTrackingData] = useState({ trackingNumber: "", estimatedDelivery: "" });
//   const [layout, setLayout] = useState<'table' | 'card'>("card");
//   const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const r = localStorage.getItem("alpa_token");
//       console.log("[Seller Orders] Loaded role from localStorage:", r);
//       setRole(r);
//     }
//   }, []);

//   useEffect(() => {
//     console.log("[Seller Orders] Current role:", role);
//     if (role === null) return;
//     if (role !== "SELLER") {
//       router.replace("/dashboard");
//       return;
//     }
//     fetchOrders();
//   }, [role]);

//   // 1. GET Orders
//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const url = `${BASE_URL}/api/seller/orders`;
//       console.log("[Seller Orders] Fetching:", url);
//       const res = await fetch(url, { headers: getAuthHeaders() });
//       const data = await res.json();
//       console.log("[Seller Orders] API response:", data);
//       setOrders(data.orders || []);
//     } catch (err) {
//       console.error("[Seller Orders] Fetch error:", err);
//       toast.error("Failed to load orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 2. UPDATE Status
//   const updateStatus = async (orderId: string, newStatus: string) => {
//     try {
//       const res = await fetch(`${BASE_URL}/api/seller/orders/update-status/${orderId}`, {
//         method: "PUT",
//         headers: getAuthHeaders(),
//         body: JSON.stringify({ status: newStatus }),
//       });
//       if (!res.ok) throw new Error();
//       toast.success(`Order marked as ${newStatus}`);
//       fetchOrders();
//     } catch {
//       toast.error("Failed to update status");
//     }
//   };

//   // 3. ADD Tracking
//   const submitTracking = async () => {
//     if (!activeTrackingOrder) return;
//     try {
//       const res = await fetch(`${BASE_URL}/api/seller/orders/tracking/${activeTrackingOrder.id}`, {
//         method: "PUT",
//         headers: getAuthHeaders(),
//         body: JSON.stringify(trackingData),
//       });
//       if (!res.ok) throw new Error();
//       toast.success("Tracking information updated");
//       setActiveTrackingOrder(null);
//       setTrackingData({ trackingNumber: "", estimatedDelivery: "" });
//       fetchOrders();
//     } catch {
//       toast.error("Failed to update tracking");
//     }
//   };

//   if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
//   if (role === null) return null; // Prevent hydration mismatch

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
//           <p className="text-muted-foreground">Manage customer purchases and shipping status.</p>
//         </div>
//         <div className="flex gap-2 mt-2 md:mt-0">
//           <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
//           <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
//         </div>
//       </div>

//       {orders.length === 0 ? (
//         <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
//       ) : layout === 'card' ? (
//         <div className="grid gap-4">
//           {orders.map((order) => (
//             <Card key={order.id} className="overflow-hidden">
//               <div className="border-b bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-4">
//                 <div className="flex items-center gap-3">
//                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
//                     <Package className="h-5 w-5" />
//                   </div>
//                   <div>
//                     <p className="font-bold">Order #{order.id.slice(-6).toUpperCase()}</p>
//                     <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(order.createdAt).toLocaleDateString()}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-4">
//                   <div className="text-right">
//                     <p className="text-sm font-medium flex items-center gap-1"><ClipboardList className="h-4 w-4" /> Customer</p>
//                     <p className="text-sm text-muted-foreground">{order.customerName || "Guest"}</p>
//                   </div>
//                   <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="flex items-center gap-1">
//                     <Hash className="h-3 w-3" /> {order.status.toUpperCase()}
//                   </Badge>
//                 </div>
//                 <div>
//                   <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
//                     <Eye className="h-4 w-4" />
//                     {expandedOrderId === order.id ? "Hide" : "View"}
//                     {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                   </Button>
//                 </div>
//               </div>
//               <CardContent className="p-6">
//                 <div className="grid md:grid-cols-3 gap-6">
//                   {/* Items Summary */}
//                   <div className="space-y-2">
//                     <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Order Items</Label>
//                     <div className="text-sm space-y-1">
//                       {order.items?.map((item, i) => (
//                         <div key={i} className="flex items-center gap-2">
//                           {item.product?.images?.[0] && (
//                             <Image
//                               src={item.product.images[0]}
//                               alt={item.product.title || "Product image"}
//                               width={40}
//                               height={40}
//                               className="w-10 h-10 object-cover rounded"
//                               unoptimized
//                             />
//                           )}
//                           <span>{item.product?.title || item.title} <span className="text-muted-foreground">x {item.quantity}</span></span>
//                         </div>
//                       ))}
//                       <p className="font-bold pt-2 border-t flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total: ${order.totalAmount}</p>
//                     </div>
//                   </div>
//                   {/* Actions: Update Status */}
//                   <div className="space-y-3">
//                     <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Management</Label>
//                     <Select onValueChange={(val) => updateStatus(order.id, val)} defaultValue={order.status || "pending"}>
//                       <SelectTrigger className="w-full">
//                         <SelectValue>
//                           {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
//                         </SelectValue>
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="pending">Pending</SelectItem>
//                         <SelectItem value="shipped">Shipped</SelectItem>
//                         <SelectItem value="delivered">Delivered</SelectItem>
//                         <SelectItem value="cancelled">Cancelled</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   {/* Actions: Tracking */}
//                   <div className="space-y-3">
//                     <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</Label>
//                     {order.trackingNumber ? (
//                        <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
//                           <p className="flex items-center gap-2 text-blue-700 font-medium">
//                             <Truck className="h-4 w-4" /> {order.trackingNumber}
//                           </p>
//                           <p className="text-blue-600/80 text-xs mt-1">Est: {order.estimatedDelivery}</p>
//                        </div>
//                     ) : (
//                       <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTrackingOrder(order)}>
//                         <Truck className="h-4 w-4" /> Add Tracking
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//                 {expandedOrderId === order.id && (
//                   <div className="mt-6 border-t pt-4 space-y-2 bg-muted/40 rounded">
//                     <div className="flex items-center gap-2"><Hash className="h-4 w-4" /><strong>Order ID:</strong> {order.id}</div>
//                     <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /><strong>Status:</strong> {order.status}</div>
//                     <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</div>
//                     <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /><strong>Total Amount:</strong> ${order.totalAmount}</div>
//                     <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><strong>Payment Method:</strong> {order.paymentMethod}</div>
//                     <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><strong>Shipping Address:</strong> {order.shippingAddress}</div>
//                     <div className="flex items-center gap-2"><Truck className="h-4 w-4" /><strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}</div>
//                     <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><strong>Estimated Delivery:</strong> {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}</div>
//                     <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /><strong>Items:</strong></div>
//                     <ul className="list-disc ml-8">
//                       {order.items?.map((item, i) => (
//                         <li key={i}>
//                           {item.product?.title || item.title} x {item.quantity} @ ${item.price}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border bg-background">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Order #</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Customer</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Items</TableHead>
//                 <TableHead>Total</TableHead>
//                 <TableHead>Tracking</TableHead>
//                 <TableHead>View</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {orders.map((order) => (
//                 <>
//                   <TableRow key={order.id}>
//                     <TableCell>#{order.id.slice(-6).toUpperCase()}</TableCell>
//                     <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
//                     <TableCell>{order.customerName || "Guest"}</TableCell>
//                     <TableCell>
//                       <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
//                         {order.status.toUpperCase()}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       {order.items?.map((item, i) => (
//                         <div key={i} className="flex items-center gap-2">
//                           {item.product?.images?.[0] && (
//                             <Image
//                               src={item.product.images[0]}
//                               alt={item.product.title || "Product image"}
//                               width={24}
//                               height={24}
//                               className="w-6 h-6 object-cover rounded inline-block"
//                             />
//                           )}
//                           <span>{item.product?.title || item.title} <span className="text-muted-foreground">x {item.quantity}</span></span>
//                         </div>
//                       ))}
//                     </TableCell>
//                     <TableCell>${order.totalAmount}</TableCell>
//                     <TableCell>
//                       {order.trackingNumber ? (
//                         <div className="flex flex-col">
//                           <span className="font-medium">{order.trackingNumber}</span>
//                           <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery}</span>
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground">No tracking</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
//                         {expandedOrderId === order.id ? "Hide" : "View"}
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                   {expandedOrderId === order.id && (
//                     <TableRow>
//                       <TableCell colSpan={8} className="bg-muted/40 p-0">
//                         <div className="p-4 space-y-2">
//                           <div>
//                             <strong>Order ID:</strong> {order.id}
//                           </div>
//                           <div>
//                             <strong>Status:</strong> {order.status}
//                           </div>
//                           <div>
//                             <strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}
//                           </div>
//                           <div>
//                             <strong>Total Amount:</strong> ${order.totalAmount}
//                           </div>
//                           <div>
//                             <strong>Payment Method:</strong> {order.paymentMethod}
//                           </div>
//                           <div>
//                             <strong>Shipping Address:</strong> {order.shippingAddress}
//                           </div>
//                           <div>
//                             <strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}
//                           </div>
//                           <div>
//                             <strong>Estimated Delivery:</strong> {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}
//                           </div>
//                           <div>
//                             <strong>Items:</strong>
//                             <ul className="list-disc ml-6">
//                               {order.items?.map((item, i) => (
//                                 <li key={i}>
//                                   {item.product?.title || item.title} x {item.quantity} @ ${item.price}
//                                 </li>
//                               ))}
//                             </ul>
//                           </div>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       )}

//       {/* Tracking Modal */}
//       {activeTrackingOrder && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <Card className="w-full max-w-md shadow-2xl">
//             <CardHeader>
//               <div className="flex justify-between items-center">
//                 <CardTitle>Add Tracking Info</CardTitle>
//                 <Button variant="ghost" size="icon" onClick={() => setActiveTrackingOrder(null)}>
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//               <CardDescription>Enter details for Order #{activeTrackingOrder.id.slice(-6)}</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label>Tracking Number</Label>
//                 <Input 
//                   placeholder="e.g. 25422565632" 
//                   value={trackingData.trackingNumber}
//                   onChange={(e) => setTrackingData({...trackingData, trackingNumber: e.target.value})}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label>Estimated Delivery Date</Label>
//                 <Input 
//                   placeholder="e.g. 23 December 2025" 
//                   value={trackingData.estimatedDelivery}
//                   onChange={(e) => setTrackingData({...trackingData, estimatedDelivery: e.target.value})}
//                 />
//               </div>
//               <div className="flex gap-2 pt-4">
//                 <Button className="flex-1" onClick={submitTracking}>Save Tracking</Button>
//                 <Button variant="outline" className="flex-1" onClick={() => setActiveTrackingOrder(null)}>Cancel</Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Loader2, RefreshCcw, X, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CreditCard, MapPin, Calendar, ClipboardList, DollarSign, Hash, Download } from "lucide-react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 
import { toast } from "sonner";

const BASE_URL = "https://alpa-be-1.onrender.com";

// --- API HELPERS ---
const getAuthHeaders = () => {
  // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWppZjNrOTEwMDAyd296eDdma3BidWhxIiwidXNlclR5cGUiOiJzZWxsZXIiLCJyb2xlIjoiU0VMTEVSIiwiaWF0IjoxNzY2NDg0NTEzLCJleHAiOjE3NjkwNzY1MTN9.Y82RBMLKkta1bb1Lj7ZsWjKdHky4AwQe1lg80_yjjCk";
  const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

type OrderItem = {
  product: {
    images?: string[];
    title?: string;
  };
  title?: string;
  quantity: number;
  price?: string;
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

export default function OrdersPage() {
    // Only declare expandedOrderId once at the top of the component
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState({ trackingNumber: "", estimatedDelivery: "" });
  const [layout, setLayout] = useState<'table' | 'card'>("card");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  // 1. GET Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/seller/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // 2. UPDATE Status
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/seller/orders/update-status/${orderId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // 3. ADD Tracking
  const submitTracking = async () => {
    if (!activeTrackingOrder) return;
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

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
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer purchases and shipping status.</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant={layout === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('card')}>Card View</Button>
          <Button variant={layout === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setLayout('table')}>Tabular View</Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
      ) : layout === 'card' ? (
        <div className="grid gap-4">
          {paginatedOrders.map((order) => (
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
                  <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {order.status.toUpperCase()}
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
                              unoptimized
                            />
                          )}
                          <span>{renderValue(item.product?.title || item.title)} <span className="text-muted-foreground">x {renderValue(item.quantity)}</span></span>
                        </div>
                      ))}
                      <p className="font-bold pt-2 border-t flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total: ${renderValue(order.totalAmount)}</p>
                    </div>
                  </div>
                  {/* Actions: Update Status */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Management</Label>
                    <Select onValueChange={(val) => updateStatus(order.id, val)} defaultValue={renderValue(order.status) || "confirmed"}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {order.status ? renderValue(order.status).charAt(0).toUpperCase() + renderValue(order.status).slice(1) : "Confirmed"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
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
                            <Truck className="h-4 w-4" /> {renderValue(order.trackingNumber)}
                          </p>
                          <p className="text-blue-600/80 text-xs mt-1">Est: {renderValue(order.estimatedDelivery)}</p>
                       </div>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTrackingOrder(order)}>
                        <Truck className="h-4 w-4" /> Add Tracking
                      </Button>
                    )}
                  </div>
                </div>
                {expandedOrderId === order.id && (
                  <div className="mt-6 border-t pt-4 space-y-4 bg-muted/40 rounded p-4">
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
                        <p className="ml-6 text-sm font-medium">{renderShippingAddress(order.shippingAddress)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong className="text-muted-foreground mr-1">City:</strong> <span className="font-medium">{renderValue(order.shippingCity)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">State:</strong> <span className="font-medium">{renderValue(order.shippingState)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">Postcode:</strong> <span className="font-medium">{renderValue(order.shippingPostcode)}</span></div>
                        <div><strong className="text-muted-foreground mr-1">Phone:</strong> <span className="font-medium">{renderValue(order.shippingPhone)}</span></div>
                      </div>
                    </div>

                    {/* Download Invoice Button */}
                    {typeof order.status === 'string' && order.status.toLowerCase() !== 'pending' && (
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
                      <ul className="list-disc ml-8 text-sm space-y-1">
                        {order.items?.map((item, i) => (
                          <li key={i}>
                            <span className="font-medium">{renderValue(item.product?.title || item.title)}</span> x {renderValue(item.quantity)} @ ${renderValue(item.price)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
                <Fragment key={order.id}>
                  <TableRow>
                    <TableCell>#{typeof order.id === 'string' ? order.id.slice(-6).toUpperCase() : 'N/A'}</TableCell>
                    <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{renderValue(order.customerName || "Guest")}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                        {renderValue(order.status).toUpperCase()}
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
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2"><strong>Order ID:</strong> {renderValue(order.id)}</div>
                            <div className="flex items-center gap-2"><strong>Status:</strong> {renderValue(order.status).toUpperCase()}</div>
                            <div className="flex items-center gap-2"><strong>Created At:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
                            <div className="flex items-center gap-2"><strong>Total Amount:</strong> ${renderValue(order.totalAmount)}</div>
                            <div className="flex items-center gap-2"><strong>Payment Method:</strong> {renderValue(order.paymentMethod)}</div>
                            <div className="flex items-center gap-2"><strong>Tracking Number:</strong> {renderValue(order.trackingNumber || 'N/A')}</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1"><strong>Shipping Address:</strong></div>
                              <p className="text-sm font-medium">{renderShippingAddress(order.shippingAddress)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><strong className="text-muted-foreground mr-1">City:</strong> <span className="font-medium">{renderValue(order.shippingCity)}</span></div>
                              <div><strong className="text-muted-foreground mr-1">State:</strong> <span className="font-medium">{renderValue(order.shippingState)}</span></div>
                              <div><strong className="text-muted-foreground mr-1">Postcode:</strong> <span className="font-medium">{renderValue(order.shippingPostcode)}</span></div>
                              <div><strong className="text-muted-foreground mr-1">Phone:</strong> <span className="font-medium">{renderValue(order.shippingPhone)}</span></div>
                            </div>
                          </div>
                          
                          {/* Download Invoice Button */}
                          {typeof order.status === 'string' && order.status.toLowerCase() !== 'pending' && (
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
                            <strong>Items:</strong>
                            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
                              {order.items?.map((item, i) => (
                                <li key={i}>
                                  <span className="font-medium">{renderValue(item.product?.title || item.title)}</span> x {renderValue(item.quantity)} @ ${renderValue(item.price)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, orders.length)}</span>
              {"–"}
              <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, orders.length)}</span>
              {" of "}
              <span className="font-medium text-foreground">{orders.length}</span>
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