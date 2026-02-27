"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Trash2, RefreshCw, Pencil } from "lucide-react";
import { api } from "@/lib/api";

interface Coupon {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  expiresAt: string;
  createdAt?: string;
  isActive: boolean;
  usageLimit: number | null;
  usedCount?: number;
  usagePerUser: number | null;
  minCartValue: number | null;
  maxDiscount: number | null;
}

export default function CouponPage() {
  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiry, setExpiry] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [usagePerUser, setUsagePerUser] = useState("");
  const [minCartValue, setMinCartValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/coupons');
      console.log('Coupons API Response:', response);

      // Handle different response structures
      const couponsData = response.coupons || response.data || response || [];
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      toast.error("Failed to load coupons", {
        description: "Please try refreshing the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setExpiry("");
    setUsageLimit("");
    setUsagePerUser("");
    setMinCartValue("");
    setMaxDiscount("");
    setIsActive(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(String(coupon.discountValue));
    setExpiry(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : "");
    setUsageLimit(coupon.usageLimit !== null ? String(coupon.usageLimit) : "");
    setUsagePerUser(coupon.usagePerUser !== null ? String(coupon.usagePerUser) : "");
    setMinCartValue(coupon.minCartValue !== null ? String(coupon.minCartValue) : "");
    setMaxDiscount(coupon.maxDiscount !== null ? String(coupon.maxDiscount) : "");
    setIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !discountValue || !expiry) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const parsedValue = Number(discountValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      toast.error("Discount value must be a positive number.");
      return;
    }
    if (discountType === "percentage" && parsedValue > 100) {
      toast.error("Percentage discount cannot exceed 100.");
      return;
    }

    setSubmitting(true);

    const isEdit = editingCoupon !== null;

    try {
      const expiryDate = new Date(expiry + 'T23:59:59Z').toISOString();

      const payload: Record<string, unknown> = {
        code: code.toUpperCase(),
        discountType,
        discountValue: parsedValue,
        expiresAt: expiryDate,
        isActive,
        usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
        usagePerUser: usagePerUser !== "" ? Number(usagePerUser) : null,
        minCartValue: minCartValue !== "" ? Number(minCartValue) : null,
        maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : null,
      };

      if (isEdit) {
        await api.put(`/api/admin/coupons/${editingCoupon!.id}`, payload);
        toast.success("Coupon updated successfully!", {
          description: `Coupon ${code.toUpperCase()} has been updated.`,
        });
      } else {
        await api.post('/api/admin/coupons', payload);
        toast.success("Coupon created successfully!", {
          description: `Coupon ${code.toUpperCase()} has been generated.`,
        });
      }

      resetForm();
      setEditingCoupon(null);
      setShowModal(false);
      await fetchCoupons();
    } catch (error: any) {
      console.error(isEdit ? "Coupon update error:" : "Coupon creation error:", error);

      let errorMessage = isEdit ? "Failed to update coupon" : "Failed to create coupon";
      let errorDescription = "Please try again later.";

      if (error.message?.includes("already exists")) {
        errorMessage = "Coupon code already exists";
        errorDescription = "Please use a different coupon code.";
      } else if (error.message?.includes("validation")) {
        errorMessage = "Invalid coupon data";
        errorDescription = "Please check your input and try again.";
      }

      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (couponId: string, couponCode: string) => {
    toast(`Delete coupon "${couponCode}"?`, {
      description: "This action cannot be undone.",
      duration: 8000,
      action: {
        label: "Yes, Delete",
        onClick: () => performDelete(couponId, couponCode),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const performDelete = async (couponId: string, couponCode: string) => {
    try {
      await api.delete(`/api/admin/coupons/${couponId}`, { reason: "" });

      toast.success("Coupon deleted successfully!", {
        description: `Coupon ${couponCode} has been removed.`,
      });

      await fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon", {
        description: "Please try again later.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiresAt: string) => {
    try {
      return new Date(expiresAt) < new Date();
    } catch {
      return false;
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `$${coupon.discountValue.toFixed(2)}`;
  };

  const formatOptional = (value: number | null | undefined, prefix = "") => {
    if (value === null || value === undefined) return <span className="text-muted-foreground text-xs">—</span>;
    return `${prefix}${value}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Generate and manage discount coupons for customers.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoupons}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2 w-full md:w-auto" onClick={() => { resetForm(); setEditingCoupon(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Generate Coupon
          </Button>
        </div>
      </div>

      {/* Modal for create / edit coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingCoupon ? `Editing ${editingCoupon.code}` : "Fill in the details to generate a new coupon."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => { setShowModal(false); setEditingCoupon(null); resetForm(); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* Coupon Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Coupon Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="E.g. SAVE20"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    maxLength={20}
                    disabled={!!editingCoupon}
                    className={`font-mono tracking-widest uppercase h-10 ${editingCoupon ? "bg-muted text-muted-foreground" : ""}`}
                    required
                  />
                  {editingCoupon && (
                    <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>
                  )}
                </div>

                {/* Discount Type + Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="discountType" className="text-sm font-medium">
                      Discount Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}>
                      <SelectTrigger id="discountType" className="h-10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discountValue" className="text-sm font-medium">
                      Value <span className="text-red-500">*</span>
                      {discountType === "percentage" && (
                        <span className="text-muted-foreground font-normal ml-1">(max 100)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="number"
                        placeholder={discountType === "percentage" ? "20" : "10.00"}
                        value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        min={0.01}
                        max={discountType === "percentage" ? 100 : undefined}
                        step={discountType === "fixed" ? "0.01" : "1"}
                        className="h-10 pr-8"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                        {discountType === "percentage" ? "%" : "$"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expiry" className="text-sm font-medium">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-10"
                    required
                  />
                </div>

                {/* Divider: Optional */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-dashed border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                      Optional
                    </span>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="usageLimit" className="text-sm font-medium">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      placeholder="Unlimited"
                      value={usageLimit}
                      onChange={e => setUsageLimit(e.target.value)}
                      min={1}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usagePerUser" className="text-sm font-medium">Per-User Limit</Label>
                    <Input
                      id="usagePerUser"
                      type="number"
                      placeholder="Unlimited"
                      value={usagePerUser}
                      onChange={e => setUsagePerUser(e.target.value)}
                      min={1}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Min Cart + Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="minCartValue" className="text-sm font-medium">Min Cart Value ($)</Label>
                    <div className="relative">
                      <Input
                        id="minCartValue"
                        type="number"
                        placeholder="No minimum"
                        value={minCartValue}
                        onChange={e => setMinCartValue(e.target.value)}
                        min={0}
                        step="0.01"
                        className="h-10 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDiscount" className="text-sm font-medium">
                      Max Discount Cap ($)
                    </Label>
                    <div className="relative">
                      <Input
                        id="maxDiscount"
                        type="number"
                        placeholder={discountType === "fixed" ? "N/A" : "No cap"}
                        value={maxDiscount}
                        onChange={e => setMaxDiscount(e.target.value)}
                        min={0}
                        step="0.01"
                        disabled={discountType === "fixed"}
                        className="h-10 pr-8 disabled:opacity-50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                    </div>
                    {discountType === "fixed" && (
                      <p className="text-xs text-muted-foreground">Not applicable for fixed discounts.</p>
                    )}
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{editingCoupon ? "Coupon Status" : "Active on Creation"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isActive ? "Coupon is usable by customers." : "Coupon is disabled and cannot be used."}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive(v => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${isActive ? "bg-green-500" : "bg-muted-foreground/30"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${isActive ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowModal(false); setEditingCoupon(null); resetForm(); }}
                  className="min-w-[90px]"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="min-w-[120px]">
                  {submitting
                    ? (editingCoupon ? "Saving..." : "Creating...")
                    : (editingCoupon ? "Save Changes" : "Create Coupon")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table of coupons */}
      <Card className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Per User</TableHead>
              <TableHead>Min Cart</TableHead>
              <TableHead>Max Discount</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Loading coupons...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  No coupons found. Create your first coupon to get started.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon, idx) => (
                <TableRow key={coupon.id || idx}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-sm px-3 py-1 font-mono tracking-wider">
                      {coupon.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {coupon.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{formatDiscount(coupon)}</span>
                  </TableCell>
                  <TableCell>
                    {isExpired(coupon.expiresAt) ? (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    ) : coupon.isActive ? (
                      <Badge className="text-xs bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {coupon.usedCount ?? 0}
                      {coupon.usageLimit !== null && coupon.usageLimit !== undefined
                        ? ` / ${coupon.usageLimit}`
                        : " / ∞"}
                    </span>
                  </TableCell>
                  <TableCell>{formatOptional(coupon.usagePerUser)}</TableCell>
                  <TableCell>{formatOptional(coupon.minCartValue, "$")}</TableCell>
                  <TableCell>{formatOptional(coupon.maxDiscount, "$")}</TableCell>
                  <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(coupon)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit coupon"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => coupon.id && confirmDelete(coupon.id, coupon.code)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={!coupon.id}
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
