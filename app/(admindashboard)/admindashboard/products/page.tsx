// "use client";

// import React from "react";
// import { useState, useEffect, useRef } from "react";
// import { ProductActivityLog } from "@/components/shared/product-activity-log"; // ── Activity Log
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Package, DollarSign, Edit, X, Search, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle } from "lucide-react";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Loader2, Image as LucideImage } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
// import Image from "next/image";
// import { api } from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// type Seller = {
//   id: string;
//   name: string;
//   email: string;
//   pendingCount: number;
// };

// type Product = {
//   id: string;
//   title: string;
//   price: number;
//   status: string;
//   images?: string[];
//   featuredImage?: string | null;
//   galleryImages?: string[];
//   description?: string;
//   category?: string;
//   stock?: number;
//   featured?: boolean;
//   tags?: string[] | string;
//   seller_id?: string;
//   sellerId?: string;
//   userId?: string;
// };

// // ─── helpers ──────────────────────────────────────────────────────────────────
// const productBelongsTo = (p: Product, sellerId: string) =>
//   p.seller_id === sellerId || p.sellerId === sellerId || p.userId === sellerId;

// const parsePendingResponse = (res: any): Product[] => {
//   if (res?.success && res?.products) return res.products;
//   if (res?.data) return res.data;
//   if (Array.isArray(res)) return res;
//   return [];
// };

// // ─── Pending pill component ───────────────────────────────────────────────────
// function PendingPill({ count }: { count: number }) {
//   if (count > 0) {
//     return (
//       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 whitespace-nowrap">
//         {count} pending
//       </span>
//     );
//   }
//   return (
//     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
//       0 pending
//     </span>
//   );
// }

// export default function AdminProductsPage() {
//   // Redirect to login if not authenticated
//   React.useEffect(() => {
//     if (typeof document !== "undefined") {
//       const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]*)/);
//       const roleMatch = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
//       if (!tokenMatch || !roleMatch) {
//         window.location.href = "/auth/login";
//       }
//     }
//   }, []);

//   const [sellers, setSellers] = useState<Seller[]>([]);
//   const [selectedSeller, setSelectedSeller] = useState<string>("");
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [loadingSellers, setLoadingSellers] = useState(true);
// 
//   const [activeView, setActiveView] = useState<"all" | "approved" | "pending" | "rejected">("approved");
//   const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
//   const [loadingPending, setLoadingPending] = useState(false);
//   const [allProducts, setAllProducts] = useState<Product[]>([]);
//   const [loadingAll, setLoadingAll] = useState(false);
//   const [rejectedProducts, setRejectedProducts] = useState<Product[]>([]);
//   const [loadingRejected, setLoadingRejected] = useState(false);

//   const allPendingRef = useRef<Product[]>([]);
//   const allRejectedRef = useRef<Product[]>([]);

//   const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [rejectProductId, setRejectProductId] = useState<string | null>(null);
//   const [rejectReason, setRejectReason] = useState("");
//   const [rejectSubmitting, setRejectSubmitting] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editSubmitting, setEditSubmitting] = useState(false);
//   const [editProductId, setEditProductId] = useState<string | null>(null);
//   const [editFormData, setEditFormData] = useState({
//     title: "",
//     description: "",
//     price: "",
//     stock: "",
//     category: "",
//     images: [] as File[],
//     oldImages: [] as string[],
//     featuredImage: null as File | null,
//     oldFeaturedImage: null as string | null,
//     galleryImages: [] as File[],
//     oldGalleryImages: [] as string[],
//     featured: false,
//     tags: "",
//     artistName: "",
//   });

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(12);

//   const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
//   const sellerDropdownRef = useRef<HTMLDivElement>(null);
//   const [isEditCatOpen, setIsEditCatOpen] = useState(false);
//   const [editCatSearch, setEditCatSearch] = useState("");
//   const editCatDropdownRef = useRef<HTMLDivElement>(null);
//   const [availableCategories, setAvailableCategories] = useState<any[]>([]);

//   const editFeaturedImageRef = useRef<HTMLInputElement>(null);
//   const editGalleryImagesRef = useRef<HTMLInputElement>(null);

//   // Mutable accumulator ref for gallery files — always current, no stale closure
//   const editGalleryAccumRef = useRef<File[]>([]);

//   const selectedSellerRef = useRef(selectedSeller);
//   const activeViewRef = useRef(activeView);
//   const sellersRef = useRef<Seller[]>([]);
//   useEffect(() => { selectedSellerRef.current = selectedSeller; }, [selectedSeller]);
//   useEffect(() => { activeViewRef.current = activeView; }, [activeView]);
//   useEffect(() => { sellersRef.current = sellers; }, [sellers]);

//   const totalProducts = products.length;
//   const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
//   const totalRevenue = products.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0);

//   // ── click-outside ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(e.target as Node)) setIsEditCatOpen(false);
//       if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) setIsSellerDropdownOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   // ── categories ─────────────────────────────────────────────────────────────
//   const loadCategories = async () => {
//     try {
//       const res = await api.get("/api/categories/");
//       if (res?.success && res?.data) setAvailableCategories(res.data.approvedCategories || []);
//     } catch (e) {
//       console.error("Error fetching categories:", e);
//     }
//   };
//   useEffect(() => { loadCategories(); }, []);

//   // ── refresh pending products ───────────────────────────────────────────────
//   const refreshPending = async (currentSellers: Seller[]): Promise<Product[]> => {
//     try {
//       const res = await api.get("/api/admin/products/pending");
//       const allPending = parsePendingResponse(res);
//       allPendingRef.current = allPending;
//       setSellers(
//         currentSellers.map((s) => ({
//           ...s,
//           pendingCount: allPending.filter((p) => productBelongsTo(p, s.id)).length,
//         }))
//       );
//       return allPending;
//     } catch (err) {
//       console.error("Failed to fetch pending products:", err);
//       return allPendingRef.current;
//     }
//   };

//   // ── fetch sellers ──────────────────────────────────────────────────────────
//   const fetchSellers = async () => {
//     setLoadingSellers(true);
//     try {
//       const res = await api.get("/api/users/all");
//       const rawSellers: Seller[] = (Array.isArray(res) ? res : res.users || [])
//         .filter((u: any) => u.role === "SELLER")
//         .map((u: any) => ({ ...u, pendingCount: 0 }));
//       setSellers(rawSellers);
//       if (rawSellers.length > 0 && !selectedSeller) setSelectedSeller(rawSellers[0].id);
//       await refreshPending(rawSellers);
//     } catch (err: any) {
//       toast.error(`Failed to load sellers: ${err?.message || "Unknown error"}`);
//       setSellers([]);
//     } finally {
//       setLoadingSellers(false);
//     }
//   };

//   // ── fetch approved products ────────────────────────────────────────────────
//   const fetchProducts = async (sellerId: string) => {
//     setLoading(true);
//     try {
//       const res = await api.get(`/api/admin/sellers/${sellerId}/products`);
//       let data: Product[] = [];
//       if (res?.success && res?.products) data = res.products;
//       else if (Array.isArray(res)) data = res;
//       else if (res?.data) data = res.data;
//       setProducts(data);
//     } catch (err: any) {
//       toast.error(`Failed to load products: ${err?.message || "Unknown error"}`);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const applyPendingFilter = (sellerId: string) => {
//     setLoadingPending(true);
//     setPendingProducts(allPendingRef.current.filter((p) => productBelongsTo(p, sellerId)));
//     setLoadingPending(false);
//   };

//   // ── fetch all products (all statuses) ─────────────────────────────────────
//   const fetchAllProducts = async (sellerId: string) => {
//     setLoadingAll(true);
//     try {
//       const res = await api.get(`/api/admin/sellers/${sellerId}/products/all`);
//       let data: Product[] = [];
//       if (res?.success && res?.products) data = res.products;
//       else if (Array.isArray(res)) data = res;
//       else if (res?.data) data = res.data;
//       setAllProducts(data);
//     } catch (err: any) {
//       toast.error(`Failed to load all products: ${err?.message || "Unknown error"}`);
//       setAllProducts([]);
//     } finally {
//       setLoadingAll(false);
//     }
//   };

//   // ── fetch rejected products ────────────────────────────────────────────────
//   const refreshRejected = async (currentSellers: Seller[]): Promise<Product[]> => {
//     try {
//       const res = await api.get("/api/admin/products/rejected");
//       let all: Product[] = [];
//       if (res?.success && res?.products) all = res.products;
//       else if (Array.isArray(res)) all = res;
//       else if (res?.data) all = res.data;
//       allRejectedRef.current = all;
//       return all;
//     } catch (err) {
//       console.error("Failed to fetch rejected products:", err);
//       return allRejectedRef.current;
//     }
//   };

//   const applyRejectedFilter = (sellerId: string) => {
//     setLoadingRejected(true);
//     setRejectedProducts(allRejectedRef.current.filter((p) => productBelongsTo(p, sellerId)));
//     setLoadingRejected(false);
//   };

//   useEffect(() => { fetchSellers(); }, []); // eslint-disable-line

//   // Pre-load rejected when sellers are loaded
//   useEffect(() => {
//     if (sellers.length > 0) refreshRejected(sellers);
//   }, [sellers.length]); // eslint-disable-line

//   useEffect(() => {
//     if (!selectedSeller) { setProducts([]); setPendingProducts([]); setAllProducts([]); setRejectedProducts([]); return; }
//     if (activeView === "approved") fetchProducts(selectedSeller);
//     else if (activeView === "pending") applyPendingFilter(selectedSeller);
//     else if (activeView === "all") fetchAllProducts(selectedSeller);
//     else if (activeView === "rejected") applyRejectedFilter(selectedSeller);
//     setCurrentPage(1);
//   }, [selectedSeller, activeView]); // eslint-disable-line

//   // ── edit modal ─────────────────────────────────────────────────────────────
//   const openEditModal = async (productId: string) => {
//     if (activeView !== "approved" && activeView !== "all") { toast.error("Approve the product first before editing."); return; }
//     setEditProductId(productId);
//     setEditSubmitting(false);
//     editGalleryAccumRef.current = [];

//     try {
//       const res = await api.get(`/api/products/${productId}`);
//       const prod = res.product || res;

//       // Log the raw product to diagnose key names
//       console.log("[openEditModal] raw product keys:", Object.keys(prod));
//       console.log("[openEditModal] raw product:", JSON.stringify(prod, null, 2));

