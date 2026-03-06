"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  TrendingUp,
  Tag,
  Search,
  AlertTriangle,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
interface Commission {
  id: string;
  title: string;
  type: "PERCENTAGE" | "FIXED" | string;
  value: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormState {
  title: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  type: "PERCENTAGE",
  value: "",
  description: "",
  isDefault: false,
  isActive: true,
};

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/commissions?includeInactive=true");
      const data: Commission[] = Array.isArray(res)
        ? res
        : res?.commissions || res?.data || [];
      setCommissions(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  useEffect(() => {
    if (showModal) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [showModal]);

  // ── modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Commission) => {
    setEditingId(c.id);
    setForm({
      title: c.title ?? "",
      type: (c.type === "FIXED" ? "FIXED" : "PERCENTAGE") as "PERCENTAGE" | "FIXED",
      value: String(c.value ?? ""),
      description: c.description ?? "",
      isDefault: c.isDefault ?? false,
      isActive: c.isActive ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valueNum = parseFloat(form.value);
  const valueValid =
    !isNaN(valueNum) &&
    valueNum >= 0 &&
    (form.type === "FIXED" || valueNum <= 100);

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!valueValid) { toast.error(form.type === "PERCENTAGE" ? "Rate must be 0–100" : "Value must be a positive number"); return; }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      value: String(valueNum),
      description: form.description.trim() || null,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`/api/admin/commissions/${editingId}`, payload);
        // Optimistically patch local state so inactive rows stay visible
        // even if the GET endpoint filters them out
        const updated: Commission = res?.commission ?? { ...commissions.find((c) => c.id === editingId)!, ...payload };
        setCommissions((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c)));
        toast.success("Commission updated successfully");
        closeModal();
      } else {
        await api.post("/api/admin/commissions", payload);
        toast.success("Commission created successfully");
        closeModal();
        fetchCommissions();
      }
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/commissions/${deleteId}`, {
          reason: ""
      });
      toast.success("Commission deleted");
      setDeleteId(null);
      fetchCommissions();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete commission");
    } finally {
      setDeleting(false);
    }
  };

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = commissions.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const activeCount = commissions.filter((c) => c.isActive !== false).length;
  const avgRate =
    commissions.filter((c) => c.type === "PERCENTAGE").length > 0
      ? (
          commissions
            .filter((c) => c.type === "PERCENTAGE")
            .reduce((s, c) => s + (Number(c.value) || 0), 0) /
          commissions.filter((c) => c.type === "PERCENTAGE").length
        ).toFixed(1)
      : "0";

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
          <p className="text-muted-foreground">Manage commission rates across categories and sellers.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" /> Add Commission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : commissions.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. % Rate</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `${avgRate}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by name, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {search
                      ? `No commissions match "${search}"`
                      : "No commissions yet. Click Add Commission to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.title}</span>
                        {c.isDefault && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            Default
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.type === "PERCENTAGE" ? "border-blue-300 text-blue-600 dark:text-blue-400" : "border-amber-300 text-amber-600 dark:text-amber-400"}>
                        {c.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-bold text-primary text-sm px-2.5 py-0.5 rounded-full bg-primary/10">
                        {c.type === "PERCENTAGE" ? `${c.value}%` : `$${c.value}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.isActive !== false ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <p className="text-sm text-muted-foreground truncate">{c.description || "—"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => openEdit(c)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  {editingId ? "Edit Commission" : "New Commission"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {editingId ? "Update commission details below." : "Define a new commission rate."}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="c-title"
                    ref={firstInputRef}
                    placeholder="e.g. Standard Commission"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label>Type <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setField("type", t)}
                        disabled={submitting}
                        className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                          form.type === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {t === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-value">
                    {form.type === "PERCENTAGE" ? "Rate (%)" : "Amount ($)"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="c-value"
                      type="number"
                      min={0}
                      max={form.type === "PERCENTAGE" ? 100 : undefined}
                      step={0.01}
                      placeholder={form.type === "PERCENTAGE" ? "e.g. 10" : "e.g. 50"}
                      value={form.value}
                      onChange={(e) => setField("value", e.target.value)}
                      disabled={submitting}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                      {form.type === "PERCENTAGE" ? "%" : "$"}
                    </span>
                  </div>
                  {form.value && !valueValid && (
                    <p className="text-xs text-red-500">
                      {form.type === "PERCENTAGE" ? "Rate must be between 0 and 100" : "Value must be a positive number"}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-desc">
                    Description{" "}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="c-desc"
                    rows={3}
                    placeholder="Brief note about this commission rule…"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    disabled={submitting}
                    className="resize-none"
                  />
                </div>

                {/* isDefault toggle */}
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Set as Default</p>
                    <p className="text-xs text-muted-foreground">Apply this commission to sellers without a specific rate</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isDefault}
                    onClick={() => setField("isDefault", !form.isDefault)}
                    disabled={submitting}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      form.isDefault ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        form.isDefault ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* isActive toggle */}
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Deactivate to pause this commission rule</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setField("isActive", !form.isActive)}
                    disabled={submitting}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      form.isActive ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>

              <div className="flex gap-2 justify-end px-6 pb-6">
                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !valueValid}
                  className="gap-2 min-w-[120px]"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="h-4 w-4" /> {editingId ? "Save Changes" : "Create"}</>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteId(null); }}
        >
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" /> Delete Commission
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {commissions.find((c) => c.id === deleteId)?.title}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2 min-w-[100px]"
                >
                  {deleting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
                  ) : (
                    <><Trash2 className="h-4 w-4" /> Delete</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

