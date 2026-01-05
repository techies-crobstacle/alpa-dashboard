// "use client"
// import React, { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
// import { Loader2, Truck, Calendar, ClipboardList, DollarSign, Eye, ChevronDown, ChevronUp } from "lucide-react";
// import Image from "next/image";

// const BASE_URL = "https://alpa-be-1.onrender.com";

// function getAuthHeaders() {
//   const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
//   return {
//     "Content-Type": "application/json",
//     "Authorization": `Bearer ${token}`,
//   };
// }

// type OrderItem = {
//   product: { images?: string[]; title?: string };
//   title?: string;
//   quantity: number;
//   price?: string;
// };
// type Order = {
//   id: string;
//   createdAt: string;
//   status: string;
//   items?: OrderItem[];
//   totalAmount: number;
//   trackingNumber?: string;
//   estimatedDelivery?: string;
//   paymentMethod?: string;
//   shippingAddress?: string;
// };

// const CustomerOrdersPage = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
//       const res = await fetch(`${BASE_URL}/api/orders/my-orders`, {
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       });
//       const data = await res.json();
//       setOrders(data.orders || []);
//     } catch {
//       setOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
//           <p className="text-muted-foreground">View your order history and track your shipments.</p>
//         </div>
//       </div>
//       {orders.length === 0 ? (
//         <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border bg-background">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Order #</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Total</TableHead>
//                 <TableHead>Tracking</TableHead>
//                 <TableHead>View</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {orders.map((order) => (
//                 <React.Fragment key={order.id}>
//                   <TableRow>
//                     <TableCell>#{order.id.slice(-6).toUpperCase()}</TableCell>
//                     <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
//                     <TableCell>
//                       <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status.toUpperCase()}</Badge>
//                     </TableCell>
//                     <TableCell>${order.totalAmount}</TableCell>
//                     <TableCell>
//                       {order.trackingNumber ? (
//                         <div className="flex flex-col">
//                           <span className="font-medium flex items-center gap-1"><Truck className="h-4 w-4" /> {order.trackingNumber}</span>
//                           <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery}</span>
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground">No tracking</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
//                         {expandedOrderId === order.id ? <><Eye className="h-4 w-4" /> Hide <ChevronUp className="h-4 w-4" /></> : <><Eye className="h-4 w-4" /> View <ChevronDown className="h-4 w-4" /></>}
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                   {expandedOrderId === order.id && (
//                     <TableRow>
//                       <TableCell colSpan={6} className="bg-muted/40 p-0">
//                         <div className="p-4 space-y-2">
//                           <div><strong>Status:</strong> {order.status}</div>
//                           <div><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</div>
//                           <div><strong>Total Amount:</strong> ${order.totalAmount}</div>
//                           <div><strong>Payment Method:</strong> {order.paymentMethod}</div>
//                           <div><strong>Shipping Address:</strong> {order.shippingAddress}</div>
//                           <div><strong>Tracking Number:</strong> {order.trackingNumber || 'N/A'}</div>
//                           <div><strong>Estimated Delivery:</strong> {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}</div>
//                           <div><strong>Items:</strong>
//                             <ul className="list-disc ml-6">
//                               {order.items?.map((item, i) => (
//                                 <li key={i}>
//                                   {item.product?.title || item.title} x {item.quantity} @ ${item.price}
//                                   {item.product?.images?.[0] && (
//                                     <Image src={item.product.images[0]} alt={item.product.title || "Product image"} width={32} height={32} className="inline ml-2 rounded object-cover" unoptimized />
//                                   )}
//                                 </li>
//                               ))}
//                             </ul>
//                           </div>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </React.Fragment>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomerOrdersPage;


"use client"
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, Calendar, ClipboardList, DollarSign, Eye, ChevronDown, ChevronUp, Package, CheckCircle2, XCircle } from "lucide-react";
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

const OrderProgressTracker = ({ status }: { status: string }) => {
  const statuses = ['pending', 'shipped', 'delivered'];
  const isCancelled = status === 'cancelled';
  
  const getStatusIndex = (orderStatus: string) => {
    const lowerStatus = orderStatus.toLowerCase();
    return statuses.indexOf(lowerStatus);
  };

  const currentIndex = getStatusIndex(status);

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
          
          return (
            <div key={statusName} className="flex flex-col items-center flex-1">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
              >
                {statusName === 'pending' && <ClipboardList className="h-6 w-6" />}
                {statusName === 'shipped' && <Truck className="h-6 w-6" />}
                {statusName === 'delivered' && <CheckCircle2 className="h-6 w-6" />}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
                    <td className="px-4 py-3">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">${order.totalAmount}</td>
                    <td className="px-4 py-3">
                      {order.trackingNumber ? (
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-1"><Truck className="h-4 w-4" /> {order.trackingNumber}</span>
                          <span className="text-xs text-muted-foreground">Est: {order.estimatedDelivery}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tracking</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                        {expandedOrderId === order.id ? <><Eye className="h-4 w-4" /> Hide <ChevronUp className="h-4 w-4" /></> : <><Eye className="h-4 w-4" /> View <ChevronDown className="h-4 w-4" /></>}
                      </Button>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={6} className="bg-muted/40 p-0">
                        <div className="p-6 space-y-6">
                          {/* Progress Tracker */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Order Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <OrderProgressTracker status={order.status} />
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
                                  <p className="font-medium">{order.status}</p>
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
                                  <span className="text-sm text-muted-foreground">Tracking Number</span>
                                  <p className="font-medium">{order.trackingNumber || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                                  <p className="font-medium">{order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}</p>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Shipping Address</span>
                                <p className="font-medium">{order.shippingAddress}</p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Order Items */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {order.items?.map((item, i) => (
                                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                                    {item.product?.images?.[0] && (
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
                                      <p className="font-medium">{item.product?.title || item.title}</p>
                                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">${item.price}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
    </div>
  );
};

export default CustomerOrdersPage;