//       // ── FIX: resolve gallery images from ALL possible keys ──────────────
//       // APIs sometimes return gallery as "galleryImages", "images", or both.
//       // We merge them, deduplicate, and exclude the featured image.
//       const featuredImg: string | null = prod.featuredImage || null;

//       const rawGallery: string[] = [
//         ...(Array.isArray(prod.galleryImages) ? prod.galleryImages : []),
//         ...(Array.isArray(prod.images) ? prod.images : []),
//       ];

//       // Deduplicate and remove featured image from gallery list
//       const resolvedGallery: string[] = [...new Set(rawGallery)].filter(
//         (img) => img !== featuredImg
//       );

//       console.log("[openEditModal] featuredImage:", featuredImg);
//       console.log("[openEditModal] resolvedGallery:", resolvedGallery);

//       setEditFormData({
//         title: prod.title || "",
//         description: prod.description || "",
//         price: prod.price?.toString() || "",
//         stock: prod.stock?.toString() || "",
//         category: prod.category || "",
//         images: [],
//         oldImages: prod.images || [],
//         featuredImage: null,
//         oldFeaturedImage: featuredImg,
//         galleryImages: [],
//         oldGalleryImages: resolvedGallery, // ← correctly populated now
//         featured: prod.featured ?? false,
//         tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
//         artistName: prod.artistName || "",
//       });

//       setShowEditModal(true);
//     } catch (err: any) {
//       toast.error(err.message || "Failed to load product");
//     }
//   };

//   const handleEditProduct = async () => {
//     if (!editProductId) return;
//     if (!editFormData.title || !editFormData.price || !editFormData.stock) {
//       toast.error("Please fill in all required fields");
//       return;
//     }

//     try {
//       setEditSubmitting(true);
//       const form = new FormData();
//       form.append("title", editFormData.title.trim());
//       form.append("description", editFormData.description.trim());
//       form.append("price", String(editFormData.price));
//       form.append("stock", String(editFormData.stock));
//       form.append("category", editFormData.category.trim());
//       form.append("featured", String(editFormData.featured));
//       form.append("tags", editFormData.tags);
//       if (editFormData.artistName) form.append("artistName", editFormData.artistName.trim());

//       // Featured image: prefer new file from ref, fall back to old URL
//       const featuredFile = editFeaturedImageRef.current?.files?.[0] ?? null;
//       if (featuredFile) {
//         form.append("featuredImage", featuredFile);
//       } else if (editFormData.oldFeaturedImage) {
//         // Tell backend to keep the existing featured image
//         form.append("oldFeaturedImage", editFormData.oldFeaturedImage);
//       }

//       // ── Gallery images ────────────────────────────────────────────────────
//       // Use the same key "galleryImages" for BOTH existing URLs and new Files.
//       // This matches the Postman tests and ensures the backend doesn't wipe old ones.
      
//       // 1. Append existing URLs to keep them
//       if (editFormData.oldGalleryImages?.length > 0) {
//         editFormData.oldGalleryImages.forEach((url) => {
//           form.append("galleryImages", url);
//         });
//       }

//       // 2. Append new File objects
//       const galleryFiles = [...editGalleryAccumRef.current];
//       if (galleryFiles.length > 0) {
//         galleryFiles.forEach((f) => {
//           form.append("galleryImages", f);
//         });
//       }

//       // Debug — verify in browser console before sending
//       console.log("[handleEditProduct] galleryImages contents (total):", editFormData.oldGalleryImages.length + galleryFiles.length);
//       console.log("[handleEditProduct] existing URLs:", editFormData.oldGalleryImages);
//       console.log("[handleEditProduct] new files:", galleryFiles.map((f) => f.name));

//       await api.put(`/api/products/${editProductId}`, form);
//       toast.success("Product updated successfully!");
//       setShowEditModal(false);
//       setEditProductId(null);
//       editGalleryAccumRef.current = [];
//       fetchProducts(selectedSeller);
//     } catch (err: any) {
//       toast.error(err.message || "Failed to update product");
//     } finally {
//       setEditSubmitting(false);
//     }
//   };

//   // ── approve / reject / inactivate / activate ──────────────────────────────
//   const handleInactivate = async (productId: string) => {
//     try {
//       await api.put(`/api/admin/products/deactivate/${productId}`);
//       toast.success("Product marked as inactive");
//       fetchProducts(selectedSeller);
//     } catch {
//       toast.error("Failed to inactivate product");
//     }
//   };

//   const handleActivate = async (productId: string) => {
//     try {
//       await api.put(`/api/admin/products/activate/${productId}`);
//       toast.success("Product activated successfully!");
//       fetchProducts(selectedSeller);
//     } catch {
//       toast.error("Failed to activate product");
//     }
//   };

//   const handleApproveProduct = async (productId: string) => {
//     try {
//       await api.post(`/api/admin/products/approve/${productId}`);
//       toast.success("Product approved successfully!");
//       const fresh = await refreshPending(sellersRef.current);
//       setPendingProducts(fresh.filter((p) => productBelongsTo(p, selectedSeller)));
//     } catch (err: any) {
//       toast.error(err.message || "Failed to approve product");
//     }
//   };

//   const openRejectModal = (productId: string) => {
//     setRejectProductId(productId);
//     setRejectReason("");
//     setShowRejectModal(true);
//   };

//   const handleRejectProduct = async () => {
//     if (!rejectProductId) return;
//     if (!rejectReason.trim()) {
//       toast.error("Please enter a rejection reason.");
//       return;
//     }
//     try {
//       setRejectSubmitting(true);
//       await api.delete(`/api/admin/products/reject/${rejectProductId}`, { reason: rejectReason.trim() });
//       toast.success("Product rejected successfully!");
//       setShowRejectModal(false);
//       setRejectProductId(null);
//       setRejectReason("");
//       const fresh = await refreshPending(sellersRef.current);
//       setPendingProducts(fresh.filter((p) => productBelongsTo(p, selectedSeller)));
//       await refreshRejected(sellersRef.current);
//       if (activeView === "rejected") applyRejectedFilter(selectedSeller);
//     } catch (err: any) {
//       toast.error(err.message || "Failed to reject product");
//     } finally {
//       setRejectSubmitting(false);
//     }
//   };

//   const currentProducts =
//     activeView === "approved" ? products :
//     activeView === "pending" ? pendingProducts :
//     activeView === "all" ? allProducts :
//     rejectedProducts;

//   const totalPages = Math.max(1, Math.ceil(currentProducts.length / itemsPerPage));
//   const paginatedProducts = currentProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(Math.min(Math.max(1, page), totalPages));
//     setExpandedProductId(null);
//   };

//   const getPaginationPages = (): (number | "...")[] => {
//     const pages: (number | "...")[] = [];
//     if (totalPages <= 7) {
//       for (let i = 1; i <= totalPages; i++) pages.push(i);
//     } else {
//       pages.push(1);
//       if (currentPage > 3) pages.push("...");
//       const start = Math.max(2, currentPage - 1);
//       const end = Math.min(totalPages - 1, currentPage + 1);
//       for (let i = start; i <= end; i++) pages.push(i);
//       if (currentPage < totalPages - 2) pages.push("...");
//       pages.push(totalPages);
//     }
//     return pages;
//   };

//   // ── render ─────────────────────────────────────────────────────────────────
//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">

//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Products</h1>
//           <p className="text-muted-foreground">View and manage products by seller.</p>
//         </div>

//         <div className="flex gap-4 items-end w-full md:w-auto md:justify-end justify-between">

//           {/* Seller Dropdown */}
//           <div className="min-w-[260px] relative" ref={sellerDropdownRef}>
//             <label className="block mb-1 font-medium">Select Seller</label>
//             <div
//               className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
//               onClick={() => setIsSellerDropdownOpen((v) => !v)}
//             >
//               <span className={selectedSeller ? "text-foreground font-medium" : "text-muted-foreground"}>
//                 {selectedSeller ? (() => {
//                   const s = sellers.find((s) => s.id === selectedSeller);
//                   if (!s) return "Select a seller";
//                   return (
//                     <span className="flex items-center gap-2">
//                       {s.name} <PendingPill count={s.pendingCount} />
//                     </span>
//                   );
//                 })() : "Select a seller"}
//               </span>
//               <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isSellerDropdownOpen && "rotate-180")} />
//             </div>

//             {isSellerDropdownOpen && (
//               <div className="absolute z-[60] left-0 w-full mt-1 bg-background rounded-lg border shadow-xl p-1 min-w-[400px] animate-in fade-in zoom-in-95">
//                 <div className="max-h-[300px] overflow-y-auto">
//                   {loadingSellers ? (
//                     <div className="py-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
//                   ) : sellers.length === 0 ? (
//                     <div className="py-4 text-center text-sm text-muted-foreground">No sellers found.</div>
//                   ) : sellers.map((seller) => (
//                     <div
//                       key={seller.id}
//                       className={cn(
//                         "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
//                         selectedSeller === seller.id && "bg-primary/5 text-primary font-medium"
//                       )}
//                       onClick={(e) => { e.stopPropagation(); setSelectedSeller(seller.id); setIsSellerDropdownOpen(false); }}
//                     >
//                       <div className={cn(
//                         "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary transition-all",
//                         selectedSeller === seller.id ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
//                       )}>
//                         {selectedSeller === seller.id && <Check className="h-3 w-3" />}
//                       </div>
//                       <div className="flex flex-1 items-center justify-between min-w-0">
//                         <div className="flex flex-col min-w-0 mr-3">
//                           <span className="font-medium truncate">{seller.name}</span>
//                           <span className="text-xs text-muted-foreground truncate">{seller.email}</span>
//                         </div>
//                         <PendingPill count={seller.pendingCount} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex gap-2 items-end">
//             <Button variant={layout === "table" ? "default" : "outline"} size="sm" onClick={() => setLayout("table")}>Tabular View</Button>
//             <Button variant={layout === "card" ? "default" : "outline"} size="sm" onClick={() => setLayout("card")}>Card View</Button>
//           </div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-2 border-b">
//         <Button variant={activeView === "all" ? "default" : "ghost"} onClick={() => setActiveView("all")} className="rounded-b-none">
//           All ({allProducts.length})
//         </Button>
//         <Button variant={activeView === "approved" ? "default" : "ghost"} onClick={() => setActiveView("approved")} className="rounded-b-none">
//           Approved ({products.length})
//         </Button>
//         <Button variant={activeView === "pending" ? "default" : "ghost"} onClick={() => setActiveView("pending")} className="rounded-b-none">
//           Pending ({sellers.find((s) => s.id === selectedSeller)?.pendingCount ?? pendingProducts.length})
//         </Button>
//         <Button variant={activeView === "rejected" ? "default" : "ghost"} onClick={() => setActiveView("rejected")} className="rounded-b-none text-red-500 hover:text-red-600">
//           Rejected ({rejectedProducts.length})
//         </Button>
//       </div>

