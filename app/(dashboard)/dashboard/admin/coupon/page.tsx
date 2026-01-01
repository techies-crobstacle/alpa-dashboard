"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Percent, Plus, X } from "lucide-react";

export default function CouponPage() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");
  const [generatedCoupons, setGeneratedCoupons] = useState<{ code: string; discount: string; expiry: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setGeneratedCoupons([{ code, discount, expiry }, ...generatedCoupons]);
      toast.success("Coupon generated!");
      setCode("");
      setDiscount("");
      setExpiry("");
      setSubmitting(false);
      setShowModal(false);
    }, 800);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Generate and manage percentage-based coupons for customers.</p>
        </div>
        <Button className="gap-2 w-full md:w-auto" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Generate Coupon
        </Button>
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
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Generating..." : "Generate Coupon"}
              </Button>
            </form>
          </Card>
        </div>
      )}
      {/* Table of generated coupons */}
      <Card className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Discount (%)</TableHead>
              <TableHead>Expiry Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generatedCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No coupons generated yet.
                </TableCell>
              </TableRow>
            ) : (
              generatedCoupons.map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-base px-4 py-2 font-mono tracking-wider">{c.code}</Badge>
                  </TableCell>
                  <TableCell>{c.discount}%</TableCell>
                  <TableCell>{c.expiry}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
