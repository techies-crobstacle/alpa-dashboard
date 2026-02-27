"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Percent, Plus, X, Trash2, RefreshCw, Tag, Pencil } from "lucide-react";
import { api } from "@/lib/api";

interface Coupon {
  id?: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  maxDiscount: number;
  minCartValue: number;
  expiresAt: string;
  usageLimit: number;
  usagePerUser: number;
  usageCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

const emptyForm = {
  code: "",
  discountType: "percentage" as "percentage" | "flat",
  discountValue: "",
  maxDiscount: "",
  minCartValue: "",
  expiry: "",
  usageLimit: "",
  usagePerUser: "",
  isActive: true,
};

export default function CouponPage() {
  const [form, setForm] = useState(emptyForm);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/coupons');
      console.log('Coupons API Response:', response);
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

  const handleChange = (field: keyof typeof emptyForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const discountVal = Number(form.discountValue);
    const maxDiscountVal = Number(form.maxDiscount);
    const minCartVal = Number(form.minCartValue);
    const usageLimitVal = Number(form.usageLimit);
    const usagePerUserVal = Number(form.usagePerUser);

    if (!form.code || !form.discountValue || !form.expiry) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (form.discountType === "percentage" && (discountVal <= 0 || discountVal > 100)) {
      toast.error("Percentage discount must be between 1 and 100.");
      return;
    }

    if (form.discountType === "flat" && discountVal <= 0) {
      toast.error("Flat discount must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: discountVal,
        maxDiscount: maxDiscountVal || 0,
        minCartValue: minCartVal || 0,
        expiresAt: new Date(form.expiry + 'T23:59:59Z').toISOString(),
        usageLimit: usageLimitVal || 0,
        usagePerUser: usagePerUserVal || 1,
        isActive: form.isActive,
      };

      console.log("Creating coupon with payload:", payload);
      const response = await api.post('/api/admin/coupons', payload);
      console.log("Coupon creation response:", response);

      toast.success("Coupon created successfully!", {
        description: `Coupon ${form.code.toUpperCase()} has been generated.`,
      });

      setForm(emptyForm);
      setShowModal(false);
      await fetchCoupons();
    } catch (error: any) {
      console.error("Coupon creation error:", error);

      let errorMessage = "Failed to create coupon";
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

  const handleEditOpen = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      minCartValue: coupon.minCartValue ? String(coupon.minCartValue) : "",
      expiry: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      usagePerUser: coupon.usagePerUser ? String(coupon.usagePerUser) : "",
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.id) return;

    const discountVal = Number(form.discountValue);
    const maxDiscountVal = Number(form.maxDiscount);
    const minCartVal = Number(form.minCartValue);
    const usageLimitVal = Number(form.usageLimit);
    const usagePerUserVal = Number(form.usagePerUser);

    if (!form.discountValue || !form.expiry) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (form.discountType === "percentage" && (discountVal <= 0 || discountVal > 100)) {
      toast.error("Percentage discount must be between 1 and 100.");
      return;
    }

    if (form.discountType === "flat" && discountVal <= 0) {
      toast.error("Flat discount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        discountType: form.discountType,
        discountValue: discountVal,
        maxDiscount: maxDiscountVal || 0,
        minCartValue: minCartVal || 0,
        expiresAt: new Date(form.expiry + 'T23:59:59Z').toISOString(),
        usageLimit: usageLimitVal || 0,
        usagePerUser: usagePerUserVal || 1,
        isActive: form.isActive,
      };

      console.log("Updating coupon with payload:", payload);
      const response = await api.put(`/api/admin/coupons/${editingCoupon.id}`, payload);
      console.log("Coupon update response:", response);

      toast.success("Coupon updated successfully!", {
        description: `Coupon ${editingCoupon.code} has been updated.`,
      });

      handleCloseModal();
      await fetchCoupons();
    } catch (error: any) {
      console.error("Coupon update error:", error);
      toast.error("Failed to update coupon", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
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
      return (
        <div className="flex items-center gap-1">
          <span className="font-semibold">{coupon.discountValue}</span>
          <Percent className="w-3 h-3 text-muted-foreground" />
        </div>
      );
    }
    return <span className="font-semibold">${coupon.discountValue}</span>;
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
          <Button className="gap-2 w-full md:w-auto" onClick={() => { setEditingCoupon(null); setForm(emptyForm); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Generate Coupon
          </Button>
        </div>
      </div>

      {/* Modal for creating / editing coupon */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <Card className="w-full max-w-lg p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {editingCoupon ? <Pencil className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                <h2 className="text-lg font-semibold">{editingCoupon ? `Edit Coupon — ${editingCoupon.code}` : "Generate Coupon"}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form className="space-y-4" onSubmit={editingCoupon ? handleUpdate : handleGenerate}>
              {/* Coupon Code */}
              <div>
                <Label htmlFor="code">Coupon Code <span className="text-red-500">*</span></Label>
                <Input
                  id="code"
                  placeholder="E.g. SAVE20"
                  value={form.code}
                  onChange={e => handleChange("code", e.target.value.toUpperCase())}
                  maxLength={20}
                  required
                  disabled={!!editingCoupon}
                />
                {editingCoupon && (
                  <p className="text-xs text-muted-foreground mt-1">Coupon code cannot be changed.</p>
                )}
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discountType">Discount Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.discountType}
                    onValueChange={val => handleChange("discountType", val)}
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="discountValue"
                      type="number"
                      placeholder={form.discountType === "percentage" ? "E.g. 20" : "E.g. 100"}
                      value={form.discountValue}
                      onChange={e => handleChange("discountValue", e.target.value)}
                      min={1}
                      max={form.discountType === "percentage" ? 100 : undefined}

                      required
                    />
                    {form.discountType === "percentage" ? (
                      <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <span className="text-muted-foreground text-sm shrink-0">$</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Max Discount + Min Cart Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxDiscount">Max Discount ($)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    placeholder="E.g. 500"
                    value={form.maxDiscount}
                    onChange={e => handleChange("maxDiscount", e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="minCartValue">Min Cart Value ($)</Label>
                  <Input
                    id="minCartValue"
                    type="number"
                    placeholder="E.g. 500"
                    value={form.minCartValue}
                    onChange={e => handleChange("minCartValue", e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              {/* Usage Limit + Per User */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    placeholder="E.g. 1000"
                    value={form.usageLimit}
                    onChange={e => handleChange("usageLimit", e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="usagePerUser">Usage Per User</Label>
                  <Input
                    id="usagePerUser"
                    type="number"
                    placeholder="E.g. 1"
                    value={form.usagePerUser}
                    onChange={e => handleChange("usagePerUser", e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              {/* Expiry Date + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">Expiry Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={form.expiry}
                    onChange={e => handleChange("expiry", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={form.isActive ? "true" : "false"}
                    onValueChange={val => handleChange("isActive", val === "true")}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting
                  ? editingCoupon ? "Updating..." : "Creating..."
                  : editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </form>
          </Card>
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
              <TableHead>Max Discount</TableHead>
              <TableHead>Min Cart</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Loading coupons...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
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
                    <Badge variant="outline" className="text-xs capitalize">
                      {coupon.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell>
                    {coupon.maxDiscount ? `$${coupon.maxDiscount}` : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {coupon.minCartValue ? `$${coupon.minCartValue}` : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {coupon.usageCount ?? 0}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={!coupon.isActive || isExpired(coupon.expiresAt) ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {isExpired(coupon.expiresAt) ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOpen(coupon)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={!coupon.id}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => coupon.id && handleDelete(coupon.id, coupon.code)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={!coupon.id}
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