//       {/* Stats */}
//       <div className="grid gap-4 md:grid-cols-3">
//         {[
//           {
//             label: activeView === "approved" ? "Total Products" : activeView === "pending" ? "Pending Products" : activeView === "all" ? "All Products" : "Rejected Products",
//             value: activeView === "approved" ? totalProducts : activeView === "pending" ? pendingProducts.length : activeView === "all" ? allProducts.length : rejectedProducts.length,
//             icon: <Package className="h-4 w-4 text-muted-foreground" />
//           },
//           {
//             label: activeView === "approved" ? "Total Stock" : activeView === "pending" ? "Pending Stock" : activeView === "all" ? "Total Stock" : "Rejected Stock",
//             value: activeView === "approved" ? totalStock : activeView === "pending" ? pendingProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0) : activeView === "all" ? allProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0) : rejectedProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0),
//             icon: <Package className="h-4 w-4 text-muted-foreground" />
//           },
//           {
//             label: activeView === "approved" ? "Estimated Revenue" : "Potential Revenue",
//             value: "$" + currentProducts.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0).toLocaleString(),
//             icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
//           },
//         ].map((c) => (
//           <Card key={c.label}>
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium">{c.label}</CardTitle>{c.icon}
//             </CardHeader>
//             <CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Product list */}
//       {(activeView === "approved" ? loading : activeView === "pending" ? loadingPending : activeView === "all" ? loadingAll : loadingRejected) ? (
//         <div className="overflow-x-auto rounded-lg border bg-background">
//             <table className="min-w-full divide-y divide-muted">
//               <thead className="bg-muted/50">
//                 <tr>
//                   {["Image", "Title", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
//                     <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-muted">
//                 {Array.from({ length: 7 }).map((_, i) => (
//                   <tr key={i}>
//                     <td className="px-4 py-3"><Skeleton className="h-12 w-12 rounded" /></td>
//                     <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
//                     <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
//                     <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
//                     <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
//                     <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-1">
//                         <Skeleton className="h-8 w-16 rounded-md" />
//                         <Skeleton className="h-8 w-20 rounded-md" />
//                         <Skeleton className="h-8 w-14 rounded-md" />
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//       ) : currentProducts.length === 0 ? (
//         <Card className="col-span-full text-center py-12">No {activeView === "approved" ? "approved" : activeView === "pending" ? "pending" : activeView === "rejected" ? "rejected" : ""} products found.</Card>
//       ) : (

//         /* TABLE VIEW */
//         <div className="overflow-x-auto rounded-lg border bg-background">
//           <table className="min-w-full divide-y divide-muted">
//             <thead className="bg-muted/50">
//               <tr>
//                 {["Image", "Title", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
//                   <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-muted">
//               {paginatedProducts.map((product) => (
//                 <React.Fragment key={product.id}>
//                   <tr className="hover:bg-muted/20">
//                     <td className="px-4 py-2">
//                       {(product.featuredImage || product.images?.length) ? (
//                         <Image src={product.featuredImage || product.images![0]} alt={product.title || "Product"} width={48} height={48}
//                           className="h-12 w-12 object-cover rounded"
//                           onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image"; }} />
//                       ) : (
//                         <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
//                           <LucideImage className="h-6 w-6 text-muted-foreground/50" />
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-4 py-2 font-semibold">{product.title}</td>
//                     <td className="px-4 py-2">{product.category}</td>
//                     <td className="px-4 py-2 text-primary font-bold">${product.price}</td>
//                     <td className="px-4 py-2">{product.stock}</td>
//                     <td className="px-4 py-2">
//                       <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
//                         {product.status || "Active"}
//                       </Badge>
//                     </td>
//                     <td className="px-4 py-2">
//                       <div className="flex gap-1 items-center">
//                         {(activeView === "approved" || (activeView === "all" && product.status !== "PENDING" && product.status !== "REJECTED")) ? (
//                           <>
//                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(product.id)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
//                             <Button variant="outline" size="icon" className="h-8 w-8"
//                               onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
//                               title={expandedProductId === product.id ? "Hide" : "View"}>
//                               {expandedProductId === product.id ? <X className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
//                             </Button>
//                             <div className="flex items-center gap-1.5 px-2">
//                               <Switch
//                                 checked={product.status !== "INACTIVE"}
//                                 onCheckedChange={(checked) =>
//                                   checked ? handleActivate(product.id) : handleInactivate(product.id)
//                                 }
//                               />
//                               <span className={`text-xs font-medium ${product.status === "INACTIVE" ? "text-red-500" : "text-green-600"}`}>
//                                 {product.status === "INACTIVE" ? "Inactive" : "Active"}
//                               </span>
//                             </div>
//                           </>
//                         ) : (activeView === "pending" || (activeView === "all" && product.status === "PENDING")) ? (
//                           <>
//                             <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
//                             <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openRejectModal(product.id)}><XCircle className="h-3 w-3" />Reject</Button>
//                             <Button variant="outline" size="icon" className="h-8 w-8"
//                               onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
//                               title={expandedProductId === product.id ? "Hide" : "View"}>
//                               {expandedProductId === product.id ? <X className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
//                             </Button>
//                           </>
//                         ) : (
//                           /* rejected view or all+rejected status: view only */
//                           <Button variant="outline" size="icon" className="h-8 w-8"
//                             onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
//                             title={expandedProductId === product.id ? "Hide" : "View"}>
//                             {expandedProductId === product.id ? <X className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
//                           </Button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                   {expandedProductId === product.id && (
//                     <tr><td colSpan={7} className="bg-muted/10 p-4">
//                       <div className="grid md:grid-cols-2 gap-4">
//                         <div>
//                           <h3 className="font-bold text-lg mb-2">{product.title}</h3>
//                           <p className="mb-2 text-muted-foreground">{product.description}</p>
//                           <div className="mb-2"><strong>Category:</strong> {product.category}</div>
//                           <div className="mb-2"><strong>Price:</strong> ${product.price}</div>
//                           <div className="mb-2"><strong>Stock:</strong> {product.stock}</div>
//                           <div className="mb-2"><strong>Status:</strong> {product.status || "Active"}</div>
//                           <div className="mb-2"><strong>Featured:</strong> {product.featured ? "Yes" : "No"}</div>
//                           <div className="mb-2"><strong>Tags:</strong>{" "}
//                             {product.tags && product.tags.length > 0 ? (
//                               <div className="flex flex-wrap gap-1 mt-1">
//                                 {(Array.isArray(product.tags) ? product.tags : String(product.tags).split(",")).map((tag, i) => (
//                                   <Badge key={i} variant="secondary" className="text-xs">{String(tag).trim()}</Badge>
//                                 ))}
//                               </div>
//                             ) : <span className="text-muted-foreground ml-2">No tags</span>}
//                           </div>
//                         </div>
//                         <div className="flex gap-2 flex-wrap">
//                           {/* Featured Image */}
//                           {product.featuredImage && (
//                             <div className="flex flex-col items-center gap-1">
//                               <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Featured</span>
//                               <div className="w-32 h-32 rounded border-2 border-primary/40 bg-muted overflow-hidden">
//                                 <Image src={product.featuredImage} alt="Featured" width={128} height={128} className="w-full h-full object-cover" unoptimized
//                                   onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
//                               </div>
//                             </div>
//                           )}
//                           {/* Gallery Images */}
//                           {(() => {
//                             const featImg = product.featuredImage || null;
//                             const rawGallery: string[] = [
//                               ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
//                               ...(Array.isArray(product.images) ? product.images : []),
//                             ];
//                             const gallery = [...new Set(rawGallery)].filter((img) => img !== featImg);
//                             return gallery.length > 0 ? (
//                               <div className="flex flex-col gap-1 w-full">
//                                 <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Gallery ({gallery.length})</span>
//                                 <div className="flex flex-wrap gap-2">
//                                   {gallery.map((img, i) => (
//                                     <div key={img + i} className="w-28 h-28 rounded border bg-muted overflow-hidden">
//                                       <Image src={img} alt={`Gallery ${i + 1}`} width={112} height={112} className="w-full h-full object-cover" unoptimized
//                                         onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
//                                     </div>
//                                   ))}
//                                 </div>
//                               </div>
//                             ) : null;
//                           })()}
//                           {/* Empty state */}
//                           {!product.featuredImage && !product.galleryImages?.length && !product.images?.length && (
//                             <div className="w-32 h-32 rounded border bg-muted flex flex-col items-center justify-center gap-1">
//                               <LucideImage className="h-8 w-8 opacity-30" />
//                               <span className="text-[10px] text-muted-foreground">No images</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       {/* ── Activity Log ──────────────────────────────────────────────── */}
//                       {/* Uncomment the import at the top + the line below to enable logs: */}
//                       {/* <ProductActivityLog productId={product.id} productTitle={product.title} /> */}
//                     </td></tr>
//                   )}
//                 </React.Fragment>
//               ))}
//             </tbody>
//           </table>
//         </div>

//       ) : (

