"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, DollarSign, Edit, PowerOff, X, Search, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as LucideImage } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [layout, setLayout] = useState<"table" | "card">("table");

  const [activeView, setActiveView] = useState<"approved" | "pending">("approved");
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const allPendingRef = useRef<Product[]>([]);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectProductId, setRejectProductId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
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
    featured: false,
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

  // ── refresh pending products ───────────────────────────────────────────────
  const refreshPending = async (currentSellers: Seller[]): Promise<Product[]> => {
    try {
      const res = await api.get("/api/admin/products/pending");
      const allPending = parsePendingResponse(res);
      allPendingRef.current = allPending;
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

  // ── fetch approved products ────────────────────────────────────────────────
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
    } finally {
      setLoading(false);
    }
  };

  const applyPendingFilter = (sellerId: string) => {
    setLoadingPending(true);
    setPendingProducts(allPendingRef.current.filter((p) => productBelongsTo(p, sellerId)));
    setLoadingPending(false);
  };

  useEffect(() => { fetchSellers(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!selectedSeller) { setProducts([]); setPendingProducts([]); return; }
    if (activeView === "approved") fetchProducts(selectedSeller);
    else applyPendingFilter(selectedSeller);
    setCurrentPage(1);
  }, [selectedSeller, activeView]); // eslint-disable-line

  // ── edit modal ─────────────────────────────────────────────────────────────
  const openEditModal = async (productId: string) => {
    if (activeView !== "approved") { toast.error("Approve the product first before editing."); return; }
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
        featured: prod.featured ?? false,
        tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
        artistName: prod.artistName || "",
      });

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
      form.append("featured", String(editFormData.featured));
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
      // Use the same key "galleryImages" for BOTH existing URLs and new Files.
      // This matches the Postman tests and ensures the backend doesn't wipe old ones.
      
      // 1. Append existing URLs to keep them
      if (editFormData.oldGalleryImages?.length > 0) {
        editFormData.oldGalleryImages.forEach((url) => {
          form.append("galleryImages", url);
        });
      }

      // 2. Append new File objects
      const galleryFiles = [...editGalleryAccumRef.current];
      if (galleryFiles.length > 0) {
        galleryFiles.forEach((f) => {
          form.append("galleryImages", f);
        });
      }

      // Debug — verify in browser console before sending
      console.log("[handleEditProduct] galleryImages contents (total):", editFormData.oldGalleryImages.length + galleryFiles.length);
      console.log("[handleEditProduct] existing URLs:", editFormData.oldGalleryImages);
      console.log("[handleEditProduct] new files:", galleryFiles.map((f) => f.name));

      await api.put(`/api/products/${editProductId}`, form);
      toast.success("Product updated successfully!");
      setShowEditModal(false);
      setEditProductId(null);
      editGalleryAccumRef.current = [];
      fetchProducts(selectedSeller);
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── approve / reject / inactivate / activate ──────────────────────────────
  const handleInactivate = async (productId: string) => {
    try {
      await api.put(`/api/admin/products/deactivate/${productId}`);
      toast.success("Product marked as inactive");
      fetchProducts(selectedSeller);
    } catch {
      toast.error("Failed to inactivate product");
    }
  };

  const handleActivate = async (productId: string) => {
    try {
      await api.put(`/api/admin/products/activate/${productId}`);
      toast.success("Product activated successfully!");
      fetchProducts(selectedSeller);
    } catch {
      toast.error("Failed to activate product");
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      await api.post(`/api/admin/products/approve/${productId}`);
      toast.success("Product approved successfully!");
      const fresh = await refreshPending(sellersRef.current);
      setPendingProducts(fresh.filter((p) => productBelongsTo(p, selectedSeller)));
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
      await api.delete(`/api/admin/products/reject/${rejectProductId}`, { reason: rejectReason.trim() });
      toast.success("Product rejected successfully!");
      setShowRejectModal(false);
      setRejectProductId(null);
      setRejectReason("");
      const fresh = await refreshPending(sellersRef.current);
      setPendingProducts(fresh.filter((p) => productBelongsTo(p, selectedSeller)));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject product");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const currentProducts = activeView === "approved" ? products : pendingProducts;

  const totalPages = Math.max(1, Math.ceil(currentProducts.length / itemsPerPage));
  const paginatedProducts = currentProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

        <div className="flex gap-4 items-end w-full md:w-auto md:justify-end justify-between">

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

          <div className="flex gap-2 items-end">
            <Button variant={layout === "table" ? "default" : "outline"} size="sm" onClick={() => setLayout("table")}>Tabular View</Button>
            <Button variant={layout === "card" ? "default" : "outline"} size="sm" onClick={() => setLayout("card")}>Card View</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button variant={activeView === "approved" ? "default" : "ghost"} onClick={() => setActiveView("approved")} className="rounded-b-none">
          Approved Products ({products.length})
        </Button>
        <Button variant={activeView === "pending" ? "default" : "ghost"} onClick={() => setActiveView("pending")} className="rounded-b-none">
          Pending Products ({sellers.find((s) => s.id === selectedSeller)?.pendingCount ?? pendingProducts.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: activeView === "approved" ? "Total Products" : "Pending Products", value: activeView === "approved" ? totalProducts : pendingProducts.length, icon: <Package className="h-4 w-4 text-muted-foreground" /> },
          { label: activeView === "approved" ? "Total Stock" : "Pending Stock", value: activeView === "approved" ? totalStock : pendingProducts.reduce((s, p) => s + (Number(p.stock) || 0), 0), icon: <Package className="h-4 w-4 text-muted-foreground" /> },
          { label: activeView === "approved" ? "Estimated Revenue" : "Potential Revenue", value: "$" + (activeView === "approved" ? totalRevenue : pendingProducts.reduce((s, p) => s + Number(p.price) * (Number((p as any).sales) || 0), 0)).toLocaleString(), icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
        ].map((c) => (
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
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-muted/20">
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
                    <td className="px-4 py-2 font-semibold">{product.title}</td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2 text-primary font-bold">${product.price}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                    <td className="px-4 py-2">
                      <Badge variant={activeView === "pending" || product.status !== "ACTIVE" ? "secondary" : "default"}>
                        {activeView === "pending" ? "PENDING" : product.status || "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 items-center">
                        {activeView === "approved" ? (
                          <>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditModal(product.id)}><Edit className="h-3 w-3" />Edit</Button>
                            {product.status === "INACTIVE" ? (
                              <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleActivate(product.id)}><CheckCircle className="h-3 w-3" />Activate</Button>
                            ) : (
                              <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700" onClick={() => handleInactivate(product.id)}><PowerOff className="h-3 w-3" />Inactive</Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
                            <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openRejectModal(product.id)}><XCircle className="h-3 w-3" />Reject</Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" className="gap-1"
                          onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}>
                          {expandedProductId === product.id ? <><X className="h-3 w-3" />Hide</> : <><Eye className="h-3 w-3" />View</>}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedProductId === product.id && (
                    <tr><td colSpan={7} className="bg-muted/10 p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                          <p className="mb-2 text-muted-foreground">{product.description}</p>
                          <div className="mb-2"><strong>Category:</strong> {product.category}</div>
                          <div className="mb-2"><strong>Price:</strong> ${product.price}</div>
                          <div className="mb-2"><strong>Stock:</strong> {product.stock}</div>
                          <div className="mb-2"><strong>Status:</strong> {product.status || "Active"}</div>
                          <div className="mb-2"><strong>Featured:</strong> {product.featured ? "Yes" : "No"}</div>
                          <div className="mb-2"><strong>Tags:</strong>{" "}
                            {product.tags && product.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(Array.isArray(product.tags) ? product.tags : String(product.tags).split(",")).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{String(tag).trim()}</Badge>
                                ))}
                              </div>
                            ) : <span className="text-muted-foreground ml-2">No tags</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {/* Featured Image */}
                          {product.featuredImage && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Featured</span>
                              <div className="w-32 h-32 rounded border-2 border-primary/40 bg-muted overflow-hidden">
                                <Image src={product.featuredImage} alt="Featured" width={128} height={128} className="w-full h-full object-cover" unoptimized
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              </div>
                            </div>
                          )}
                          {/* Gallery Images */}
                          {(() => {
                            const featImg = product.featuredImage || null;
                            const rawGallery: string[] = [
                              ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
                              ...(Array.isArray(product.images) ? product.images : []),
                            ];
                            const gallery = [...new Set(rawGallery)].filter((img) => img !== featImg);
                            return gallery.length > 0 ? (
                              <div className="flex flex-col gap-1 w-full">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Gallery ({gallery.length})</span>
                                <div className="flex flex-wrap gap-2">
                                  {gallery.map((img, i) => (
                                    <div key={img + i} className="w-28 h-28 rounded border bg-muted overflow-hidden">
                                      <Image src={img} alt={`Gallery ${i + 1}`} width={112} height={112} className="w-full h-full object-cover" unoptimized
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                          {/* Empty state */}
                          {!product.featuredImage && !product.galleryImages?.length && !product.images?.length && (
                            <div className="w-32 h-32 rounded border bg-muted flex flex-col items-center justify-center gap-1">
                              <LucideImage className="h-8 w-8 opacity-30" />
                              <span className="text-[10px] text-muted-foreground">No images</span>
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

        /* CARD VIEW */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full bg-muted">
                {(product.featuredImage || product.images?.length) ? (
                  <Image src={product.featuredImage || product.images![0]} alt={product.title || "Product"} width={400} height={192}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=No+Image"; }} />
                ) : (
                  <div className="flex h-full items-center justify-center"><LucideImage className="h-12 w-12 text-muted-foreground/50" /></div>
                )}
                <Badge className="absolute top-2 right-2"
                  variant={activeView === "pending" ? "secondary" : product.status === "ACTIVE" ? "default" : "secondary"}>
                  {activeView === "pending" ? "PENDING" : product.status || "Active"}
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
                  {activeView === "approved" ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEditModal(product.id)}><Edit className="h-3 w-3" />Edit</Button>
                      {product.status === "INACTIVE" ? (
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleActivate(product.id)}><CheckCircle className="h-3 w-3" />Activate</Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-500 hover:text-red-700" onClick={() => handleInactivate(product.id)}><PowerOff className="h-3 w-3" />Inactive</Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveProduct(product.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openRejectModal(product.id)}><XCircle className="h-3 w-3" />Reject</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!((activeView === "approved" ? loading : loadingPending)) && currentProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
          {/* Left: count info + per-page */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + 1, currentProducts.length)}
              </span>
              {"\u2013"}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * itemsPerPage, currentProducts.length)}
              </span>
              {" of "}
              <span className="font-medium text-foreground">{currentProducts.length}</span>
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
      {showEditModal && activeView === "approved" && (
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

                {/* Featured toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Featured Product</Label>
                    <p className="text-xs text-muted-foreground">Show this product on the home page</p>
                  </div>
                  <Switch checked={editFormData.featured} onCheckedChange={(checked) => setEditFormData({ ...editFormData, featured: checked })} />
                </div>

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
    </div>
  );
}