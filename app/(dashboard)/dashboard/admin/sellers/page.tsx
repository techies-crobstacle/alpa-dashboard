"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
  
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
  Eye,
} from "lucide-react";

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
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
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
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => router.push(`/dashboard/admin/sellers/${seller.sellerId}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View Details
                            </Button>
                          </TableCell>
                        </TableRow>
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