//         /* CARD VIEW */
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {paginatedProducts.map((product) => (
//             <Card key={product.id} className="overflow-hidden flex flex-col">
//               <div className="relative h-48 w-full bg-muted">
//                 {(product.featuredImage || product.images?.length) ? (
//                   <Image src={product.featuredImage || product.images![0]} alt={product.title || "Product"} width={400} height={192}
//                     className="h-full w-full object-cover transition-transform hover:scale-105"
//                     onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=No+Image"; }} />
//                 ) : (
//                   <div className="flex h-full items-center justify-center"><LucideImage className="h-12 w-12 text-muted-foreground/50" /></div>
//                 )}
//                 <Badge className="absolute top-2 right-2"
//                   variant={product.status === "ACTIVE" ? "default" : "secondary"}>
//                   {product.status || "Active"}
//                 </Badge>
//               </div>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
//                 <CardDescription className="line-clamp-2">{product.description}</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4 mt-auto">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground font-medium">{product.category}</span>
//                   <span className="font-bold text-lg text-primary">${product.price}</span>
//                 </div>
//                 <div className="flex justify-between text-sm border-t pt-2">
//                   <span className="text-muted-foreground">Stock Available</span>
//                   <span className="font-semibold">{product.stock} units</span>
//                 </div>
//                 <div className="flex gap-2 pt-2">
//                   {(activeView === "approved" || (activeView === "all" && product.status !== "PENDING" && product.status !== "REJECTED")) ? (
//                     <>
//                       <div className="flex items-center justify-center gap-2 flex-1 py-1 px-2 rounded-md border border-border">
//                         <Switch
//                           checked={product.status !== "INACTIVE"}
//                           onCheckedChange={(checked) =>
//                             checked ? handleActivate(product.id) : handleInactivate(product.id)
//                           }
//                         />
//                         <span className={`text-xs font-medium ${product.status === "INACTIVE" ? "text-red-500" : "text-green-600"}`}>
//                           {product.status === "INACTIVE" ? "Inactive" : "Active"}
//                         </span>
//                       </div>
//                       <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(product.id)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
//                     </>
//                   ) : (activeView === "pending" || (activeView === "all" && product.status === "PENDING")) ? (
//                     <>
//                       <Button variant="outline" size="sm" className="flex-1 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
//                       <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openRejectModal(product.id)}><XCircle className="h-3 w-3" />Reject</Button>
//                     </>
//                   ) : (
//                     /* rejected view: no actions */
//                     <p className="text-xs text-muted-foreground italic w-full text-center py-1">No actions available</p>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {!((activeView === "approved" ? loading : activeView === "pending" ? loadingPending : activeView === "all" ? loadingAll : loadingRejected)) && currentProducts.length > 0 && (
//         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
//           {/* Left: count info + per-page */}
//           <div className="flex items-center gap-3 text-sm text-muted-foreground">
//             <span>
//               Showing{" "}
//               <span className="font-medium text-foreground">
//                 {Math.min((currentPage - 1) * itemsPerPage + 1, currentProducts.length)}
//               </span>
//               {"\u2013"}
//               <span className="font-medium text-foreground">
//                 {Math.min(currentPage * itemsPerPage, currentProducts.length)}
//               </span>
//               {" of "}
//               <span className="font-medium text-foreground">{currentProducts.length}</span>
//               {" products"}
//             </span>
//             <div className="flex items-center gap-1.5">
//               <span className="hidden sm:inline">Per page:</span>
//               <Select
//                 value={String(itemsPerPage)}
//                 onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
//               >
//                 <SelectTrigger className="h-8 w-[70px] text-xs">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {[6, 12, 24, 48].map((n) => (
//                     <SelectItem key={n} value={String(n)}>{n}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Right: page buttons */}
//           <div className="flex items-center gap-1">
//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               disabled={currentPage === 1}
//               onClick={() => handlePageChange(currentPage - 1)}
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </Button>

//             {getPaginationPages().map((page, idx) =>
//               page === "..." ? (
//                 <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">
//                   &hellip;
//                 </span>
//               ) : (
//                 <Button
//                   key={page}
//                   variant={page === currentPage ? "default" : "outline"}
//                   size="icon"
//                   className="h-8 w-8 text-xs"
//                   onClick={() => handlePageChange(page as number)}
//                 >
//                   {page}
//                 </Button>
//               )
//             )}

//             <Button
//               variant="outline"
//               size="icon"
//               className="h-8 w-8"
//               disabled={currentPage === totalPages}
//               onClick={() => handlePageChange(currentPage + 1)}
//             >
//               <ChevronRight className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Reject Modal */}
//       {showRejectModal && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <Card className="w-full max-w-md shadow-2xl">
//             <CardHeader className="border-b">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-lg font-bold flex items-center gap-2">
//                   <XCircle className="h-5 w-5 text-red-500" /> Reject Product
//                 </CardTitle>
//                 <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted" disabled={rejectSubmitting}>
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//               <p className="text-sm text-muted-foreground mt-1">Please provide a reason for rejecting this product. The seller will be notified.</p>
//             </CardHeader>
//             <CardContent className="space-y-4 p-6">
//               <div className="space-y-2">
//                 <Label className="text-sm font-semibold">Rejection Reason <span className="text-red-500">*</span></Label>
//                 <Textarea
//                   placeholder="e.g. Product images are unclear, description is incomplete, pricing is incorrect..."
//                   value={rejectReason}
//                   onChange={(e) => setRejectReason(e.target.value)}
//                   rows={4}
//                   className="resize-none"
//                   disabled={rejectSubmitting}
//                   autoFocus
//                 />
//                 <p className="text-xs text-muted-foreground">{rejectReason.length} characters</p>
//               </div>
//             </CardContent>
//             <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
//               <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={rejectSubmitting} className="h-10 px-4">Cancel</Button>
//               <Button variant="destructive" onClick={handleRejectProduct} disabled={rejectSubmitting || !rejectReason.trim()} className="h-10 px-6 font-semibold">
//                 {rejectSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : <><XCircle className="mr-2 h-4 w-4" />Reject Product</>}
//               </Button>
//             </div>
//           </Card>
//         </div>
//       )}

//       {/* Edit Modal */}
//       {showEditModal && activeView === "approved" && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
//             <CardHeader className="border-b sticky top-0 bg-background z-10">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-xl font-bold">Edit Product</CardTitle>
//                 <Button variant="ghost" size="sm" onClick={() => { editGalleryAccumRef.current = []; setShowEditModal(false); }} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4" /></Button>
//               </div>
//             </CardHeader>
//             <CardContent className="space-y-6 p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2 col-span-2">
//                   <Label className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
//                   <Input placeholder="Give your product a clear name" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="h-10" />
//                 </div>
//                 <div className="space-y-2 col-span-2">
//                   <Label className="text-sm font-semibold">Detailed Description</Label>
//                   <Textarea placeholder="Product details..." value={editFormData.description} rows={4} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} className="resize-none" />
//                 </div>
//                 <div className="space-y-2 col-span-2">
//                   <Label className="text-sm font-semibold">Artist Name (Optional)</Label>
//                   <Input placeholder="Enter artist name" value={editFormData.artistName} onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })} className="h-10" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
//                   <div className="relative">
//                     <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input type="number" placeholder="0.00" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="pl-9 h-10" />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label className="text-sm font-semibold">Stock Quantity <span className="text-red-500">*</span></Label>
//                   <Input type="number" placeholder="0" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} className="h-10" />
//                 </div>

//                 {/* Category */}
//                 <div className="space-y-2 relative" ref={editCatDropdownRef}>
//                   <Label className="text-sm font-semibold">Category <span className="text-red-500">*</span></Label>
//                   <div
//                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
//                     onClick={() => setIsEditCatOpen((v) => !v)}
//                   >
//                     <span className={editFormData.category ? "text-foreground font-medium" : "text-muted-foreground"}>{editFormData.category || "Select a category"}</span>
//                     <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isEditCatOpen && "rotate-180")} />
//                   </div>
//                   {isEditCatOpen && (
//                     <div className="absolute z-[60] w-full mt-1 bg-background rounded-lg border shadow-xl p-1">
//                       <div className="flex items-center border-b px-3 pb-2 pt-1">
//                         <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
//                         <input
//                           className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
//                           placeholder="Search categories..." value={editCatSearch} autoFocus
//                           onChange={(e) => setEditCatSearch(e.target.value)} onClick={(e) => e.stopPropagation()}
//                         />
//                       </div>
//                       <div className="max-h-[220px] overflow-y-auto mt-1">
//                         {availableCategories.length === 0 ? (
//                           <div className="py-4 text-center">
//                             <Button variant="ghost" size="sm" className="text-xs text-primary underline"
//                               onClick={(e) => { e.stopPropagation(); loadCategories(); }}>Refresh Categories</Button>
//                           </div>
//                         ) : availableCategories.filter((c) => c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).map((cat) => (
//                           <div
//                             key={cat.categoryName}
//                             className={cn(
//                               "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
//                               editFormData.category === cat.categoryName && "bg-primary/5 text-primary font-medium"
//                             )}
//                             onClick={(e) => { e.stopPropagation(); setEditFormData({ ...editFormData, category: cat.categoryName }); setIsEditCatOpen(false); setEditCatSearch(""); }}
//                           >
//                             <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
//                               editFormData.category === cat.categoryName ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50")}>
//                               {editFormData.category === cat.categoryName && <Check className="h-3 w-3" />}
//                             </div>
//                             {cat.categoryName}
//                           </div>
//                         ))}
//                         {availableCategories.length > 0 && availableCategories.filter((c) => c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).length === 0 && (
//                           <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Featured toggle */}
//                 <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
//                   <div className="space-y-0.5">
//                     <Label className="text-base font-semibold">Featured Product</Label>
//                     <p className="text-xs text-muted-foreground">Show this product on the home page</p>
//                   </div>
//                   <Switch checked={editFormData.featured} onCheckedChange={(checked) => setEditFormData({ ...editFormData, featured: checked })} />
//                 </div>

//                 <div className="space-y-2 col-span-2">
//                   <Label className="text-sm font-semibold">Tags (comma separated)</Label>
//                   <Input placeholder="e.g. handmade, vintage, summer" value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} className="h-10" />
//                 </div>

//                 {/* Featured Image */}
//                 <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20 col-span-2">
//                   <div className="flex items-center justify-between mb-1">
//                     <Label className="text-sm font-semibold">Featured Image</Label>
//                     <span className="text-[10px] text-muted-foreground">Main product image</span>
//                   </div>
//                   <input
//                     ref={editFeaturedImageRef}
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => {
//                       const file = e.target.files?.[0] ?? null;
//                       setEditFormData((prev) => ({ ...prev, featuredImage: file }));
//                     }}
//                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
//                   />
//                   <div className="flex gap-3 flex-wrap pt-2">
//                     {editFormData.oldFeaturedImage && !editFormData.featuredImage && (
//                       <div className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
//                         <Image src={editFormData.oldFeaturedImage} alt="Featured" fill className="object-cover" />
//                         <button type="button"
//                           onClick={() => setEditFormData((prev) => ({ ...prev, oldFeaturedImage: null }))}
//                           className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     )}
//                     {editFormData.featuredImage && (
//                       <div className="relative h-20 w-20 rounded border overflow-hidden bg-muted">
//                         <Image src={URL.createObjectURL(editFormData.featuredImage)} alt="New Featured" fill className="object-cover" />
//                         <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
//                       </div>
//                     )}
//                     {!editFormData.oldFeaturedImage && !editFormData.featuredImage && (
//                       <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
//                         <Package className="h-6 w-6 mb-1 opacity-20" />
//                         <p className="text-xs">No featured image</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Gallery Images — FIX: accumulator ref prevents replace-on-reselect */}
//                 <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20 col-span-2">
//                   <div className="flex items-center justify-between mb-1">
//                     <Label className="text-sm font-semibold">Gallery Images</Label>
//                     <span className="text-[10px] text-muted-foreground">
//                       {editFormData.oldGalleryImages.length + editFormData.galleryImages.length} image(s) total
//                     </span>
//                   </div>
//                   <input
//                     ref={editGalleryImagesRef}
//                     type="file"
//                     accept="image/*"
//                     multiple
//                     onChange={(e) => {
//                       if (e.target.files && e.target.files.length > 0) {
//                         const newFiles = Array.from(e.target.files);
//                         // Accumulate into the ref — never overwrites previous picks
//                         editGalleryAccumRef.current = [...editGalleryAccumRef.current, ...newFiles];
//                         // Sync state for preview rendering
//                         setEditFormData((prev) => ({
//                           ...prev,
//                           galleryImages: [...editGalleryAccumRef.current],
//                         }));
//                         // Clear native input so same file can be re-added if needed
//                         e.target.value = "";
//                       }
//                     }}
//                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
//                   />
//                   <div className="flex gap-3 flex-wrap pt-2">
//                     {/* Existing gallery images from server */}
//                     {editFormData.oldGalleryImages.map((img, idx) => (
//                       <div key={`old-${idx}`} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
//                         <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
//                         <button
//                           type="button"
//                           onClick={() =>
//                             setEditFormData((prev) => ({
//                               ...prev,
//                               oldGalleryImages: prev.oldGalleryImages.filter((_, i) => i !== idx),
//                             }))
//                           }
//                           className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}

//                     {/* Newly picked gallery images */}
//                     {editFormData.galleryImages.map((file, idx) => (
//                       <div key={`new-${idx}`} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
//                         <Image src={URL.createObjectURL(file)} alt={`New ${idx}`} fill className="object-cover" />
//                         <button
//                           type="button"
//                           onClick={() => {
//                             const updated = editFormData.galleryImages.filter((_, i) => i !== idx);
//                             editGalleryAccumRef.current = updated; // keep ref in sync
//                             setEditFormData((prev) => ({ ...prev, galleryImages: updated }));
//                           }}
//                           className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                         <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
//                       </div>
//                     ))}

//                     {editFormData.oldGalleryImages.length === 0 && editFormData.galleryImages.length === 0 && (
//                       <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
//                         <Package className="h-6 w-6 mb-1 opacity-20" />
//                         <p className="text-xs">No gallery images</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <div className="p-6 border-t bg-muted/10 sticky bottom-0 z-10 flex justify-end gap-3">
//               <Button variant="outline" onClick={() => { editGalleryAccumRef.current = []; setShowEditModal(false); }} disabled={editSubmitting} className="h-10 px-4">Cancel</Button>
//               <Button onClick={handleEditProduct} disabled={editSubmitting} className="h-10 px-6 font-semibold shadow-md">
//                 {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
//               </Button>
//             </div>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, DollarSign, Edit, X, Search, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, AlertCircle, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as LucideImage } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { api, apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Seller = {
  id: string;
  name: string;
  email: string;
  pendingCount: number;
};

type Product = {
  id: string;
  title: string;
  price: number;
  status: string;
  isActive?: boolean;
  rejectionReason?: string | null;
  reviewNote?: string | null;
  sellerInactiveReason?: string | null;
  images?: string[];
  featuredImage?: string | null;
  galleryImages?: string[];
  description?: string;
  category?: string;
  stock?: number;
  featured?: boolean;
  tags?: string[] | string;
  seller_id?: string;
  sellerId?: string;
  userId?: string;
  seller?: { id: string; name: string; email: string; storeName?: string; businessName?: string };
};

type TabCounts = { all: number; pending: number; approved: number; rejected: number; inactive: number };

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":   return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">Active</span>;
    case "PENDING":  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400">Pending</span>;
    case "REJECTED": return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">Rejected</span>;
    case "INACTIVE": return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Inactive</span>;
    default:         return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>;
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const productBelongsTo = (p: Product, sellerId: string) =>
  p.seller_id === sellerId || p.sellerId === sellerId || p.userId === sellerId;

const parsePendingResponse = (res: any): Product[] => {
  if (res?.success && res?.products) return res.products;
  if (res?.data) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

// ─── Pending pill component ───────────────────────────────────────────────────
function PendingPill({ count }: { count: number }) {
  if (count > 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 whitespace-nowrap">
        {count} pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap">
      0 pending
    </span>
  );
}

type RecycleBinProduct = {
  id: string;
  title: string;
  price: string;
  stock: number;
  category?: string;
  featuredImage?: string | null;
  status?: string;
  deletedAt: string;
  deletedBy: string | null;
  deletedByRole: "ADMIN" | "SELLER" | null;
  seller?: { id: string; name: string; email: string };
  sellerId?: string;
  sellerName?: string;
};

export default function AdminProductsPage() {
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]*)/);
      const roleMatch = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
      if (!tokenMatch || !roleMatch) {
        window.location.href = "/auth/login";
      }
    }
  }, []);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);

  const [activeView, setActiveView] = useState<"all" | "approved" | "pending" | "rejected" | "inactive" | "recycle-bin">("approved");
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [rejectedProducts, setRejectedProducts] = useState<Product[]>([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [inactiveProducts, setInactiveProducts] = useState<Product[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [tabCounts, setTabCounts] = useState<TabCounts>({ all: 0, pending: 0, approved: 0, rejected: 0, inactive: 0 });

  // Recycle Bin state
  const [recycleBinProducts, setRecycleBinProducts] = useState<RecycleBinProduct[]>([]);
  const [loadingRecycleBin, setLoadingRecycleBin] = useState(false);

  // Permanent delete confirm
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecycleBinProduct | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const allPendingRef = useRef<Product[]>([]);
  const allRejectedRef = useRef<Product[]>([]);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectProductId, setRejectProductId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Admin deactivate modal
  const [showAdminDeactivateModal, setShowAdminDeactivateModal] = useState(false);
  const [adminDeactivateProductId, setAdminDeactivateProductId] = useState<string | null>(null);
  const [adminDeactivateReason, setAdminDeactivateReason] = useState("");
  const [adminDeactivateSubmitting, setAdminDeactivateSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editProductStatus, setEditProductStatus] = useState<string>("");
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    images: [] as File[],
    oldImages: [] as string[],
    featuredImage: null as File | null,
    oldFeaturedImage: null as string | null,
    galleryImages: [] as File[],
    oldGalleryImages: [] as string[],
    tags: "",
    artistName: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [editCatSearch, setEditCatSearch] = useState("");
  const editCatDropdownRef = useRef<HTMLDivElement>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const editFeaturedImageRef = useRef<HTMLInputElement>(null);
  const editGalleryImagesRef = useRef<HTMLInputElement>(null);

  // Mutable accumulator ref for gallery files — always current, no stale closure
  const editGalleryAccumRef = useRef<File[]>([]);

  const selectedSellerRef = useRef(selectedSeller);
  const activeViewRef = useRef(activeView);
  const sellersRef = useRef<Seller[]>([]);
  useEffect(() => { selectedSellerRef.current = selectedSeller; }, [selectedSeller]);
  useEffect(() => { activeViewRef.current = activeView; }, [activeView]);
  useEffect(() => { sellersRef.current = sellers; }, [sellers]);

  // Tracks which tabs have already been fetched for the currently selected seller.
  // Avoids refetching (and flashing to 0) when switching back to an already-loaded tab.
  const fetchedTabsRef = useRef<Set<string>>(new Set());

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
  const totalRevenue = products.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0);

  // ── click-outside ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(e.target as Node)) setIsEditCatOpen(false);
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) setIsSellerDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── categories ─────────────────────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      if (res?.success && res?.data) setAvailableCategories(res.data.approvedCategories || []);
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };
  useEffect(() => { loadCategories(); }, []);

  // ── unified tab fetch (uses new endpoint) ────────────────────────────────
  const fetchTabProducts = async (
    sellerId: string,
    status: "all" | "approved" | "pending" | "rejected" | "inactive" | "recycle-bin"
  ) => {
    if (status === "recycle-bin") {
      fetchRecycleBin(sellerId);
      return;
    }
    const setLoadingMap: Record<string, (v: boolean) => void> = {
      approved: setLoading, pending: setLoadingPending, all: setLoadingAll,
      rejected: setLoadingRejected, inactive: setLoadingInactive,
    };
    const setDataMap: Record<string, (d: Product[]) => void> = {
      approved: setProducts, pending: setPendingProducts, all: setAllProducts,
      rejected: setRejectedProducts, inactive: setInactiveProducts,
    };
    setLoadingMap[status](true);
    try {
      const qs = `?status=${status}${sellerId ? `&sellerId=${encodeURIComponent(sellerId)}` : ""}`;
      const res = await api.get(`/api/admin/products${qs}`);
      const data: Product[] = res?.products || [];
      setDataMap[status](data);
      if (res?.counts) setTabCounts((prev) => ({ ...prev, ...res.counts }));
    } catch (err: any) {
      toast.error(`Failed to load ${status} products: ${err?.message || "Unknown error"}`);
      setDataMap[status]([]);
    } finally {
      setLoadingMap[status](false);
    }
  };

  // ── refresh pending (only updates per-seller dropdown pills — never touches tabCounts) ──
  const refreshPending = async (currentSellers: Seller[]): Promise<Product[]> => {
    try {
      const res = await api.get("/api/admin/products?status=pending");
      const allPending: Product[] = res?.products || parsePendingResponse(res);
      allPendingRef.current = allPending;
      // NOTE: do NOT set tabCounts here — this is a global (cross-seller) query
      // and would show inflated numbers. tabCounts is managed solely by fetchTabProducts.
      setSellers(
        currentSellers.map((s) => ({
          ...s,
          pendingCount: allPending.filter((p) => productBelongsTo(p, s.id)).length,
        }))
      );
      return allPending;
    } catch (err) {
      console.error("Failed to fetch pending products:", err);
      return allPendingRef.current;
    }
  };

  // ── fetch sellers ──────────────────────────────────────────────────────────
  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await api.get("/api/users/all");
      const rawSellers: Seller[] = (Array.isArray(res) ? res : res.users || [])
        .filter((u: any) => u.role === "SELLER")
        .map((u: any) => ({ ...u, pendingCount: 0 }));
      setSellers(rawSellers);
      if (rawSellers.length > 0 && !selectedSeller) setSelectedSeller(rawSellers[0].id);
      await refreshPending(rawSellers);
    } catch (err: any) {
      toast.error(`Failed to load sellers: ${err?.message || "Unknown error"}`);
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  // Thin wrappers kept for call-site compatibility
  const fetchProducts = (sellerId: string) => fetchTabProducts(sellerId, "approved");
  const applyPendingFilter = (sellerId: string) => fetchTabProducts(sellerId, "pending");
  const fetchAllProducts = (sellerId: string) => fetchTabProducts(sellerId, "all");
  const applyRejectedFilter = (sellerId: string) => fetchTabProducts(sellerId, "rejected");
  const fetchInactiveProducts = (sellerId: string) => fetchTabProducts(sellerId, "inactive");

  const fetchRecycleBin = async (sellerId: string) => {
    setLoadingRecycleBin(true);
    try {
      const qs = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
      const res = await api.get(`/api/admin/products/recycle-bin${qs}`);
      setRecycleBinProducts(res?.products || []);
    } catch (err: any) {
      toast.error(`Failed to load recycle bin: ${err?.message || "Unknown error"}`);
      setRecycleBinProducts([]);
    } finally {
      setLoadingRecycleBin(false);
    }
  };

  // ── kept for legacy — refreshes rejected cache only, never touches tabCounts
  const refreshRejected = async (currentSellers: Seller[]): Promise<Product[]> => {
    try {
      const res = await api.get("/api/admin/products?status=rejected");
      const all: Product[] = res?.products || [];
      allRejectedRef.current = all;
      // NOTE: do NOT set tabCounts here — global query, would show wrong counts
      return all;
    } catch (err) {
      console.error("Failed to fetch rejected products:", err);
      return allRejectedRef.current;
    }
  };

  useEffect(() => { fetchSellers(); }, []); // eslint-disable-line

  // ── When the selected SELLER changes: wipe everything and fetch the active tab fresh ──
  useEffect(() => {
    if (!selectedSeller) {
      setProducts([]); setPendingProducts([]); setAllProducts([]);
      setRejectedProducts([]); setInactiveProducts([]);
      setTabCounts({ all: 0, pending: 0, approved: 0, rejected: 0, inactive: 0 });
      fetchedTabsRef.current = new Set();
      return;
    }
    // Reset the cache so every tab re-fetches for the new seller
    fetchedTabsRef.current = new Set();
    setProducts([]);
    setPendingProducts([]);
    setAllProducts([]);
    setRejectedProducts([]);
    setInactiveProducts([]);
    setRecycleBinProducts([]);
    setTabCounts({ all: 0, pending: 0, approved: 0, rejected: 0, inactive: 0 });
    fetchedTabsRef.current.add(activeView);
    if (activeView === "recycle-bin") {
      fetchRecycleBin(selectedSeller);
    } else {
      fetchTabProducts(selectedSeller, activeView);
    }
    // Always fetch recycle bin count eagerly so the badge shows immediately
    if (activeView !== "recycle-bin") {
      fetchRecycleBin(selectedSeller);
    }
    setCurrentPage(1);
  }, [selectedSeller]); // eslint-disable-line

  // ── When the active TAB changes: only fetch if not already loaded for this seller ──
  useEffect(() => {
    if (!selectedSeller) return;
    if (fetchedTabsRef.current.has(activeView)) {
      // Data already in state — just reset pagination, no refetch, no flash
      setCurrentPage(1);
      return;
    }
    fetchedTabsRef.current.add(activeView);
    if (activeView === "recycle-bin") {
      fetchRecycleBin(selectedSeller);
    } else {
      fetchTabProducts(selectedSeller, activeView);
    }
    setCurrentPage(1);
  }, [activeView]); // eslint-disable-line

  // ── edit modal ─────────────────────────────────────────────────────────────
  const openEditModal = async (productId: string) => {
    setEditProductId(productId);
    setEditSubmitting(false);
    editGalleryAccumRef.current = [];

    try {
      const res = await api.get(`/api/products/${productId}`);
      const prod = res.product || res;

      // Log the raw product to diagnose key names
      console.log("[openEditModal] raw product keys:", Object.keys(prod));
      console.log("[openEditModal] raw product:", JSON.stringify(prod, null, 2));

      // ── FIX: resolve gallery images from ALL possible keys ──────────────
      // APIs sometimes return gallery as "galleryImages", "images", or both.
      // We merge them, deduplicate, and exclude the featured image.
      const featuredImg: string | null = prod.featuredImage || null;

      const rawGallery: string[] = [
        ...(Array.isArray(prod.galleryImages) ? prod.galleryImages : []),
        ...(Array.isArray(prod.images) ? prod.images : []),
      ];

      // Deduplicate and remove featured image from gallery list
      const resolvedGallery: string[] = [...new Set(rawGallery)].filter(
        (img) => img !== featuredImg
      );

      console.log("[openEditModal] featuredImage:", featuredImg);
      console.log("[openEditModal] resolvedGallery:", resolvedGallery);

      setEditFormData({
        title: prod.title || "",
        description: prod.description || "",
        price: prod.price?.toString() || "",
        stock: prod.stock?.toString() || "",
        category: prod.category || "",
        images: [],
        oldImages: prod.images || [],
        featuredImage: null,
        oldFeaturedImage: featuredImg,
        galleryImages: [],
        oldGalleryImages: resolvedGallery, // ← correctly populated now
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
        artistName: prod.artistName || "",
      });
      setEditProductStatus(prod.status || "");

      setShowEditModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load product");
    }
  };

  const handleEditProduct = async () => {
    if (!editProductId) return;
    if (!editFormData.title || !editFormData.price || !editFormData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setEditSubmitting(true);
      const form = new FormData();
      form.append("title", editFormData.title.trim());
      form.append("description", editFormData.description.trim());
      form.append("price", String(editFormData.price));
      form.append("stock", String(editFormData.stock));
      form.append("category", editFormData.category.trim());
      form.append("tags", editFormData.tags);
      if (editFormData.artistName) form.append("artistName", editFormData.artistName.trim());

      // Featured image: prefer new file from ref, fall back to old URL
      const featuredFile = editFeaturedImageRef.current?.files?.[0] ?? null;
      if (featuredFile) {
        form.append("featuredImage", featuredFile);
      } else if (editFormData.oldFeaturedImage) {
        // Tell backend to keep the existing featured image
        form.append("oldFeaturedImage", editFormData.oldFeaturedImage);
      }

      // ── Gallery images ────────────────────────────────────────────────────
      // Send old and new gallery images in SEPARATE fields so backend can distinguish them.
      // This prevents the backend from wiping old images when new ones are added.
      
      // 1. Append existing URLs to keep them (in "existingGalleryImages" field)
      if (editFormData.oldGalleryImages?.length > 0) {
        editFormData.oldGalleryImages.forEach((url) => {
          form.append("existingGalleryImages", url);
        });
      }

      // 2. Append new File objects (in "galleryImages" field)
      const galleryFiles = [...editGalleryAccumRef.current];
      if (galleryFiles.length > 0) {
        galleryFiles.forEach((f) => {
          form.append("galleryImages", f);
        });
      }
      
      // If NO new files but old images exist, explicitly send them
      // This ensures the backend knows to KEEP the old images, not delete them
      if (galleryFiles.length === 0 && editFormData.oldGalleryImages?.length > 0) {
        form.append("keepExistingGallery", "true");
      }

      // Debug — verify in browser console before sending
      console.log("[handleEditProduct] Gallery images summary:", {
        existingUrls: editFormData.oldGalleryImages.length,
        newFiles: galleryFiles.length,
        totalImages: editFormData.oldGalleryImages.length + galleryFiles.length,
        keepExisting: galleryFiles.length === 0 && editFormData.oldGalleryImages?.length > 0
      });
      console.log("[handleEditProduct] existing URLs:", editFormData.oldGalleryImages);
      console.log("[handleEditProduct] new files:", galleryFiles.map((f) => f.name));

      const stockNum = Number(editFormData.stock);
      const wasRejected = editProductStatus === "REJECTED";

      await api.put(`/api/products/${editProductId}`, form);

      if (wasRejected) {
        // Auto-approve so the product moves out of REJECTED/PENDING
        await api.post(`/api/admin/products/approve/${editProductId}`);
        if (stockNum <= 2) {
          // Low stock — approve puts it ACTIVE, then deactivate immediately
          await api.put(`/api/admin/products/deactivate/${editProductId}`, { reason: "Auto-deactivated due to low stock (≤ 2 units). Please update stock to re-activate." });
          toast.success("Product approved and saved — marked Inactive due to low stock (≤ 2). Update stock to activate.", { duration: 7000 });
        } else {
          toast.success("Product approved and is now Active.", { duration: 5000 });
        }
      } else {
        toast.success("Product updated — it is now inactive. Use the toggle to activate it when ready.", { duration: 6000 });
      }

      setShowEditModal(false);
      setEditProductId(null);
      setEditProductStatus("");
      editGalleryAccumRef.current = [];
      // Clear all tab caches so every tab re-fetches on next view (product may have moved tabs)
      fetchedTabsRef.current = new Set();
      fetchTabProducts(selectedSellerRef.current, activeViewRef.current);
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── approve / reject / inactivate / activate ──────────────────────────────
  const openAdminDeactivateModal = (productId: string) => {
    setAdminDeactivateProductId(productId);
    setAdminDeactivateReason("");
    setShowAdminDeactivateModal(true);
  };

  const handleAdminDeactivate = async () => {
    if (!adminDeactivateProductId) return;
    if (!adminDeactivateReason.trim()) {
      toast.error("Please enter a reason for deactivating this product.");
      return;
    }
    try {
      setAdminDeactivateSubmitting(true);
      await api.put(`/api/admin/products/deactivate/${adminDeactivateProductId}`, { reason: adminDeactivateReason.trim() });
      toast.success("Product deactivated. The seller has been notified with the reason.");
      setShowAdminDeactivateModal(false);
      setAdminDeactivateProductId(null);
      setAdminDeactivateReason("");
      fetchedTabsRef.current = new Set([activeViewRef.current]);
      fetchTabProducts(selectedSellerRef.current, activeViewRef.current);
    } catch (err: any) {
      toast.error(err?.message || "Failed to deactivate product");
    } finally {
      setAdminDeactivateSubmitting(false);
    }
  };

  const handleActivate = async (productId: string) => {
    try {
      await api.put(`/api/admin/products/activate/${productId}`);
      toast.success("Product activated successfully!");
      fetchedTabsRef.current = new Set([activeViewRef.current]);
      fetchTabProducts(selectedSellerRef.current, activeViewRef.current);
    } catch {
      toast.error("Failed to activate product");
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      await api.post(`/api/admin/products/approve/${productId}`);
      toast.success("Product approved successfully!");
      await refreshPending(sellersRef.current);
      fetchedTabsRef.current = new Set([activeViewRef.current]);
      fetchTabProducts(selectedSellerRef.current, activeViewRef.current);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve product");
    }
  };

  const openRejectModal = (productId: string) => {
    setRejectProductId(productId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectProduct = async () => {
    if (!rejectProductId) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    try {
      setRejectSubmitting(true);
      await api.post(`/api/admin/products/reject/${rejectProductId}`, { reason: rejectReason.trim() });
      toast.success("Product rejected successfully!");
      setShowRejectModal(false);
      setRejectProductId(null);
      setRejectReason("");
      await refreshPending(sellersRef.current);
      fetchedTabsRef.current = new Set([activeViewRef.current]);
      fetchTabProducts(selectedSellerRef.current, activeViewRef.current);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject product");
    } finally {
      setRejectSubmitting(false);
    }
  };

  // ── Recycle Bin actions ───────────────────────────────────────────────────
  const handleRestoreFromBin = async (product: RecycleBinProduct) => {
    setRestoringId(product.id);
    try {
      await api.post(`/api/admin/products/${product.id}/restore`);
      toast.success(`"${product.title}" restored. Set it to Active when ready.`);
      fetchRecycleBin(selectedSeller);
    } catch (err: any) {
      toast.error(err?.message || "Failed to restore product");
    } finally {
      setRestoringId(null);
    }
  };

  const openDeleteConfirm = (product: RecycleBinProduct) => {
    setDeleteTarget(product);
    setDeleteReason("");
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await apiClient(`/api/admin/products/${deleteTarget.id}/permanent`, {
        method: "DELETE",
        body: deleteReason.trim() ? JSON.stringify({ reason: deleteReason.trim() }) : undefined,
      });
      toast.success(`"${deleteTarget.title}" permanently deleted.`);
      setDeleteTarget(null);
      setDeleteReason("");
      fetchRecycleBin(selectedSeller);
    } catch (err: any) {
      toast.error(err?.message || "Failed to permanently delete product");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const currentProducts =
    activeView === "approved" ? products :
    activeView === "pending" ? pendingProducts :
    activeView === "all" ? allProducts :
    activeView === "rejected" ? rejectedProducts :
    activeView === "inactive" ? inactiveProducts :
    []; // recycle-bin handled separately

  const rbTotalPages = Math.max(1, Math.ceil(recycleBinProducts.length / itemsPerPage));
  const rbPaginatedProducts = recycleBinProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = Array.from(new Set(currentProducts.map(p => p.category).filter(Boolean)));
  const filteredCurrentProducts = currentProducts.filter(p =>
    (search ? (p.title?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())) : true) &&
    (categoryFilter ? p.category === categoryFilter : true)
  );

  const totalPages = Math.max(1, Math.ceil(filteredCurrentProducts.length / itemsPerPage));
  const paginatedProducts = filteredCurrentProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    setExpandedProductId(null);
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">View and manage products by seller.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-end w-full md:w-auto md:justify-end">
          <input
            type="text"
            placeholder="Search products..."
            className="border rounded px-3 py-2 w-[200px] h-10 bg-background text-sm"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select
            className="border rounded px-3 py-2 w-[180px] h-10 bg-background text-sm"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

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
                      {s.name} <PendingPill count={s.pendingCount} />
                    </span>
                  );
                })() : "Select a seller"}
              </span>
              <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isSellerDropdownOpen && "rotate-180")} />
            </div>

            {isSellerDropdownOpen && (
              <div className="absolute z-[60] left-0 w-full mt-1 bg-background rounded-lg border shadow-xl p-1 min-w-[400px] animate-in fade-in zoom-in-95">
                <div className="max-h-[300px] overflow-y-auto">
                  {loadingSellers ? (
                    <div className="py-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : sellers.length === 0 ? (
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
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex flex-col min-w-0 mr-3">
                          <span className="font-medium truncate">{seller.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{seller.email}</span>
                        </div>
                        <PendingPill count={seller.pendingCount} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-1 border-b pb-3 mb-2">
        <Button
          variant={activeView !== "recycle-bin" ? "default" : "ghost"}
          size="sm"
          onClick={() => { if (activeView === "recycle-bin") { setActiveView("approved"); setCurrentPage(1); } }}
          className="gap-1.5"
        >
          <Package className="h-4 w-4" /> Products ({(tabCounts.all || allProducts.length) || (products.length + pendingProducts.length + rejectedProducts.length + inactiveProducts.length)})
        </Button>
        <Button
          variant={activeView === "recycle-bin" ? "default" : "ghost"}
          size="sm"
          onClick={() => { setActiveView("recycle-bin"); setCurrentPage(1); }}
          className={cn("gap-1.5", activeView !== "recycle-bin" && "text-muted-foreground")}
        >
          <Trash2 className="h-4 w-4" /> Recycle Bin ({recycleBinProducts.length})
        </Button>
      </div>

      {activeView !== "recycle-bin" && (
        <div className="flex gap-1 flex-wrap border-b pb-2 mb-1">
          {([
            { key: "all",      label: "All",      count: tabCounts.all || allProducts.length,         cls: "" },
            { key: "approved", label: "Approved", count: tabCounts.approved || products.length,       cls: "text-green-700 dark:text-green-400" },
            { key: "pending",  label: "Pending",  count: tabCounts.pending || pendingProducts.length, cls: "text-yellow-700 dark:text-yellow-400" },
            { key: "rejected", label: "Rejected", count: tabCounts.rejected || rejectedProducts.length, cls: "text-red-600 dark:text-red-400" },
            { key: "inactive", label: "Inactive", count: tabCounts.inactive || inactiveProducts.length, cls: "text-gray-500 dark:text-gray-400" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveView(tab.key); setCurrentPage(1); }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap",
                activeView === tab.key
                  ? "border border-b-background border-b-0 -mb-px bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                activeView === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Recycle Bin Tab ─────────────────────────────────────────────────── */}
      {activeView === "recycle-bin" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Recycle Bin</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{recycleBinProducts.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Deleted by Sellers</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{recycleBinProducts.filter(p => p.deletedByRole === "SELLER").length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Deleted by Admins</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{recycleBinProducts.filter(p => p.deletedByRole === "ADMIN").length}</div></CardContent>
            </Card>
          </div>

          {loadingRecycleBin ? (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="min-w-full divide-y divide-muted">
                <thead className="bg-muted/50">
                  <tr>{["Image","Title","Seller","Price","Stock","Deleted On","Deleted By","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-12 w-12 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="flex gap-1"><Skeleton className="h-8 w-16 rounded-md" /><Skeleton className="h-8 w-28 rounded-md" /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : recycleBinProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Trash2 className="h-12 w-12 text-muted-foreground/25" />
                <p className="text-lg font-semibold text-muted-foreground">Recycle Bin is empty for this seller</p>
                <p className="text-sm text-muted-foreground">No soft-deleted products found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="min-w-full divide-y divide-muted">
                <thead className="bg-muted/50">
                  <tr>{["Image","Title","Seller","Price","Stock","Deleted On","Deleted By","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {rbPaginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2">
                        {product.featuredImage ? (
                          <Image src={product.featuredImage} alt={product.title} width={48} height={48}
                            className="h-12 w-12 object-cover rounded opacity-60" unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image"; }} />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                            <LucideImage className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-semibold text-muted-foreground line-clamp-1">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.category || "—"}</p>
                      </td>
                      <td className="px-4 py-2">
                        {product.seller ? (
                          <div>
                            <p className="text-sm font-medium">{product.seller.name}</p>
                            <p className="text-xs text-muted-foreground">{product.seller.email}</p>
                          </div>
                        ) : product.sellerName ? (
                          <p className="text-sm font-medium">{product.sellerName}</p>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold">${product.price}</td>
                      <td className="px-4 py-2 text-sm">{product.stock}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(product.deletedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          product.deletedByRole === "ADMIN" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {product.deletedByRole === "ADMIN" ? "Deleted by Admin" : "Deleted by Seller"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={restoringId === product.id} onClick={() => handleRestoreFromBin(product)}>
                            {restoringId === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            Restore
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteConfirm(product)}>
                            <Trash2 className="h-3 w-3" /> Delete Permanently
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadingRecycleBin && rbTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, recycleBinProducts.length)}–{Math.min(currentPage * itemsPerPage, recycleBinProducts.length)} of {recycleBinProducts.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === rbTotalPages} onClick={() => handlePageChange(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Standard product views ──────────────────────────────────────────── */}
      {activeView !== "recycle-bin" && (<>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{currentProducts.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{currentProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${currentProducts.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Product list */}
      {(activeView === "approved" ? loading : activeView === "pending" ? loadingPending : activeView === "all" ? loadingAll : activeView === "rejected" ? loadingRejected : loadingInactive) ? (
        <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted/50">
                <tr>
                  {["Image", "Title", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-12 w-12 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-8 w-14 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      ) : filteredCurrentProducts.length === 0 ? (
        <Card className="col-span-full text-center py-12">
          {(search || categoryFilter) ? "No products match your search." : `No ${activeView === "approved" ? "approved" : activeView === "pending" ? "pending" : activeView === "rejected" ? "rejected" : activeView === "inactive" ? "inactive" : ""} products found.`}
        </Card>
      ) : (

        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {["Image", "Title", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      {(product.featuredImage || product.images?.length) ? (
                        <Image src={product.featuredImage || product.images![0]} alt={product.title || "Product"} width={48} height={48}
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image"; }} />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                          <LucideImage className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold">{product.title}</p>
                      {product.seller && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.seller.name}</p>
                      )}
                      {product.rejectionReason && (
                        <p className="text-xs text-red-600 mt-0.5 line-clamp-2" title={product.rejectionReason}>
                          <AlertCircle className="inline h-3 w-3 mr-1 align-middle" />
                          {product.rejectionReason}
                        </p>
                      )}
                      {product.status === "PENDING" && product.reviewNote && (
                        <p className="text-xs text-blue-600 mt-0.5 line-clamp-2" title={product.reviewNote}>
                          <AlertCircle className="inline h-3 w-3 mr-1 align-middle" />
                          Seller note: {product.reviewNote}
                        </p>
                      )}
                      {product.status === "INACTIVE" && product.sellerInactiveReason && (
                        <p className="text-xs text-orange-600 mt-0.5 line-clamp-2" title={product.sellerInactiveReason}>
                          <AlertCircle className="inline h-3 w-3 mr-1 align-middle" />
                          Seller reason: {product.sellerInactiveReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2 text-primary font-bold">${product.price}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 items-center">
                        {(product.status === "ACTIVE" || product.status === "INACTIVE") ? (
                          <>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(product.id)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => router.push(`/admindashboard/products/${product.id}`)}
                              title="View">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                            <div className="flex items-center gap-1.5 px-2">
                              <Switch
                                checked={product.status === "ACTIVE"}
                                disabled={(product.stock ?? 0) <= 2 && product.status !== "ACTIVE"}
                                title={(product.stock ?? 0) <= 2 && product.status !== "ACTIVE" ? "Cannot activate — stock is 2 or less" : undefined}
                                onCheckedChange={(checked) =>
                                  checked ? handleActivate(product.id) : openAdminDeactivateModal(product.id)
                                }
                              />
                              <span className={`text-xs font-medium ${product.status === "INACTIVE" ? "text-red-500" : "text-green-600"}`}>
                                {product.status === "INACTIVE" ? ((product.stock ?? 0) <= 2 ? "Low Stock" : "Inactive") : "Active"}
                              </span>
                            </div>
                          </>
                        ) : product.status === "PENDING" ? (
                          <>
                            <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
                            <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openRejectModal(product.id)}><XCircle className="h-3 w-3" />Reject</Button>
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => router.push(`/admindashboard/products/${product.id}`)}
                              title="View">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          </>
                        ) : (
                          /* REJECTED: edit + view only — no Approve until seller resubmits */
                          <>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(product.id)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => router.push(`/admindashboard/products/${product.id}`)}
                              title="View">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}

      {/* Pagination */}
      {!((activeView === "approved" ? loading : activeView === "pending" ? loadingPending : activeView === "all" ? loadingAll : activeView === "rejected" ? loadingRejected : loadingInactive)) && filteredCurrentProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          {/* Left: count info + per-page */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCurrentProducts.length)}
              </span>
              {"\u2013"}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * itemsPerPage, filteredCurrentProducts.length)}
              </span>
              {" of "}
              <span className="font-medium text-foreground">{filteredCurrentProducts.length}</span>
              {" products"}
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
                  {[6, 12, 24, 48].map((n) => (
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
      </>)} {/* end activeView !== "recycle-bin" */}

      {/* Admin Deactivate Modal */}
      {showAdminDeactivateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-orange-500" /> Deactivate Product
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAdminDeactivateModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted" disabled={adminDeactivateSubmitting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">A reason is required. The seller will be notified with this reason.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Reason for Deactivation <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="e.g. Product images do not meet quality standards."
                  value={adminDeactivateReason}
                  onChange={(e) => setAdminDeactivateReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={adminDeactivateSubmitting}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{adminDeactivateReason.length} characters</p>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAdminDeactivateModal(false)} disabled={adminDeactivateSubmitting} className="h-10 px-4">Cancel</Button>
              <Button
                className="h-10 px-6 font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleAdminDeactivate}
                disabled={adminDeactivateSubmitting || !adminDeactivateReason.trim()}
              >
                {adminDeactivateSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deactivating...</> : "Deactivate Product"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" /> Reject Product
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted" disabled={rejectSubmitting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Please provide a reason for rejecting this product. The seller will be notified.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Rejection Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="e.g. Product images are unclear, description is incomplete, pricing is incorrect..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={rejectSubmitting}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{rejectReason.length} characters</p>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={rejectSubmitting} className="h-10 px-4">Cancel</Button>
              <Button variant="destructive" onClick={handleRejectProduct} disabled={rejectSubmitting || !rejectReason.trim()} className="h-10 px-6 font-semibold">
                {rejectSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : <><XCircle className="mr-2 h-4 w-4" />Reject Product</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Edit Product</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { editGalleryAccumRef.current = []; setShowEditModal(false); }} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="Give your product a clear name" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Detailed Description</Label>
                  <Textarea placeholder="Product details..." value={editFormData.description} rows={4} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} className="resize-none" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Artist Name (Optional)</Label>
                  <Input placeholder="Enter artist name" value={editFormData.artistName} onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="pl-9 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Stock Quantity <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="0" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} className="h-10" />
                </div>

                {/* Category */}
                <div className="space-y-2 relative" ref={editCatDropdownRef}>
                  <Label className="text-sm font-semibold">Category <span className="text-red-500">*</span></Label>
                  <div
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
                    onClick={() => setIsEditCatOpen((v) => !v)}
                  >
                    <span className={editFormData.category ? "text-foreground font-medium" : "text-muted-foreground"}>{editFormData.category || "Select a category"}</span>
                    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isEditCatOpen && "rotate-180")} />
                  </div>
                  {isEditCatOpen && (
                    <div className="absolute z-[60] w-full mt-1 bg-background rounded-lg border shadow-xl p-1">
                      <div className="flex items-center border-b px-3 pb-2 pt-1">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search categories..." value={editCatSearch} autoFocus
                          onChange={(e) => setEditCatSearch(e.target.value)} onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto mt-1">
                        {availableCategories.length === 0 ? (
                          <div className="py-4 text-center">
                            <Button variant="ghost" size="sm" className="text-xs text-primary underline"
                              onClick={(e) => { e.stopPropagation(); loadCategories(); }}>Refresh Categories</Button>
                          </div>
                        ) : availableCategories.filter((c) => c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).map((cat) => (
                          <div
                            key={cat.categoryName}
                            className={cn(
                              "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                              editFormData.category === cat.categoryName && "bg-primary/5 text-primary font-medium"
                            )}
                            onClick={(e) => { e.stopPropagation(); setEditFormData({ ...editFormData, category: cat.categoryName }); setIsEditCatOpen(false); setEditCatSearch(""); }}
                          >
                            <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                              editFormData.category === cat.categoryName ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50")}>
                              {editFormData.category === cat.categoryName && <Check className="h-3 w-3" />}
                            </div>
                            {cat.categoryName}
                          </div>
                        ))}
                        {availableCategories.length > 0 && availableCategories.filter((c) => c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured toggle removed — seller-controlled */}

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Tags (comma separated)</Label>
                  <Input placeholder="e.g. handmade, vintage, summer" value={editFormData.tags} onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })} className="h-10" />
                </div>

                {/* Featured Image */}
                <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20 col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-semibold">Featured Image</Label>
                    <span className="text-[10px] text-muted-foreground">Main product image</span>
                  </div>
                  <input
                    ref={editFeaturedImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEditFormData((prev) => ({ ...prev, featuredImage: file }));
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                  <div className="flex gap-3 flex-wrap pt-2">
                    {editFormData.oldFeaturedImage && !editFormData.featuredImage && (
                      <div className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                        <Image src={editFormData.oldFeaturedImage} alt="Featured" fill className="object-cover" />
                        <button type="button"
                          onClick={() => setEditFormData((prev) => ({ ...prev, oldFeaturedImage: null }))}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {editFormData.featuredImage && (
                      <div className="relative h-20 w-20 rounded border overflow-hidden bg-muted">
                        <Image src={URL.createObjectURL(editFormData.featuredImage)} alt="New Featured" fill className="object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
                      </div>
                    )}
                    {!editFormData.oldFeaturedImage && !editFormData.featuredImage && (
                      <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                        <Package className="h-6 w-6 mb-1 opacity-20" />
                        <p className="text-xs">No featured image</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Images — FIX: accumulator ref prevents replace-on-reselect */}
                <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20 col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-semibold">Gallery Images</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {editFormData.oldGalleryImages.length + editFormData.galleryImages.length} image(s) total
                    </span>
                  </div>
                  <input
                    ref={editGalleryImagesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const newFiles = Array.from(e.target.files);
                        // Accumulate into the ref — never overwrites previous picks
                        editGalleryAccumRef.current = [...editGalleryAccumRef.current, ...newFiles];
                        // Sync state for preview rendering
                        setEditFormData((prev) => ({
                          ...prev,
                          galleryImages: [...editGalleryAccumRef.current],
                        }));
                        // Clear native input so same file can be re-added if needed
                        e.target.value = "";
                      }
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                  <div className="flex gap-3 flex-wrap pt-2">
                    {/* Existing gallery images from server */}
                    {editFormData.oldGalleryImages.map((img, idx) => (
                      <div key={`old-${idx}`} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                        <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              oldGalleryImages: prev.oldGalleryImages.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Newly picked gallery images */}
                    {editFormData.galleryImages.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                        <Image src={URL.createObjectURL(file)} alt={`New ${idx}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editFormData.galleryImages.filter((_, i) => i !== idx);
                            editGalleryAccumRef.current = updated; // keep ref in sync
                            setEditFormData((prev) => ({ ...prev, galleryImages: updated }));
                          }}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
                      </div>
                    ))}

                    {editFormData.oldGalleryImages.length === 0 && editFormData.galleryImages.length === 0 && (
                      <div className="h-20 w-full flex flex-col items-center justify-center text-muted-foreground bg-background/50 rounded-lg border-2 border-dashed border-muted">
                        <Package className="h-6 w-6 mb-1 opacity-20" />
                        <p className="text-xs">No gallery images</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 border-t bg-muted/10 sticky bottom-0 z-10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { editGalleryAccumRef.current = []; setShowEditModal(false); }} disabled={editSubmitting} className="h-10 px-4">Cancel</Button>
              <Button onClick={handleEditProduct} disabled={editSubmitting} className="h-10 px-6 font-semibold shadow-md">
                {editSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Permanently delete this product?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will remove <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.title}&rdquo;</span> and all associated data forever. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              placeholder="e.g. Duplicate listing removed by admin"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              disabled={deleteSubmitting}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handlePermanentDelete} disabled={deleteSubmitting}>
              {deleteSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Permanently</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}