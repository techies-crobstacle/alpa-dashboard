"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditLogDiffModal, type AuditLogEntry } from "@/components/shared/audit-log-diff-modal";

// ─── Badge config ──────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  PRODUCT_CREATED:                    { label: "Created",          className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700" },
  PRODUCT_UPDATED:                    { label: "Updated",          className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" },
  PRODUCT_DELETED:                    { label: "Deleted",          className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700" },
  PRODUCT_APPROVED:                   { label: "Approved",         className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" },
  PRODUCT_REJECTED:                   { label: "Rejected",         className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700" },
  PRODUCT_ACTIVATED:                  { label: "Activated",        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" },
  PRODUCT_DEACTIVATED:                { label: "Deactivated",      className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700" },
  PRODUCT_BULK_APPROVED:              { label: "Bulk Approved",    className: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700" },
  PRODUCT_AUTO_DEACTIVATED_LOW_STOCK: { label: "Auto-Deactivated", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700" },
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  SELLER:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  CUSTOMER: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800",
  SYSTEM:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { label: action.replace(/_/g, " "), className: "bg-muted text-muted-foreground border-border" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Filter state ──────────────────────────────────────────────────────────────
const LIMIT = 25;

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  const [logs, setLogs]         = useState<AuditLogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState({ total: 0, page: 1, limit: LIMIT, pages: 1 });

  // Filters
  const [actionFilter, setActionFilter]     = useState("ALL");
  const [entityType, setEntityType]         = useState("PRODUCT");
  const [actorSearch, setActorSearch]       = useState("");
  const [actorInput, setActorInput]         = useState(""); // debounced source
  const [fromDate, setFromDate]             = useState("");
  const [toDate, setToDate]                 = useState("");

  // Diff modal
  const [selectedEntry, setSelectedEntry]   = useState<AuditLogEntry | null>(null);
  const [diffOpen, setDiffOpen]             = useState(false);

  // Build query string
  const buildQuery = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(LIMIT));
      if (entityType && entityType !== "ALL") params.set("entityType", entityType);
      if (actionFilter && actionFilter !== "ALL") params.set("action", actionFilter);
      if (actorSearch) params.set("actorId", actorSearch);
      if (fromDate) params.set("from", new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.set("to", end.toISOString());
      }
      return params.toString();
    },
    [entityType, actionFilter, actorSearch, fromDate, toDate]
  );

  const fetchLogs = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/admin/audit-logs?${buildQuery(p)}`);
        setLogs(data?.data ?? []);
        if (data?.meta) setMeta(data.meta);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load audit logs";
        setError(msg);
        toast.error("Error", { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  // Re-fetch when filters or page change
  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // Reset to page 1 on filter change
  const applyFilter = () => {
    setActorSearch(actorInput);
    setPage(1);
  };

  const clearFilters = () => {
    setActionFilter("ALL");
    setEntityType("PRODUCT");
    setActorInput("");
    setActorSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasActiveFilters =
    actionFilter !== "ALL" || actorSearch || fromDate || toDate;

  const openDiff = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setDiffOpen(true);
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">
                Immutable record of all product changes by Admins, Sellers and the System.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fetchLogs(page)}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* ── Filters ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[11px] ml-2 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Entity Type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
                <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Entities</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Action</label>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    {ALL_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{ACTION_CONFIG[a].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actor search */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Actor (ID or Email)</label>
                <div className="flex gap-1">
                  <Input
                    className="h-9 text-sm"
                    placeholder="Actor ID or email…"
                    value={actorInput}
                    onChange={(e) => setActorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                  />
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={applyFilter}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Date range */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                <div className="flex gap-1">
                  <Input
                    type="date"
                    className="h-9 text-sm"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  />
                  <Input
                    type="date"
                    className="h-9 text-sm"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {!loading && !error && (
            <span>
              Showing <span className="font-semibold text-foreground">{logs.length}</span> of{" "}
              <span className="font-semibold text-foreground">{meta.total}</span> event{meta.total !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </span>
          )}
        </div>

        {/* ── Table ───────────────────────────────────────────────────── */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/40" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchLogs(page)}>Try Again</Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm">No audit events found{hasActiveFilters ? " matching these filters" : ""}.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_160px_160px_1fr_120px_80px] gap-3 px-4 py-2.5 bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>Date & Time</span>
              <span>Entity</span>
              <span>Action</span>
              <span>Actor</span>
              <span>Changed Fields</span>
              <span className="text-right">Details</span>
            </div>

            {/* Table rows */}
            <div className="divide-y">
              {logs.map((entry) => {
                const config = getActionConfig(entry.action);
                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_160px_160px_1fr_120px_80px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors text-sm"
                  >
                    {/* Date */}
                    <div>
                      <p className="text-xs font-medium">{formatDate(entry.createdAt)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{entry.id}</p>
                    </div>

                    {/* Entity */}
                    <div className="max-w-[150px]">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted border text-muted-foreground font-mono">
                        {entry.entityType}
                      </span>
                      <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5" title={entry.entityId}>
                        {entry.entityId}
                      </p>
                    </div>

                    {/* Action badge */}
                    <div>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border whitespace-nowrap", config.className)}>
                        {config.label}
                      </span>
                    </div>

                    {/* Actor */}
                    <div>
                      <p className="text-xs truncate" title={entry.actorEmail ?? undefined}>{entry.actorEmail ?? entry.actorId ?? "System"}</p>
                      {entry.actorRole && (
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold mt-0.5", ROLE_BADGE[entry.actorRole] ?? ROLE_BADGE.SYSTEM)}>
                          {entry.actorRole}
                        </span>
                      )}
                      {entry.reason && (
                        <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate" title={entry.reason}>
                          {entry.reason}
                        </p>
                      )}
                    </div>

                    {/* Changed fields */}
                    <div className="flex flex-wrap gap-1">
                      {entry.changedFields.length > 0 ? (
                        entry.changedFields.slice(0, 3).map((f) => (
                          <span key={f} className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted border text-muted-foreground">
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                      {entry.changedFields.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{entry.changedFields.length - 3}</span>
                      )}
                    </div>

                    {/* View Diff */}
                    <div className="md:text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1"
                        onClick={() => openDiff(entry)}
                      >
                        <Eye className="h-3 w-3" />
                        Diff
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {meta.pages > 1 && !loading && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page <span className="font-semibold">{meta.page}</span> of{" "}
              <span className="font-semibold">{meta.pages}</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {/* Page numbers (max 5 shown) */}
              {Array.from({ length: Math.min(5, meta.pages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.pages - 4));
                const p = start + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline" size="sm"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Diff Modal ──────────────────────────────────────────────────── */}
      <AuditLogDiffModal
        entry={selectedEntry}
        open={diffOpen}
        onOpenChange={setDiffOpen}
      />
    </>
  );
}
