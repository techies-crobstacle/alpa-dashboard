"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Percent, Plus, X, Trash2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface Coupon {
  id?: string;
  code: string;
  discount: string;
  expiresAt: string;
  createdAt?: string;
  isActive?: boolean;
}

export default function CouponPage() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !discount || !expiry) {
      toast.error("Please enter coupon code, discount, and expiry date.");
      return;
    }
    
    if (isNaN(Number(discount)) || Number(discount) <= 0 || Number(discount) > 100) {
      toast.error("Discount must be a number between 1 and 100.");
      return;
    }

    setSubmitting(true);

    try {
      // Convert date to ISO format with time
      const expiryDate = new Date(expiry + 'T23:59:59Z').toISOString();
      
      const payload = {
        code: code.toUpperCase(),
        discount: discount,
        expiresAt: expiryDate,
      };

      console.log("Creating coupon with payload:", payload);

      const response = await api.post('/api/admin/coupons', payload);
      console.log("Coupon creation response:", response);

      toast.success("Coupon created successfully!", {
        description: `Coupon ${code.toUpperCase()} has been generated.`,
      });

      // Reset form
      setCode("");
      setDiscount("");
      setExpiry("");
      setShowModal(false);

      // Refresh the coupons list
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

      toast.error(errorMessage, {
        description: errorDescription,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
    try {
      await api.delete(`/api/admin/coupons/${couponId}`);
      
      toast.success("Coupon deleted successfully!", {
        description: `Coupon ${couponCode} has been removed.`,
      });

      // Refresh the coupons list
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Generate and manage percentage-based coupons for customers.</p>
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
          <Button className="gap-2 w-full md:w-auto" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Generate Coupon
          </Button>
        </div>
      </div>

      {/* Modal for generating coupon */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <Card className="w-full max-w-md p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate Coupon</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form className="space-y-4" onSubmit={handleGenerate}>
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="E.g. SAVE20"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discount"
                    type="number"
                    placeholder="E.g. 20"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    min={1}
                    max={100}
                    required
                  />
                  <Percent className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create Coupon"}
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
              <TableHead>Discount</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Loading coupons...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No coupons found. Create your first coupon to get started.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon, idx) => (
                <TableRow key={coupon.id || idx}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-base px-4 py-2 font-mono tracking-wider">
                      {coupon.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{coupon.discount}</span>
                      <Percent className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={isExpired(coupon.expiresAt) ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {isExpired(coupon.expiresAt) ? "Expired" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => coupon.id && handleDelete(coupon.id, coupon.code)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!coupon.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
