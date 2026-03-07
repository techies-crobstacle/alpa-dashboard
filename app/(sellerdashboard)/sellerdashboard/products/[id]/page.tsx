"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft, Edit, Trash2, Loader2, Package, DollarSign,
  X, Check, ChevronDown, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProductAuditHistory } from "@/components/shared/product-audit-history";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com";

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
  featuredImage?: string | null;
  galleryImages?: string[];
  status?: string;
  sales?: number;
  featured?: boolean;
  tags?: string[] | string;
  artistName?: string;
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct]     = useState<Product | null>(null);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [showEdit, setShowEdit]   = useState(false);

  // Edit form state
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [editSubmitting, setEditSubmitting]   = useState(false);
  const [isEditCatOpen, setIsEditCatOpen]     = useState(false);
  const [editCatSearch, setEditCatSearch]     = useState("");
  const editCatDropdownRef                    = useRef<HTMLDivElement>(null);
  const editFeaturedImageRef                  = useRef<HTMLInputElement>(null);
  const editGalleryImagesRef                  = useRef<HTMLInputElement>(null);
  const editGalleryAccumRef                   = useRef<File[]>([]);
  const [editFormData, setEditFormData] = useState({
    title: "", description: "", price: "", stock: "", category: "",
    images: [] as File[], oldImages: [] as string[],
    featuredImage: null as File | null, oldFeaturedImage: null as string | null,
    galleryImages: [] as File[], oldGalleryImages: [] as string[],
    featured: false, tags: "", artistName: "",
  });

  // ── Fetch product ──────────────────────────────────────────────────────────
  const loadProduct = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      setProduct(data.product ?? data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) setAvailableCategories(data.data.approvedCategories ?? []);
    } catch {/* ignore */}
  };

  useEffect(() => { loadProduct(); loadCategories(); }, [id]); // eslint-disable-line

  // ── Click outside category dropdown ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(e.target as Node)) {
        setIsEditCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Open edit modal pre-filled ─────────────────────────────────────────────
  const openEdit = () => {
    if (!product) return;
    editGalleryAccumRef.current = [];
    const featuredImg = product.featuredImage ?? null;
    const rawGallery = [
      ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];
    const resolvedGallery = [...new Set(rawGallery)].filter((img) => img !== featuredImg);
    setEditFormData({
      title: product.title ?? "",
      description: product.description ?? "",
      price: product.price?.toString() ?? "",
      stock: product.stock?.toString() ?? "",
      category: product.category ?? "",
      images: [], oldImages: product.images ?? [],
      featuredImage: null, oldFeaturedImage: featuredImg,
      galleryImages: [], oldGalleryImages: resolvedGallery,
      featured: product.featured ?? false,
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : (product.tags ?? ""),
      artistName: product.artistName ?? "",
    });
    setShowEdit(true);
  };

  // ── Save edits ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editFormData.title || !editFormData.price || !editFormData.stock) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setEditSubmitting(true);
      const token = getAuthToken();
      const form = new FormData();
      form.append("title", editFormData.title.trim());
      form.append("description", editFormData.description.trim());
      form.append("price", String(editFormData.price));
      form.append("stock", String(editFormData.stock));
      form.append("category", editFormData.category.trim());
      form.append("featured", String(editFormData.featured));
      form.append("tags", editFormData.tags);
      if (editFormData.artistName) form.append("artistName", editFormData.artistName.trim());

      const featuredFile = editFeaturedImageRef.current?.files?.[0] ?? null;
      if (featuredFile) {
        form.append("featuredImage", featuredFile);
      } else if (editFormData.oldFeaturedImage) {
        form.append("oldFeaturedImage", editFormData.oldFeaturedImage);
      }

      editFormData.oldGalleryImages.forEach((url) => form.append("galleryImages", url));
      [...editGalleryAccumRef.current].forEach((f) => form.append("galleryImages", f));

      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update product");
      }
      toast.success("Product updated successfully!");
      setShowEdit(false);
      editGalleryAccumRef.current = [];
      loadProduct();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm(`Delete "${product?.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete product");
      }
      toast.success("Product deleted.");
      router.push("/sellerdashboard/products");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Gallery image handlers ────────────────────────────────────────────────
  const handleEditGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const merged = [...editGalleryAccumRef.current, ...files];
    editGalleryAccumRef.current = merged;
    setEditFormData((prev) => ({ ...prev, galleryImages: merged }));
    e.target.value = "";
  };

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Product not found.</p>
        <Button variant="outline" onClick={() => router.push("/sellerdashboard/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  const tags = Array.isArray(product.tags)
    ? product.tags
    : product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Back + Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => router.push("/sellerdashboard/products")}>
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={openEdit}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      {/* ── Main Detail Card ────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Images column */}
            <div className="space-y-4">
              {/* Featured image */}
              {product.featuredImage ? (
                <div className="rounded-xl overflow-hidden border bg-muted aspect-[4/3] w-full">
                  <Image
                    src={product.featuredImage}
                    alt={product.title}
                    width={600}
                    height={450}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : product.images?.[0] ? (
                <div className="rounded-xl overflow-hidden border bg-muted aspect-[4/3] w-full">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    width={600}
                    height={450}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="rounded-xl border bg-muted aspect-[4/3] w-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/20" />
                </div>
              )}

              {/* Gallery thumbnails */}
              {(product.galleryImages?.length ?? 0) > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {product.galleryImages!.map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg border overflow-hidden bg-muted flex-shrink-0">
                      <Image src={img} alt={`Gallery ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info column */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
                <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0 mt-1">
                  {product.status ?? "Active"}
                </Badge>
              </div>

              {product.artistName && (
                <p className="text-sm text-muted-foreground">By <span className="font-medium text-foreground">{product.artistName}</span></p>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                  <DollarSign className="h-5 w-5" />
                  {Number(product.price).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground border rounded-lg px-3 py-1">
                  Stock: <span className="font-semibold text-foreground">{product.stock}</span>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Category</p>
                  <p className="text-sm font-medium mt-0.5">{product.category ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sales</p>
                  <p className="text-sm font-medium mt-0.5">{product.sales ?? 0}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Featured</p>
                  <p className="text-sm font-medium mt-0.5">{product.featured ? "Yes" : "No"}</p>
                </div>
                {tags.length > 0 && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2 col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Audit History ──────────────────────────────────────────── */}
          <ProductAuditHistory productId={product.id} productTitle={product.title} />
        </CardContent>
      </Card>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Edit Product</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={() => { editGalleryAccumRef.current = []; setShowEdit(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Product Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="Product title" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  <Textarea placeholder="Product description..." value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={4} className="resize-none" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-semibold">Artist Name</Label>
                  <Input placeholder="Artist name" value={editFormData.artistName} onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Price ($) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} className="pl-9 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Stock <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="0" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} className="h-10" />
                </div>

                {/* Category */}
                <div className="space-y-2 relative col-span-2" ref={editCatDropdownRef}>
                  <Label className="text-sm font-semibold">Category</Label>
                  <div
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-primary/50"
                    onClick={() => setIsEditCatOpen(!isEditCatOpen)}
                  >
                    <span className={editFormData.category ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {editFormData.category || "Select a category"}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isEditCatOpen && "rotate-180")} />
                  </div>
                  {isEditCatOpen && (
                    <div className="absolute z-[60] w-full mt-1 bg-background rounded-lg border shadow-xl p-1 animate-in fade-in zoom-in-95">
                      <div className="flex items-center border-b px-3 pb-2 pt-1">
                        <Search className="mr-2 h-4 w-4 opacity-50" />
                        <input
                          className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search categories..."
                          value={editCatSearch}
                          onChange={(e) => setEditCatSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto mt-1">
                        {availableCategories
                          .filter((cat) => cat.categoryName.toLowerCase().includes(editCatSearch.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat.categoryName}
                              className={cn(
                                "flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm hover:bg-primary/5 hover:text-primary",
                                editFormData.category === cat.categoryName && "bg-primary/5 text-primary font-medium"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditFormData({ ...editFormData, category: cat.categoryName });
                                setIsEditCatOpen(false);
                                setEditCatSearch("");
                              }}
                            >
                              <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded border border-primary", editFormData.category === cat.categoryName ? "bg-primary text-primary-foreground" : "opacity-50")}>
                                {editFormData.category === cat.categoryName && <Check className="h-3 w-3" />}
                              </div>
                              {cat.categoryName}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 col-span-2">
                  <div>
                    <Label className="text-sm font-semibold cursor-pointer">Featured Product</Label>
                    <p className="text-[11px] text-muted-foreground">Highlight this on homepage</p>
                  </div>
                  <Switch checked={editFormData.featured} onCheckedChange={(v) => setEditFormData({ ...editFormData, featured: v })} />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-3">
                  {["New Arrival", "Sale", "Best Seller", "Limited Edition"].map((tag) => {
                    const current = editFormData.tags ? editFormData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
                    const checked = current.includes(tag);
                    return (
                      <div
                        key={tag}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all", checked ? "bg-primary/10 border-primary text-primary" : "bg-muted/10 border-transparent hover:bg-muted/20")}
                        onClick={() => {
                          const next = checked ? current.filter((t) => t !== tag) : [...current, tag];
                          setEditFormData({ ...editFormData, tags: next.join(", ") });
                        }}
                      >
                        <div className={cn("flex h-4 w-4 items-center justify-center rounded border border-primary", checked ? "bg-primary text-primary-foreground" : "opacity-50")}>
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium">{tag}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-semibold">Featured Image</Label>
                  <span className="text-[10px] text-muted-foreground">Main product image</span>
                </div>
                <input ref={editFeaturedImageRef} type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setEditFormData((prev) => ({ ...prev, featuredImage: file }));
                }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <div className="flex gap-3 flex-wrap pt-2">
                  {editFormData.oldFeaturedImage && !editFormData.featuredImage && (
                    <div className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                      <Image src={editFormData.oldFeaturedImage} alt="Featured" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => setEditFormData({ ...editFormData, oldFeaturedImage: null })}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {editFormData.featuredImage && (
                    <div className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                      <Image src={URL.createObjectURL(editFormData.featuredImage)} alt="New" width={80} height={80} className="h-full w-full object-cover" />
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

              {/* Gallery Images */}
              <div className="space-y-3 p-4 rounded-xl border border-dashed bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-semibold">Gallery Images</Label>
                  <span className="text-[10px] text-muted-foreground">Multiple gallery images</span>
                </div>
                <input ref={editGalleryImagesRef} type="file" accept="image/*" multiple onChange={handleEditGalleryImageChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <div className="flex gap-3 flex-wrap pt-2">
                  {editFormData.oldGalleryImages.map((img, idx) => (
                    <div key={idx} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                      <Image src={img} alt="Gallery" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => setEditFormData((prev) => ({ ...prev, oldGalleryImages: prev.oldGalleryImages.filter((_, i) => i !== idx) }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {editFormData.galleryImages.map((file, idx) => (
                    <div key={idx} className="relative group h-20 w-20 rounded border overflow-hidden bg-muted">
                      <Image src={URL.createObjectURL(file)} alt="New" width={80} height={80} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] text-center py-0.5">New</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={() => {
                          const updated = editFormData.galleryImages.filter((_, i) => i !== idx);
                          editGalleryAccumRef.current = updated;
                          setEditFormData((prev) => ({ ...prev, galleryImages: updated }));
                        }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
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

              <div className="flex gap-4 pt-2 sticky bottom-0 bg-background/80 backdrop-blur-sm border-t py-4">
                <Button className="flex-1 h-11 text-base font-semibold" onClick={handleSaveEdit} disabled={editSubmitting}>
                  {editSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Changes"}
                </Button>
                <Button variant="outline" className="h-11 px-8" onClick={() => { editGalleryAccumRef.current = []; setShowEdit(false); }} disabled={editSubmitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
