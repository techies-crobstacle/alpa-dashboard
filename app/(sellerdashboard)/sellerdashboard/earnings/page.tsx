"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
interface EarningRecord {
  id: string;
  orderId: string;
  customerName: string;
  orderValue: string;
  commissionRate: string;
  commissionAmount: string;
  netPayable: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
}

interface EarningTotals {
  totalOrderValue: number;
  totalCommissionDeducted: number;
  totalNetPayable: number;
  totalPaid: number;
  totalPending: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function SellerEarningsPage() {
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<EarningTotals | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchEarnings = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await api.get(`/api/commissions/earned/my?${params.toString()}`);
      setRecords(Array.isArray(res?.data) ? res.data : []);
      if (res?.totals) setTotals(res.totals);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate]);

  useEffect(() => { fetchEarnings(1); }, []);

  const handleApplyFilters = () => {
    setPage(1);
    fetchEarnings(1);
  };

  const handleReset = () => {
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
    setTimeout(() => fetchEarnings(1), 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchEarnings(newPage);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Earnings</h1>
        <p className="text-muted-foreground">Commission breakdown and payout summary for your orders.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading && !totals ? <Skeleton className="h-8 w-24" /> : totals ? `$${totals.totalOrderValue.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total order value (all-time)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commission Deducted</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {loading && !totals ? <Skeleton className="h-8 w-24" /> : totals ? `$${totals.totalCommissionDeducted.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform fee across all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Net Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {loading && !totals ? <Skeleton className="h-8 w-24" /> : totals ? `$${totals.totalNetPayable.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">gross − commission (all-time)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {loading && !totals ? <Skeleton className="h-8 w-24" /> : totals ? `$${totals.totalPending.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">awaiting disbursement</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout breakdown note */}
      {totals && (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
          <span>Gross Sales: <strong className="text-foreground">${totals.totalOrderValue.toFixed(2)}</strong></span>
          <span>− Commission: <strong className="text-orange-600 dark:text-orange-400">${totals.totalCommissionDeducted.toFixed(2)}</strong></span>
          <span>= Net Payable: <strong className="text-green-600 dark:text-green-400">${totals.totalNetPayable.toFixed(2)}</strong></span>
          <span className="ml-auto">Paid out: <strong className="text-foreground">${totals.totalPaid.toFixed(2)}</strong></span>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Button onClick={handleApplyFilters} className="h-9 gap-2">
            <Search className="h-4 w-4" /> Apply
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Value</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-green-700 dark:text-green-400 font-semibold">Net Payable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No earnings records found. Try adjusting the filters or click Apply.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="font-mono text-xs text-primary">{r.orderId}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{r.customerName || "—"}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${parseFloat(r.orderValue).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-orange-300 text-orange-600 dark:text-orange-400">
                        {parseFloat(r.commissionRate).toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      −${parseFloat(r.commissionAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        ${r.netPayable ? parseFloat(r.netPayable).toFixed(2) : (parseFloat(r.orderValue) - parseFloat(r.commissionAmount)).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.status === "PAID" ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 hover:bg-green-100">
                          Paid
                        </Badge>
                      ) : r.status === "CANCELLED" ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 hover:bg-red-100">
                          Cancelled
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 hover:bg-yellow-100">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{page} / {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
