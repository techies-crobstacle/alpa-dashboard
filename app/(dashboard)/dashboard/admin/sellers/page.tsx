// "use client";
// import React from "react";
// import { useEffect, useState } from "react";
// // Cultural approval UI state type
// type CulturalApprovalState = {
//   approved: boolean;
//   feedback: string;
// };
//   // Per-seller cultural approval UI state
  
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import {
//   Search,
//   Check,
//   X,
//   Building2,
//   Store,
//   User,
//   Mail,
//   Phone,
//   Briefcase,
//   Package,
//   Calendar,
//   MapPin,
//   Banknote,
//   Tag,
//   Flag,
//   Globe,
// } from "lucide-react";

// // Helper for icons
// const iconClass = "inline-block mr-2 text-muted-foreground";

// import { api } from "@/lib/api";
// import { toast } from "sonner";

// type Seller = {
//   id: string;
//   sellerId: string;
//   email: string;
//   businessName: string;
//   storeName: string;
//   contactPerson: string;
//   phone: string;
//   businessType: string;
//   address: string;
//   productCount: number;
//   status: string;
//   minimumProductsUploaded: boolean;
//   createdAt: string;
//   updatedAt: string;
//   bankDetails?: {
//     bsb: string;
//     bankName: string;
//     accountName: string;
//     accountNumber: string;
//   };
//   culturalApprovalStatus?: string;
// };

// export default function SellersPage() {
//   const [culturalApproval, setCulturalApproval] = useState<Record<string, CulturalApprovalState>>({});
//   const [sellers, setSellers] = useState<Seller[]>([]);
//   const [expanded, setExpanded] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [tab, setTab] = useState("all");

//   // Fetch sellers from API
//   async function fetchSellers() {
//     setLoading(true);
//     try {
//       const res = await api.get("/api/admin/sellers");
//       setSellers(res.sellers || []);
//     } catch (err) {
//       toast.error("Failed to load sellers");
//       setSellers([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchSellers();
//   }, []);

//   // Approve seller
//   async function handleApprove(sellerId: string) {
//     try {
//       await api.post(`/api/admin/sellers/approve/${sellerId}`);
//       toast.success("Seller approved successfully");
//       fetchSellers();
//     } catch {
//       toast.error("Failed to approve seller");
//     } 
//   }

//   // Reject seller
//   async function handleReject(sellerId: string) {
//     try {
//       await api.post(`/api/admin/sellers/${sellerId}/reject`, {});
//       toast.success("Seller rejected");
//       fetchSellers();
//     } catch {
//       toast.error("Failed to reject seller");
//     }
//   }

//   // Activate seller
//   async function handleActivate(sellerId: string) {
//     try {
//       await api.post(`/api/admin/sellers/activate/${sellerId}`, {});
//       toast.success("Seller activated");
//       fetchSellers();
//     } catch {
//       toast.error("Failed to activate seller");
//     }
//   }

//   // Cultural approval
//   async function handleCulturalApproval(sellerId: string) {
//     const state = culturalApproval[sellerId] || { approved: true, feedback: "" };
//     try {
//       await api.post(`/api/admin/sellers/cultural-approval/${sellerId}`, {
//         approved: state.approved,
//         feedback: state.feedback,
//       });
//       toast.success("Cultural approval granted");
//       // Refetch sellers after a short delay to ensure backend update is reflected
//       setTimeout(() => {
//         fetchSellers();
//       }, 500);
//       // Optionally clear UI state
//       setCulturalApproval((prev) => ({ ...prev, [sellerId]: { approved: true, feedback: "" } }));
//     } catch (err: any) {
//       // Log and show server error if available
//       console.error("Cultural approval error:", err);
//       const message =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Failed to grant cultural approval";
//       toast.error("Failed to grant cultural approval", { description: message });
//     }
//   }

//   // Tab filtering logic
//   const filtered = sellers
//     .filter((seller) => {
//       if (tab === "pending") return seller.status === "PENDING";
//       if (tab === "rejected") return seller.status === "REJECTED";
//       return true;
//     })
//     .filter((seller) => {
//       if (!search.trim()) return true;
//       const s = search.trim().toLowerCase();
//       return (
//         seller.businessName?.toLowerCase().includes(s) ||
//         seller.storeName?.toLowerCase().includes(s) ||
//         seller.email?.toLowerCase().includes(s) ||
//         seller.contactPerson?.toLowerCase().includes(s)
//       );
//     });

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight">Sellers</h2>
//           <p className="text-muted-foreground">Manage seller accounts and requests.</p>
//         </div>
//       </div>
//       <Card>
//         <CardContent className="p-6">
//           <div className="flex flex-col md:flex-row md:items-center gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
//               <Input
//                 placeholder="Search sellers by name or email..."
//                 className="pl-8"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//       <Tabs value={tab} onValueChange={setTab} className="w-full">
//         <TabsList className="mb-4">
//           <TabsTrigger value="all">All Sellers</TabsTrigger>
//           <TabsTrigger value="pending">Pending Requests</TabsTrigger>
//           <TabsTrigger value="rejected">Rejected Sellers</TabsTrigger>
//         </TabsList>
//         <TabsContent value={tab} className="w-full">
//           <Card>
//             <CardHeader>
//               <CardTitle>
//                 {tab === "all" && "All Sellers"}
//                 {tab === "pending" && "Pending Requests"}
//                 {tab === "rejected" && "Rejected Sellers"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <div className="p-8">Loading sellers...</div>
//               ) : (
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Seller</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead>Created</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filtered.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={5} className="text-center">
//                           No sellers found.
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       filtered.map((seller) => (
//                         <>
//                           <TableRow key={seller.id}>
//                             <TableCell>
//                               <span className="font-medium block">
//                                 {seller.businessName}
//                               </span>
//                               <span className="text-xs text-muted-foreground block">
//                                 {seller.storeName}
//                               </span>
//                               <span className="text-xs text-muted-foreground block">
//                                 Contact: {seller.contactPerson}
//                               </span>
//                             </TableCell>
//                             <TableCell>{seller.email}</TableCell>
//                             <TableCell>
//                               <Badge
//                                 variant={
//                                   seller.status === "ACTIVE"
//                                     ? "default"
//                                     : seller.status === "PENDING"
//                                     ? "secondary"
//                                     : seller.status === "REJECTED"
//                                     ? "outline"
//                                     : "secondary"
//                                 }
//                               >
//                                 {seller.status.charAt(0) +
//                                   seller.status.slice(1).toLowerCase()}
//                               </Badge>
//                             </TableCell>
//                             <TableCell className="text-muted-foreground">
//                               {new Date(seller.createdAt).toLocaleDateString()}
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className="flex flex-col items-end gap-2">
//                                 <Button
//                                   size="sm"
//                                   variant="outline"
//                                   onClick={() =>
//                                     setExpanded(
//                                       expanded === seller.id ? null : seller.id
//                                     )
//                                   }
//                                 >
//                                   {expanded === seller.id
//                                     ? "Hide Details"
//                                     : "View Details"}
//                                 </Button>
//                                 {seller.status === "PENDING" && (
//                                   <div className="flex gap-2 mt-2">
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => handleApprove(seller.sellerId)}
//                                     >
//                                       <Check className="h-4 w-4 mr-1" /> Approve
//                                     </Button>
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => handleReject(seller.sellerId)}
//                                     >
//                                       <X className="h-4 w-4 mr-1" /> Reject
//                                     </Button>
//                                   </div>
//                                 )}
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                           {expanded === seller.id && (
//                             <React.Fragment key={seller.id + "-fragment"}>
//                               <TableRow key={seller.id + "-expanded"}>
//                                 <TableCell colSpan={5} className="bg-muted/40">
//                                   <div className="grid grid-cols-2 gap-4 py-4">
//                                     <div>
//                                       <Building2 className={iconClass} /> <span className="font-semibold">Business Name:</span> {seller.businessName}
//                                     </div>
//                                     <div>
//                                       <Store className={iconClass} /> <span className="font-semibold">Store Name:</span> {seller.storeName}
//                                     </div>
//                                     <div>
//                                       <User className={iconClass} /> <span className="font-semibold">Contact Person:</span> {seller.contactPerson}
//                                     </div>
//                                     <div>
//                                       <Mail className={iconClass} /> <span className="font-semibold">Email:</span> {seller.email}
//                                     </div>
//                                     <div>
//                                       <Phone className={iconClass} /> <span className="font-semibold">Phone:</span> {seller.phone}
//                                     </div>
//                                     <div>
//                                       <Briefcase className={iconClass} /> <span className="font-semibold">Business Type:</span> {seller.businessType}
//                                     </div>
//                                     <div>
//                                       <Package className={iconClass} /> <span className="font-semibold">Product Count:</span> {seller.productCount}
//                                     </div>
//                                     <div>
//                                       <Tag className={iconClass} /> <span className="font-semibold">Status:</span> {seller.status}
//                                     </div>
//                                     <div>
//                                       <Calendar className={iconClass} /> <span className="font-semibold">Created At:</span> {new Date(seller.createdAt).toLocaleString()}
//                                     </div>
//                                     <div>
//                                       <Calendar className={iconClass} /> <span className="font-semibold">Updated At:</span> {new Date(seller.updatedAt).toLocaleString()}
//                                     </div>
//                                     <div className="col-span-2">
//                                       <MapPin className={iconClass} /> <span className="font-semibold">Address:</span> {seller.address}
//                                     </div>
//                                     {seller.bankDetails && (
//                                       <div className="col-span-2">
//                                         <Banknote className={iconClass} /> <span className="font-semibold">Bank Details:</span> Bank: {seller.bankDetails.bankName}, Account Name: {seller.bankDetails.accountName}, Account Number: {seller.bankDetails.accountNumber}, BSB: {seller.bankDetails.bsb}
//                                       </div>
//                                     )}
//                                   </div>
//                                   <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
//                                     {seller.status === "PENDING" && (
//                                       <>
//                                         <Button onClick={() => handleApprove(seller.sellerId)} variant="default">
//                                           <Check className="h-4 w-4 mr-1" /> Approve Seller
//                                         </Button>
//                                         <Button onClick={() => handleReject(seller.sellerId)} variant="destructive">
//                                           <X className="h-4 w-4 mr-1" /> Reject Seller
//                                         </Button>
//                                       </>
//                                     )}
//                                     {seller.status !== "ACTIVE" && (
//                                       <Button onClick={() => handleActivate(seller.sellerId)} variant="secondary">
//                                         <Flag className="h-4 w-4 mr-1" /> Activate Seller
//                                       </Button>
//                                     )}
//                                     {seller.culturalApprovalStatus === "approved" ? (
//                                       <Badge variant="default">
//                                         <Globe className="h-4 w-4 mr-1" /> Cultural Approved
//                                       </Badge>
//                                     ) : (
//                                       <div className="flex flex-col gap-2 border p-3 rounded-md bg-muted/30">
//                                         <div className="flex items-center gap-4">
//                                           <span className="font-semibold">Cultural Approval:</span>
//                                           <label className="flex items-center gap-1">
//                                             <input
//                                               type="radio"
//                                               name={`cultural-approved-${seller.sellerId}`}
//                                               checked={culturalApproval[seller.sellerId]?.approved === true}
//                                               onChange={() => setCulturalApproval((prev) => ({
//                                                 ...prev,
//                                                 [seller.sellerId]: {
//                                                   ...prev[seller.sellerId],
//                                                   approved: true,
//                                                   feedback: prev[seller.sellerId]?.feedback || "Your Cultural is well Approved you can go live and sell your product"
//                                                 },
//                                               }))}
//                                             />
//                                             Approve
//                                           </label>
//                                           <label className="flex items-center gap-1">
//                                             <input
//                                               type="radio"
//                                               name={`cultural-approved-${seller.sellerId}`}
//                                               checked={culturalApproval[seller.sellerId]?.approved === false}
//                                               onChange={() => setCulturalApproval((prev) => ({
//                                                 ...prev,
//                                                 [seller.sellerId]: {
//                                                   ...prev[seller.sellerId],
//                                                   approved: false,
//                                                   feedback: prev[seller.sellerId]?.feedback || "Cultural approval denied. Please review your submission."
//                                                 },
//                                               }))}
//                                             />
//                                             Reject
//                                           </label>
//                                         </div>
//                                         <textarea
//                                           className="w-full border rounded p-2 text-sm"
//                                           rows={2}
//                                           placeholder="Enter feedback message..."
//                                           value={culturalApproval[seller.sellerId]?.feedback || ""}
//                                           onChange={(e) => setCulturalApproval((prev) => ({
//                                             ...prev,
//                                             [seller.sellerId]: {
//                                               ...prev[seller.sellerId],
//                                               feedback: e.target.value,
//                                               approved: prev[seller.sellerId]?.approved ?? true,
//                                             },
//                                           }))}
//                                         />
//                                         <Button
//                                           variant="outline"
//                                           onClick={() => handleCulturalApproval(seller.sellerId)}
//                                           disabled={loading}
//                                         >
//                                           <Globe className="h-4 w-4 mr-1" /> OK
//                                         </Button>
//                                       </div>
//                                     )}
//                                     {seller.status === "ACTIVE" && (
//                                       <Button onClick={() => toast("Product Go Live! (implement handler)")} variant="default">
//                                         <Check className="h-4 w-4 mr-1" /> Product Go Live
//                                       </Button>
//                                     )}
//                                   </div>
//                                 </TableCell>
//                               </TableRow>
//                             </React.Fragment>
//                           )}
//                         </>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

"use client";
import React from "react";
import { useEffect, useState } from "react";
// Cultural approval UI state type
type CulturalApprovalState = {
  approved: boolean;
  feedback: string;
};
  // Per-seller cultural approval UI state
  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Check,
  X,
  Building2,
  Store,
  User,
  Mail,
  Phone,
  Briefcase,
  Package,
  Calendar,
  MapPin,
  Banknote,
  Tag,
  Flag,
  Globe,
} from "lucide-react";

// Helper for icons
const iconClass = "inline-block mr-2 text-muted-foreground";

import { api } from "@/lib/api";
import { toast } from "sonner";

type Seller = {
  id: string;
  sellerId: string;
  email: string;
  businessName: string;
  storeName: string;
  contactPerson: string;
  phone: string;
  businessType: string;
  address: string;
  productCount: number;
  status: string;
  minimumProductsUploaded: boolean;
  createdAt: string;
  updatedAt: string;
  bankDetails?: {
    bsb: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  culturalApprovalStatus?: string;
};

export default function SellersPage() {
  const [culturalApproval, setCulturalApproval] = useState<Record<string, CulturalApprovalState>>({});
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Fetch sellers from API
  async function fetchSellers() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/sellers");
      setSellers(res.sellers || []);
    } catch (err) {
      toast.error("Failed to load sellers");
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSellers();
  }, []);

  // Approve seller
  async function handleApprove(sellerId: string) {
    try {
      await api.post(`/api/admin/sellers/approve/${sellerId}`);
      toast.success("Seller approved successfully");
      fetchSellers();
    } catch {
      toast.error("Failed to approve seller");
    } 
  }

  // Reject seller
  async function handleReject(sellerId: string) {
    try {
      await api.post(`/api/admin/sellers/${sellerId}/reject`, {});
      toast.success("Seller rejected");
      fetchSellers();
    } catch {
      toast.error("Failed to reject seller");
    }
  }

  // Activate seller
  async function handleActivate(sellerId: string) {
    try {
      await api.post(`/api/admin/sellers/activate/${sellerId}`, {});
      toast.success("Seller activated");
      fetchSellers();
    } catch (err: any) {
      // Check for specific error message from API
      const message = err?.response?.data?.message || err?.message || "Failed to activate seller";
      if (typeof message === "string" && message.includes("Seller must upload at least 1-2 products before going live")) {
        toast.error("Seller must upload at least 1-2 products before going live. 5+ products recommended.");
      } else {
        toast.error("Failed to activate seller");
      }
    }
  }

  // Cultural approval
  async function handleCulturalApproval(sellerId: string) {
    const state = culturalApproval[sellerId] || { approved: true, feedback: "" };
    try {
      await api.post(`/api/admin/sellers/cultural-approval/${sellerId}`, {
        approved: state.approved,
        feedback: state.feedback,
      });
      toast.success("Cultural approval granted");
      // Refetch sellers after a short delay to ensure backend update is reflected
      setTimeout(() => {
        fetchSellers();
      }, 500);
      // Optionally clear UI state
      setCulturalApproval((prev) => ({ ...prev, [sellerId]: { approved: true, feedback: "" } }));
    } catch (err: any) {
      // Log and show server error if available
      console.error("Cultural approval error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to grant cultural approval";
      toast.error("Failed to grant cultural approval", { description: message });
    }
  }

  // Tab filtering logic
  const filtered = sellers
    .filter((seller) => {
      if (tab === "pending") return seller.status === "PENDING";
      if (tab === "rejected") return seller.status === "REJECTED";
      return true;
    })
    .filter((seller) => {
      if (!search.trim()) return true;
      const s = search.trim().toLowerCase();
      return (
        seller.businessName?.toLowerCase().includes(s) ||
        seller.storeName?.toLowerCase().includes(s) ||
        seller.email?.toLowerCase().includes(s) ||
        seller.contactPerson?.toLowerCase().includes(s)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sellers</h2>
          <p className="text-muted-foreground">Manage seller accounts and requests.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search sellers by name or email..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Sellers</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Sellers</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>
                {tab === "all" && "All Sellers"}
                {tab === "pending" && "Pending Requests"}
                {tab === "rejected" && "Rejected Sellers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8">Loading sellers...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No sellers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((seller) => (
                        <React.Fragment key={seller.id}>
                          <TableRow key={seller.id}>
                            <TableCell>
                              <span className="font-medium block">
                                {seller.businessName}
                              </span>
                              <span className="text-xs text-muted-foreground block">
                                {seller.storeName}
                              </span>
                              <span className="text-xs text-muted-foreground block">
                                Contact: {seller.contactPerson}
                              </span>
                            </TableCell>
                            <TableCell>{seller.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  seller.status === "ACTIVE"
                                    ? "default"
                                    : seller.status === "PENDING"
                                    ? "secondary"
                                    : seller.status === "REJECTED"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {seller.status.charAt(0) +
                                  seller.status.slice(1).toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setExpanded(
                                      expanded === seller.id ? null : seller.id
                                    )
                                  }
                                >
                                  {expanded === seller.id
                                    ? "Hide Details"
                                    : "View Details"}
                                </Button>
                                {seller.status === "PENDING" && (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApprove(seller.sellerId)}
                                    >
                                      <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleReject(seller.sellerId)}
                                    >
                                      <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expanded === seller.id && (
                            <React.Fragment key={seller.id + "-fragment"}>
                              <TableRow key={seller.id + "-expanded"}>
                                <TableCell colSpan={5} className="bg-muted/40">
                                  <div className="grid grid-cols-2 gap-4 py-4">
                                    <div>
                                      <Building2 className={iconClass} /> <span className="font-semibold">Business Name:</span> {seller.businessName}
                                    </div>
                                    <div>
                                      <Store className={iconClass} /> <span className="font-semibold">Store Name:</span> {seller.storeName}
                                    </div>
                                    <div>
                                      <User className={iconClass} /> <span className="font-semibold">Contact Person:</span> {seller.contactPerson}
                                    </div>
                                    <div>
                                      <Mail className={iconClass} /> <span className="font-semibold">Email:</span> {seller.email}
                                    </div>
                                    <div>
                                      <Phone className={iconClass} /> <span className="font-semibold">Phone:</span> {seller.phone}
                                    </div>
                                    <div>
                                      <Briefcase className={iconClass} /> <span className="font-semibold">Business Type:</span> {seller.businessType}
                                    </div>
                                    <div>
                                      <Package className={iconClass} /> <span className="font-semibold">Product Count:</span> {seller.productCount}
                                    </div>
                                    <div>
                                      <Tag className={iconClass} /> <span className="font-semibold">Status:</span> {seller.status}
                                    </div>
                                    <div>
                                      <Calendar className={iconClass} /> <span className="font-semibold">Created At:</span> {new Date(seller.createdAt).toLocaleString()}
                                    </div>
                                    <div>
                                      <Calendar className={iconClass} /> <span className="font-semibold">Updated At:</span> {new Date(seller.updatedAt).toLocaleString()}
                                    </div>
                                     <div className="col-span-2">
                                       <MapPin className={iconClass} /> <span className="font-semibold">Address:</span> {seller.address}
                                     </div>
                                    {seller.bankDetails && (
                                      <div className="col-span-2">
                                        <Banknote className={iconClass} /> <span className="font-semibold">Bank Details:</span> Bank: {seller.bankDetails.bankName}, Account Name: {seller.bankDetails.accountName}, Account Number: {seller.bankDetails.accountNumber}, BSB: {seller.bankDetails.bsb}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                                    {seller.status === "PENDING" && (
                                      <>
                                        <Button onClick={() => handleApprove(seller.sellerId)} variant="default">
                                          <Check className="h-4 w-4 mr-1" /> Approve Seller
                                        </Button>
                                        <Button onClick={() => handleReject(seller.sellerId)} variant="destructive">
                                          <X className="h-4 w-4 mr-1" /> Reject Seller
                                        </Button>
                                      </>
                                    )}
                                    {seller.status !== "ACTIVE" && (
                                      <Button onClick={() => handleActivate(seller.sellerId)} variant="secondary">
                                        <Flag className="h-4 w-4 mr-1" /> Activate Seller
                                      </Button>
                                    )}
                                    {seller.culturalApprovalStatus === "approved" ? (
                                      <Badge variant="default">
                                        <Globe className="h-4 w-4 mr-1" /> Cultural Approved
                                      </Badge>
                                    ) : (
                                      <div className="flex flex-col gap-2 border p-3 rounded-md bg-muted/30">
                                        <div className="flex items-center gap-4">
                                          <span className="font-semibold">Cultural Approval:</span>
                                          <label className="flex items-center gap-1">
                                            <input
                                              type="radio"
                                              name={`cultural-approved-${seller.sellerId}`}
                                              checked={culturalApproval[seller.sellerId]?.approved === true}
                                              onChange={() => setCulturalApproval((prev) => ({
                                                ...prev,
                                                [seller.sellerId]: {
                                                  ...prev[seller.sellerId],
                                                  approved: true,
                                                  feedback: prev[seller.sellerId]?.feedback || "Your Cultural is well Approved you can go live and sell your product"
                                                },
                                              }))}
                                            />
                                            Approve
                                          </label>
                                          <label className="flex items-center gap-1">
                                            <input
                                              type="radio"
                                              name={`cultural-approved-${seller.sellerId}`}
                                              checked={culturalApproval[seller.sellerId]?.approved === false}
                                              onChange={() => setCulturalApproval((prev) => ({
                                                ...prev,
                                                [seller.sellerId]: {
                                                  ...prev[seller.sellerId],
                                                  approved: false,
                                                  feedback: prev[seller.sellerId]?.feedback || "Cultural approval denied. Please review your submission."
                                                },
                                              }))}
                                            />
                                            Reject
                                          </label>
                                        </div>
                                        <textarea
                                          className="w-full border rounded p-2 text-sm"
                                          rows={2}
                                          placeholder="Enter feedback message..."
                                          value={culturalApproval[seller.sellerId]?.feedback || ""}
                                          onChange={(e) => setCulturalApproval((prev) => ({
                                            ...prev,
                                            [seller.sellerId]: {
                                              ...prev[seller.sellerId],
                                              feedback: e.target.value,
                                              approved: prev[seller.sellerId]?.approved ?? true,
                                            },
                                          }))}
                                        />
                                        <Button
                                          variant="outline"
                                          onClick={() => handleCulturalApproval(seller.sellerId)}
                                          disabled={loading}
                                        >
                                          <Globe className="h-4 w-4 mr-1" /> OK
                                        </Button>
                                      </div>
                                    )}
                                    {seller.status === "ACTIVE" && (
                                      <Button onClick={() => toast("Product Go Live! (implement handler)")} variant="default">
                                        <Check className="h-4 w-4 mr-1" /> Product Go Live
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}