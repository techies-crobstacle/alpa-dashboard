"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Package, DollarSign,
  CheckCircle, XCircle, AlertCircle, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { ProductAuditHistory } from "@/components/shared/product-audit-history";

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  images?: string[];
  featuredImage?: string | null;
  galleryImages?: string[];
  status?: string;
  isActive?: boolean;
  sales?: number;
  featured?: boolean;
  tags?: string[] | string;
  artistName?: string;
  rejectionReason?: string | null;
  seller?: { id: string; name: string; email: string; storeName?: string; businessName?: string };
};

// ─── Skeleton loader ───────────────────────────────────────────────────────────
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

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "ACTIVE":   return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400">Active</Badge>;
    case "PENDING":  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400">Pending</Badge>;
    case "REJECTED": return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400">Rejected</Badge>;
    case "INACTIVE": return <Badge className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400">Inactive</Badge>;
    default:         return <Badge variant="secondary">{status ?? "Unknown"}</Badge>;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct]           = useState<Product | null>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]       = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // ── Fetch product ────────────────────────────────────────────────────────────
  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/products/${id}`);
      setProduct(res.product ?? res);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProduct(); }, [id]); // eslint-disable-line

  // ── Approve ──────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await api.post(`/api/admin/products/approve/${product.id}`);
      toast.success("Product approved successfully!");
      loadProduct();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve product");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!product || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setRejectSubmitting(true);
    try {
      await api.post(`/api/admin/products/reject/${product.id}`, { reason: rejectReason.trim() });
      toast.success("Product rejected.");
      setShowRejectModal(false);
      setRejectReason("");
      loadProduct();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject product");
    } finally {
      setRejectSubmitting(false);
    }
  };

  // ── Activate / Deactivate ────────────────────────────────────────────────────
  const handleActivate = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/products/activate/${product.id}`);
      toast.success("Product activated!");
      loadProduct();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to activate product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!product) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/products/deactivate/${product.id}`);
      toast.success("Product marked as inactive.");
      loadProduct();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to deactivate product");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Product not found.</p>
        <Button variant="outline" onClick={() => router.push("/admindashboard/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  const tags = Array.isArray(product.tags)
    ? product.tags
    : product.tags
      ? String(product.tags).split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const galleryImages = (() => {
    const feat = product.featuredImage ?? null;
    const raw = [
      ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];
    return [...new Set(raw)].filter((img) => img !== feat);
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Back + Actions ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => router.push("/admindashboard/products")}>
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Button>

        <div className="flex flex-wrap gap-2">
          {(product.status === "PENDING" || product.status === "REJECTED") && (
            <Button
              variant="outline"
              className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </Button>
          )}
          {product.status === "PENDING" && (
            <Button
              variant="outline"
              className="gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => { setRejectReason(""); setShowRejectModal(true); }}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          )}
          {(product.status === "ACTIVE" || product.status === "INACTIVE") && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background">
              <Switch
                checked={product.status === "ACTIVE"}
                onCheckedChange={(checked) => checked ? handleActivate() : handleDeactivate()}
                disabled={actionLoading}
              />
              <span className={`text-sm font-medium ${product.status === "INACTIVE" ? "text-red-500" : "text-green-600"}`}>
                {product.status === "INACTIVE" ? "Inactive" : "Active"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Detail Card ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Images column */}
            <div className="space-y-4">
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

              {galleryImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {galleryImages.map((img, i) => (
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
                <StatusBadge status={product.status} />
              </div>

              {product.artistName && (
                <p className="text-sm text-muted-foreground">
                  By <span className="font-medium text-foreground">{product.artistName}</span>
                </p>
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
                {product.seller && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Seller</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{product.seller.storeName ?? product.seller.businessName ?? product.seller.name}</p>
                  </div>
                )}
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

              {/* Rejection reason */}
              {product.rejectionReason && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection Reason</p>
                    <p className="text-sm text-red-600 dark:text-red-300">{product.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Audit History ──────────────────────────────────────────── */}
          <ProductAuditHistory productId={product.id} productTitle={product.title} />
        </CardContent>
      </Card>

      {/* ── Reject Modal ─────────────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-lg font-bold">Reject Product</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"
                onClick={() => setShowRejectModal(false)} disabled={rejectSubmitting}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejection. The seller will be notified.
              </p>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Product images are unclear, description is incomplete..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={rejectSubmitting}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{rejectReason.length} characters</p>
              </div>
            </div>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={rejectSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}
                disabled={rejectSubmitting || !rejectReason.trim()}>
                {rejectSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</>
                  : <><XCircle className="mr-2 h-4 w-4" />Reject Product</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
