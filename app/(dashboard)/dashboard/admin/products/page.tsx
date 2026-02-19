

"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, DollarSign, Edit, Trash2, X, Search, Check, ChevronDown, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as LucideImage } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Seller = {
  id: string;
  name: string;
  email: string;
  pendingCount: number; // always a number, never undefined
};

type Product = {
  id: string;
  title: string;
  price: number;
  status: string;
  images?: string[];
  description?: string;
  category?: string;
  stock?: number;
  featured?: boolean;
  tags?: string[] | string;
  seller_id?: string;
  sellerId?: string;
  userId?: string;
};

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

export default function AdminProductsPage() {
    // Redirect to login if not authenticated
    React.useEffect(() => {
      if (typeof document !== 'undefined') {
        const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]*)/);
        const roleMatch = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
        if (!tokenMatch || !roleMatch) {
          window.location.href = '/auth/login';
        }
      }
    }, []);
  const [sellers, setSellers]               = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [products, setProducts]             = useState<Product[]>([]);
  const [loading, setLoading]               = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [layout, setLayout]                 = useState<"table" | "card">("table");

  const [activeView, setActiveView]           = useState<"approved" | "pending">("approved");
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loadingPending, setLoadingPending]   = useState(false);

  // THE FIX: keep allPendingProducts in a ref so every function always reads
  // the freshest data — no stale-closure or setState-timing issues.
  const allPendingRef = useRef<Product[]>([]);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [showEditModal,  setShowEditModal]  = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editProductId,  setEditProductId]  = useState<string | null>(null);
  const [editFormData,   setEditFormData]   = useState({
    title: "", description: "", price: "", stock: "", category: "",
    images: [] as File[], oldImages: [] as string[],
    featured: false, tags: "", artistName: "",
  });

  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);
  const [isEditCatOpen, setIsEditCatOpen]   = useState(false);
  const [editCatSearch, setEditCatSearch]   = useState("");
  const editCatDropdownRef = useRef<HTMLDivElement>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // refs to avoid stale closures in the interval
  const selectedSellerRef = useRef(selectedSeller);
  const activeViewRef     = useRef(activeView);
  const sellersRef        = useRef<Seller[]>([]);
  useEffect(() => { selectedSellerRef.current = selectedSeller; }, [selectedSeller]);
  useEffect(() => { activeViewRef.current = activeView; },        [activeView]);
  useEffect(() => { sellersRef.current = sellers; },              [sellers]);

  const totalProducts = products.length;
  const totalStock    = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
  const totalRevenue  = products.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0);

  // ── click-outside ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(e.target as Node)) setIsEditCatOpen(false);
      if (sellerDropdownRef.current  && !sellerDropdownRef.current.contains(e.target as Node))  setIsSellerDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── categories ─────────────────────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      if (res?.success && res?.data) setAvailableCategories(res.data.approvedCategories || []);
    } catch (e) { console.error("Error fetching categories:", e); }
  };
  useEffect(() => { loadCategories(); }, []);

  // ── CORE: fetch all pending products and update seller counts ──────────────
  //
  // Accepts the current sellers list, fetches fresh pending data, writes to
  // the ref AND updates sellers state — all in one shot so counts are always
  // consistent with the data that was just fetched.
  //
  const refreshPending = async (currentSellers: Seller[]): Promise<Product[]> => {
    try {
      const res = await api.get("/api/admin/products/pending");
      const allPending = parsePendingResponse(res);

      // Write to ref immediately (synchronous — no re-render lag)
      allPendingRef.current = allPending;

      // Recompute counts and push to state in one setState call
      setSellers(
        currentSellers.map(s => ({
          ...s,
          pendingCount: allPending.filter(p => productBelongsTo(p, s.id)).length,
        }))
      );

      return allPending;
    } catch (err) {
      console.error("Failed to fetch pending products:", err);
      return allPendingRef.current;
    }
  };

  // ── fetch sellers then immediately fill pending counts ─────────────────────
  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await api.get("/api/users/all");
      const rawSellers: Seller[] = (Array.isArray(res) ? res : res.users || [])
        .filter((u: any) => u.role === "SELLER")
        .map((u: any) => ({ ...u, pendingCount: 0 })); // 0 while loading

      // Render the dropdown right away (counts show as 0 for a moment — fine)
      setSellers(rawSellers);
      if (rawSellers.length > 0 && !selectedSeller) setSelectedSeller(rawSellers[0].id);

      // Now fetch pending products and update the counts for real
      await refreshPending(rawSellers);
    } catch (err: any) {
      toast.error(`Failed to load sellers: ${err?.message || "Unknown error"}`);
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  // ── fetch approved products for a seller ───────────────────────────────────
  const fetchProducts = async (sellerId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/sellers/${sellerId}/products`);
      let data: Product[] = [];
      if (res?.success && res?.products) data = res.products;
      else if (Array.isArray(res)) data = res;
      else if (res?.data) data = res.data;
      setProducts(data);
    } catch (err: any) {
      toast.error(`Failed to load products: ${err?.message || "Unknown error"}`);
      setProducts([]);
    } finally { setLoading(false); }
  };

  // ── filter pending for selected seller from ref (no API call needed) ────────
  const applyPendingFilter = (sellerId: string) => {
    setLoadingPending(true);
    setPendingProducts(allPendingRef.current.filter(p => productBelongsTo(p, sellerId)));
    setLoadingPending(false);
  };

  // ── mount ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchSellers(); }, []); // eslint-disable-line

  // ── auto-refresh every 30s ─────────────────────────────────────────────────
  // Commented out to prevent constant refreshing
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const fresh = await refreshPending(sellersRef.current);
  //     if (selectedSellerRef.current) {
  //       if (activeViewRef.current === "approved") fetchProducts(selectedSellerRef.current);
  //       else setPendingProducts(fresh.filter(p => productBelongsTo(p, selectedSellerRef.current)));
  //     }
  //   }, 30_000);
  //   return () => clearInterval(interval);
  // }, []); // eslint-disable-line

  // ── react to seller / view change ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedSeller) { setProducts([]); setPendingProducts([]); return; }
    if (activeView === "approved") fetchProducts(selectedSeller);
    else applyPendingFilter(selectedSeller);
  }, [selectedSeller, activeView]); // eslint-disable-line

  // ── edit modal ─────────────────────────────────────────────────────────────
  const openEditModal = async (productId: string) => {
    if (activeView !== "approved") { toast.error("Approve the product first before editing."); return; }
    setEditProductId(productId); setEditSubmitting(false);
    try {
      const res  = await api.get(`/api/products/${productId}`);
      const prod = res.product || res;
      setEditFormData({
        title: prod.title || "", description: prod.description || "",
        price: prod.price?.toString() || "", stock: prod.stock?.toString() || "",
        category: prod.category || "", images: [], oldImages: prod.images || [],
        featured: prod.featured ?? false,
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : (prod.tags || ""),
        artistName: prod.artistName || "",
      });
      setShowEditModal(true);
    } catch (err: any) { toast.error(err.message || "Failed to load product"); }
  };

  const handleEditProduct = async () => {
    if (!editProductId) return;
    if (!editFormData.title || !editFormData.price || !editFormData.stock) { toast.error("Please fill in all required fields"); return; }
    try {
      setEditSubmitting(true);
      const form = new FormData();
      form.append("title",       editFormData.title.trim());
      form.append("description", editFormData.description.trim());
      form.append("price",       String(editFormData.price));
      form.append("stock",       String(editFormData.stock));
      form.append("category",    editFormData.category.trim());
      form.append("featured",    String(editFormData.featured));
      form.append("tags",        editFormData.tags);
      if (editFormData.artistName) form.append("artistName", editFormData.artistName.trim());
      editFormData.images.forEach(img => form.append("images", img));
      await api.put(`/api/products/${editProductId}`, form);
      toast.success("Product updated successfully!");
      setShowEditModal(false); setEditProductId(null);
      fetchProducts(selectedSeller);
    } catch (err: any) { toast.error(err.message || "Failed to update product"); }
    finally { setEditSubmitting(false); }
  };

  // ── approve / reject / inactivate ─────────────────────────────────────────
  const handleInactivate = async (productId: string) => {
    try { await api.put(`/api/admin/products/${productId}/inactive`); toast.success("Product marked as inactive"); fetchProducts(selectedSeller); }
    catch { toast.error("Failed to inactivate product"); }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      await api.post(`/api/admin/products/approve/${productId}`);
      toast.success("Product approved successfully!");
      const fresh = await refreshPending(sellersRef.current);
      setPendingProducts(fresh.filter(p => productBelongsTo(p, selectedSeller)));
    } catch (err: any) { toast.error(err.message || "Failed to approve product"); }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      await api.put(`/api/admin/products/${productId}/reject`);
      toast.success("Product rejected successfully!");
      const fresh = await refreshPending(sellersRef.current);
      setPendingProducts(fresh.filter(p => productBelongsTo(p, selectedSeller)));
    } catch (err: any) { toast.error(err.message || "Failed to reject product"); }
  };

  const currentProducts = activeView === "approved" ? products : pendingProducts;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">View and manage products by seller.</p>
        </div>

        <div className="flex gap-4 items-end w-full md:w-auto md:justify-end justify-between">

          {/* ── Seller Dropdown ─────────────────────────────────────────── */}
          <div className="min-w-[260px] relative" ref={sellerDropdownRef}>
            <label className="block mb-1 font-medium">Select Seller</label>

            {/* trigger */}
            <div
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
              onClick={() => setIsSellerDropdownOpen(v => !v)}
            >
              <span className={selectedSeller ? "text-foreground font-medium" : "text-muted-foreground"}>
                {selectedSeller ? (() => {
                  const s = sellers.find(s => s.id === selectedSeller);
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

            {/* list */}
            {isSellerDropdownOpen && (
              <div className="absolute z-[60] left-0 w-full mt-1 bg-background rounded-lg border shadow-xl p-1 min-w-[400px] animate-in fade-in zoom-in-95">
                <div className="max-h-[300px] overflow-y-auto">
                  {loadingSellers ? (
                    <div className="py-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : sellers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No sellers found.</div>
                  ) : sellers.map(seller => (
                    <div
                      key={seller.id}
                      className={cn(
                        "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                        selectedSeller === seller.id && "bg-primary/5 text-primary font-medium"
                      )}
                      onClick={e => { e.stopPropagation(); setSelectedSeller(seller.id); setIsSellerDropdownOpen(false); }}
                    >
                      {/* checkbox */}
                      <div className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary transition-all",
                        selectedSeller === seller.id ? "bg-primary text-primary-foreground" : "bg-transparent opacity-50"
                      )}>
                        {selectedSeller === seller.id && <Check className="h-3 w-3" />}
                      </div>

                      {/* seller info + pending badge — always rendered */}
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

          <div className="flex gap-2 items-end">
            <Button variant={layout === "table" ? "default" : "outline"} size="sm" onClick={() => setLayout("table")}>Tabular View</Button>
            <Button variant={layout === "card"  ? "default" : "outline"} size="sm" onClick={() => setLayout("card")}>Card View</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button variant={activeView === "approved" ? "default" : "ghost"} onClick={() => setActiveView("approved")} className="rounded-b-none">
          Approved Products ({products.length})
        </Button>
        <Button variant={activeView === "pending" ? "default" : "ghost"} onClick={() => setActiveView("pending")} className="rounded-b-none">
          Pending Products ({pendingProducts.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: activeView === "approved" ? "Total Products"    : "Pending Products",  value: activeView === "approved" ? totalProducts : pendingProducts.length,                                                                        icon: <Package className="h-4 w-4 text-muted-foreground" /> },
          { label: activeView === "approved" ? "Total Stock"       : "Pending Stock",      value: activeView === "approved" ? totalStock    : pendingProducts.reduce((s,p)=>s+(Number(p.stock)||0),0),                                      icon: <Package className="h-4 w-4 text-muted-foreground" /> },
          { label: activeView === "approved" ? "Estimated Revenue" : "Potential Revenue",  value: "$"+(activeView === "approved" ? totalRevenue : pendingProducts.reduce((s,p)=>s+Number(p.price)*(Number((p as any).sales)||0),0)).toLocaleString(), icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
        ].map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>{c.icon}
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Product list */}
      {(activeView === "approved" ? loading : loadingPending) ? (
        <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : currentProducts.length === 0 ? (
        <Card className="col-span-full text-center py-12">No {activeView === "approved" ? "products" : "pending products"} found.</Card>
      ) : layout === "table" ? (

        /* ── TABLE VIEW ── */
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {["Image","Title","Category","Price","Stock","Status","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {currentProducts.map(product => (
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      {product.images?.length ? (
                        <Image src={product.images[0]} alt={product.title||"Product"} width={48} height={48}
                          className="h-12 w-12 object-cover rounded"
                          onError={e=>{(e.target as HTMLImageElement).src="https://placehold.co/100x100?text=No+Image";}} />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
                          <LucideImage className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-semibold">{product.title}</td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2 text-primary font-bold">${product.price}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <Badge variant={activeView==="pending"||product.status!=="ACTIVE"?"secondary":"default"}>
                        {activeView==="pending"?"PENDING":product.status||"Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 items-center">
                        {activeView==="approved"?(
                          <>
                            <Button variant="outline" size="sm" className="gap-1" onClick={()=>openEditModal(product.id)}><Edit className="h-3 w-3"/>Edit</Button>
                            {product.status!=="INACTIVE"&&(
                              <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700" onClick={()=>handleInactivate(product.id)}><Trash2 className="h-3 w-3"/>Inactive</Button>
                            )}
                          </>
                        ):(
                          <>
                            <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={()=>handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3"/>Approve</Button>
                            <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={()=>handleRejectProduct(product.id)}><XCircle className="h-3 w-3"/>Reject</Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" className="gap-1"
                          onClick={()=>setExpandedProductId(expandedProductId===product.id?null:product.id)}>
                          {expandedProductId===product.id?<><X className="h-3 w-3"/>Hide</>:<><Eye className="h-3 w-3"/>View</>}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedProductId===product.id&&(
                    <tr><td colSpan={7} className="bg-muted/10 p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                          <p className="mb-2 text-muted-foreground">{product.description}</p>
                          <div className="mb-2"><strong>Category:</strong> {product.category}</div>
                          <div className="mb-2"><strong>Price:</strong> ${product.price}</div>
                          <div className="mb-2"><strong>Stock:</strong> {product.stock}</div>
                          <div className="mb-2"><strong>Status:</strong> {product.status||"Active"}</div>
                          <div className="mb-2"><strong>Featured:</strong> {product.featured?"Yes":"No"}</div>
                          <div className="mb-2"><strong>Tags:</strong>{" "}
                            {product.tags&&product.tags.length>0?(
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(Array.isArray(product.tags)?product.tags:String(product.tags).split(",")).map((tag,i)=>(
                                  <Badge key={i} variant="secondary" className="text-xs">{String(tag).trim()}</Badge>
                                ))}
                              </div>
                            ):<span className="text-muted-foreground ml-2">No tags</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {product.images?.length?product.images.map((img,i)=>(
                            <div key={img+i} className="w-32 h-32 rounded border bg-muted overflow-hidden">
                              <Image src={img} alt={product.title||"Product"} width={120} height={120} className="w-full h-full object-contain" unoptimized/>
                            </div>
                          )):(
                            <div className="w-32 h-32 rounded border bg-muted flex items-center justify-center">
                              <LucideImage className="h-8 w-8 opacity-30"/>
                            </div>
                          )}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* ── CARD VIEW ── */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentProducts.map(product=>(
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full bg-muted">
                {product.images?.length?(
                  <Image src={product.images[0]} alt={product.title||"Product"} width={400} height={192}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={e=>{(e.target as HTMLImageElement).src="https://placehold.co/400x300?text=No+Image";}}/>
                ):(
                  <div className="flex h-full items-center justify-center"><LucideImage className="h-12 w-12 text-muted-foreground/50"/></div>
                )}
                <Badge className="absolute top-2 right-2"
                  variant={activeView==="pending"?"secondary":product.status==="ACTIVE"?"default":"secondary"}>
                  {activeView==="pending"?"PENDING":product.status||"Active"}
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{product.category}</span>
                  <span className="font-bold text-lg text-primary">${product.price}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Stock Available</span>
                  <span className="font-semibold">{product.stock} units</span>
                </div>
                <div className="flex gap-2 pt-2">
                  {activeView==="approved"?(
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={()=>openEditModal(product.id)}><Edit className="h-3 w-3"/>Edit</Button>
                      {product.status!=="INACTIVE"&&(
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-500 hover:text-red-700" onClick={()=>handleInactivate(product.id)}><Trash2 className="h-3 w-3"/>Inactive</Button>
                      )}
                    </>
                  ):(
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={()=>handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3"/>Approve</Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={()=>handleRejectProduct(product.id)}><XCircle className="h-3 w-3"/>Reject</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal&&activeView==="approved"&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Edit Product</CardTitle>
                <Button variant="ghost" size="sm" onClick={()=>setShowEditModal(false)} className="h-8 w-8 p-0 rounded-full hover:bg-muted"><X className="h-4 w-4"/></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="Give your product a clear name" value={editFormData.title} onChange={e=>setEditFormData({...editFormData,title:e.target.value})} className="h-10"/>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Detailed Description</Label>
                  <Textarea placeholder="Product details..." value={editFormData.description} rows={4} onChange={e=>setEditFormData({...editFormData,description:e.target.value})} className="resize-none"/>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Artist Name (Optional)</Label>
                  <Input placeholder="Enter artist name" value={editFormData.artistName} onChange={e=>setEditFormData({...editFormData,artistName:e.target.value})} className="h-10"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input type="number" placeholder="0.00" value={editFormData.price} onChange={e=>setEditFormData({...editFormData,price:e.target.value})} className="pl-9 h-10"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Stock Quantity <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="0" value={editFormData.stock} onChange={e=>setEditFormData({...editFormData,stock:e.target.value})} className="h-10"/>
                </div>

                {/* Category */}
                <div className="space-y-2 relative" ref={editCatDropdownRef}>
                  <Label className="text-sm font-semibold">Category <span className="text-red-500">*</span></Label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-primary/50 cursor-pointer"
                    onClick={()=>setIsEditCatOpen(v=>!v)}>
                    <span className={editFormData.category?"text-foreground font-medium":"text-muted-foreground"}>{editFormData.category||"Select a category"}</span>
                    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200",isEditCatOpen&&"rotate-180")}/>
                  </div>
                  {isEditCatOpen&&(
                    <div className="absolute z-[60] w-full mt-1 bg-background rounded-lg border shadow-xl p-1">
                      <div className="flex items-center border-b px-3 pb-2 pt-1">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50"/>
                        <input className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search categories..." value={editCatSearch} autoFocus
                          onChange={e=>setEditCatSearch(e.target.value)} onClick={e=>e.stopPropagation()}/>
                      </div>
                      <div className="max-h-[220px] overflow-y-auto mt-1">
                        {availableCategories.length===0?(
                          <div className="py-4 text-center">
                            <Button variant="ghost" size="sm" className="text-xs text-primary underline"
                              onClick={e=>{e.stopPropagation();loadCategories();}}>Refresh Categories</Button>
                          </div>
                        ):availableCategories.filter(c=>c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).map(cat=>(
                          <div key={cat.categoryName}
                            className={cn("flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary",
                              editFormData.category===cat.categoryName&&"bg-primary/5 text-primary font-medium")}
                            onClick={e=>{e.stopPropagation();setEditFormData({...editFormData,category:cat.categoryName});setIsEditCatOpen(false);setEditCatSearch("");}}>
                            <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary transition-all",
                              editFormData.category===cat.categoryName?"bg-primary text-primary-foreground":"bg-transparent opacity-50")}>
                              {editFormData.category===cat.categoryName&&<Check className="h-3 w-3"/>}
                            </div>
                            {cat.categoryName}
                          </div>
                        ))}
                        {availableCategories.length>0&&availableCategories.filter(c=>c.categoryName.toLowerCase().includes(editCatSearch.toLowerCase())).length===0&&(
                          <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Featured Product</Label>
                    <p className="text-xs text-muted-foreground">Show this product on the home page</p>
                  </div>
                  <Switch checked={editFormData.featured} onCheckedChange={checked=>setEditFormData({...editFormData,featured:checked})}/>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Tags (comma separated)</Label>
                  <Input placeholder="e.g. handmade, vintage, summer" value={editFormData.tags} onChange={e=>setEditFormData({...editFormData,tags:e.target.value})} className="h-10"/>
                </div>

                {/* Images */}
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Product Images ({editFormData.images.length+editFormData.oldImages.length}/5)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {editFormData.oldImages.map((img,idx)=>(
                      <div key={`old-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <Image src={img} alt={`Product ${idx}`} fill className="object-cover transition-transform group-hover:scale-105"/>
                        <button type="button" onClick={()=>setEditFormData(prev=>({...prev,oldImages:prev.oldImages.filter((_,i)=>i!==idx)}))}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3"/>
                        </button>
                      </div>
                    ))}
                    {editFormData.images.map((file,idx)=>(
                      <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <Image src={URL.createObjectURL(file)} alt={`New ${idx}`} fill className="object-cover transition-transform group-hover:scale-105"/>
                        <button type="button" onClick={()=>setEditFormData(prev=>({...prev,images:prev.images.filter((_,i)=>i!==idx)}))}
                          className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3"/>
                        </button>
                      </div>
                    ))}
                    {editFormData.images.length+editFormData.oldImages.length<5&&(
                      <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all aspect-square">
                        <Package className="h-6 w-6 text-muted-foreground mb-2"/>
                        <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                        <input type="file" multiple accept="image/*"
                          onChange={e=>{if(e.target.files)setEditFormData({...editFormData,images:Array.from(e.target.files)});}}
                          className="hidden"/>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 border-t bg-muted/10 sticky bottom-0 z-10 flex justify-end gap-3">
              <Button variant="outline" onClick={()=>setShowEditModal(false)} disabled={editSubmitting} className="h-10 px-4">Cancel</Button>
              <Button onClick={handleEditProduct} disabled={editSubmitting} className="h-10 px-6 font-semibold shadow-md">
                {editSubmitting?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</>:"Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
