"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
	Plus, Loader2, Clock, X, CheckCircle2, Package,
	Trash2, RotateCcw, Skull, History, ChevronLeft, ChevronRight,
	Eye, Filter, Pencil, AlertTriangle, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryAuditHistory } from "@/components/shared/category-audit-history";
import { AuditLogDiffModal, type AuditLogEntry } from "@/components/shared/audit-log-diff-modal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ApprovedCategory {
	id: string;
	categoryName: string;
	totalProductCount: number;
	isRequestedCategory?: boolean;
	approvalMessage?: string;
	approvedAt?: string;
}

interface PendingRequest {
	id: string;
	categoryName: string;
	description: string;
	sampleProduct: string;
	requestedAt: string;
	requestedBy: string;
	seller_id: string;
	email: string;
	seller_name: string;
	storeName: string;
	businessName: string;
	seller_status: string;
}

interface RejectedRequest {
	id: string;
	categoryName: string;
	description: string;
	sampleProduct: string;
	requestedAt: string;
	requestedBy: string;
	seller_id: string;
	email: string;
	seller_name: string;
	storeName: string;
	businessName: string;
	seller_status: string;
	rejectionReason?: string;
	rejectionMessage?: string;
}

interface DeletedCategory {
	id: string;
	categoryName: string;
	description?: string;
	status: string;
	softDeletedAt: string;
	softDeletedBy?: string;
	deleted_by_email?: string;
	deleted_by_name?: string;
}

interface CategoriesResponse {
	success: boolean;
	data: {
		approvedCategories: ApprovedCategory[];
		pendingRequests: PendingRequest[];
		rejectedRequests: RejectedRequest[];
		totalApproved: number;
		totalProducts: number;
		totalCategories: number;
		totalPending: number;
		totalRejected: number;
	};
}

// ─── Audit action badge config ───────────────────────────────────────────────────
const AUDIT_ACTION_CONFIG: Record<string, { label: string; className: string }> = {
	CATEGORY_CREATED:      { label: "Created",             className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700" },
	CATEGORY_REQUESTED:    { label: "Requested",           className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700" },
	CATEGORY_APPROVED:     { label: "Approved",            className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" },
	CATEGORY_REJECTED:     { label: "Rejected",            className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700" },
	CATEGORY_EDITED:       { label: "Edited",              className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" },
	CATEGORY_RESUBMITTED:  { label: "Resubmitted",         className: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700" },
	CATEGORY_SOFT_DELETED: { label: "Soft Deleted",        className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700" },
	CATEGORY_RESTORED:     { label: "Restored",            className: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700" },
	CATEGORY_HARD_DELETED: { label: "Permanently Deleted", className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700" },
};

function getAuditBadge(action: string) {
	return AUDIT_ACTION_CONFIG[action] ?? { label: action.replace(/_/g, " "), className: "bg-muted text-muted-foreground border-border" };
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleString("en-AU", {
		day: "2-digit", month: "short", year: "numeric",
		hour: "2-digit", minute: "2-digit", hour12: true,
	});
}

function getCategoryName(entry: AuditLogEntry): string {
	const name =
		(entry.newData?.categoryName as string | undefined) ??
		(entry.previousData?.categoryName as string | undefined);
	return name ?? "—";
}

// ─── Component ───────────────────────────────────────────────────────────────────
const AdminCategoriesPage = () => {
	// ── Main data ────────────────────────────────────────────────────────────────
	const [data, setData] = useState<CategoriesResponse["data"] | null>(null);
	const [loading, setLoading] = useState(true);

	// ── Pending approve/reject ────────────────────────────────────────────────────
	const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [actionMessage, setActionMessage] = useState("");

	// ── Direct creation ───────────────────────────────────────────────────────────
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newCategories, setNewCategories] = useState("");

	// ── Edit category ─────────────────────────────────────────────────────────────
	const [editTarget, setEditTarget] = useState<ApprovedCategory | null>(null);
	const [editName, setEditName] = useState("");
	const [editDesc, setEditDesc] = useState("");
	const [editSample, setEditSample] = useState("");
	const [isEditOpen, setIsEditOpen] = useState(false);

	// ── Soft delete ───────────────────────────────────────────────────────────────
	const [softDeleteTarget, setSoftDeleteTarget] = useState<ApprovedCategory | null>(null);
	const [softDeleteReason, setSoftDeleteReason] = useState("");
	const [isSoftDeleteOpen, setIsSoftDeleteOpen] = useState(false);

	// ── Recycle Bin ───────────────────────────────────────────────────────────────
	const [deletedCategories, setDeletedCategories] = useState<DeletedCategory[]>([]);
	const [deletedLoading, setDeletedLoading] = useState(false);
	const [hardDeleteTarget, setHardDeleteTarget] = useState<DeletedCategory | null>(null);
	const [hardDeleteConfirm, setHardDeleteConfirm] = useState("");
	const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);

	// ── Audit Logs ────────────────────────────────────────────────────────────────
	const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
	const [auditLoading, setAuditLoading] = useState(false);
	const [auditPage, setAuditPage] = useState(1);
	const [auditTotal, setAuditTotal] = useState(0);
	const [auditTotalPages, setAuditTotalPages] = useState(1);
	const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
	const [auditFetched, setAuditFetched] = useState(false);
	const [selectedLogEntry, setSelectedLogEntry] = useState<AuditLogEntry | null>(null);
	const [diffOpen, setDiffOpen] = useState(false);

	// ── Per-category history sheet ────────────────────────────────────────────────
	const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
	const [historyOpen, setHistoryOpen] = useState(false);

	// ── Active tab tracking ───────────────────────────────────────────────────────
	const [activeTab, setActiveTab] = useState("active");

	// ─── Fetch main categories ─────────────────────────────────────────────────────
	const fetchCategoriesData = useCallback(async () => {
		try {
			setLoading(true);
			const response = await apiClient("/api/categories/");
			if (response.success && response.data) {
				setData(response.data);
			}
		} catch {
			toast.error("Failed to load categories data");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchCategoriesData(); }, [fetchCategoriesData]);

	// ─── Fetch recycle bin ──────────────────────────────────────────────────────
	const fetchDeletedCategories = useCallback(async () => {
		setDeletedLoading(true);
		try {
			const token = localStorage.getItem("alpa_token");
			const res = await fetch(`${BASE_URL}/api/categories/deleted`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const body = await res.json();
			if (body.success) setDeletedCategories(body.data?.deletedCategories ?? []);
		} catch {
			toast.error("Failed to load recycle bin");
		} finally {
			setDeletedLoading(false);
		}
	}, []);

	// ─── Fetch audit logs ───────────────────────────────────────────────────────
	const fetchAuditLogs = useCallback(async (page: number, action: string) => {
		setAuditLoading(true);
		try {
			const token = localStorage.getItem("alpa_token");
			const params = new URLSearchParams({ page: String(page), limit: "20" });
			if (action !== "ALL") params.set("action", action);
			const res = await fetch(`${BASE_URL}/api/categories/logs?${params}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const body = await res.json();
			if (body.success) {
				setAuditLogs(body.data?.logs ?? []);
				setAuditTotal(body.data?.total ?? 0);
				setAuditTotalPages(body.data?.totalPages ?? 1);
			}
		} catch {
			toast.error("Failed to load audit logs");
		} finally {
			setAuditLoading(false);
			setAuditFetched(true);
		}
	}, []);

	// Lazy-load recycle bin & audit logs when their tabs are first visited
	useEffect(() => {
		if (activeTab === "recycle-bin") fetchDeletedCategories();
		if (activeTab === "audit-logs" && !auditFetched) fetchAuditLogs(auditPage, auditActionFilter);
	}, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

	// Re-fetch audit logs when filter or page changes
	useEffect(() => {
		if (activeTab === "audit-logs") fetchAuditLogs(auditPage, auditActionFilter);
	}, [auditPage, auditActionFilter]); // eslint-disable-line react-hooks/exhaustive-deps

	// ─── Approve ────────────────────────────────────────────────────────────────
	const handleApproveRequest = async (id: string, message?: string) => {
		try {
			setIsProcessing(true);
			const response = await apiClient(`/api/categories/approve/${id}`, {
				method: "POST",
				body: JSON.stringify({ approvalMessage: message || "Your category request has been approved." }),
			});
			if (response.success) {
				toast.success("Category request approved!");
				setSelectedRequest(null);
				setActionMessage("");
				fetchCategoriesData();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to approve request");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Reject ─────────────────────────────────────────────────────────────────
	const handleRejectRequest = async (id: string, message?: string) => {
		try {
			setIsProcessing(true);
			const response = await apiClient(`/api/categories/reject/${id}`, {
				method: "POST",
				body: JSON.stringify({ rejectionMessage: message || "Rejected by admin" }),
			});
			if (response.success) {
				toast.success("Category request rejected!");
				setSelectedRequest(null);
				setActionMessage("");
				fetchCategoriesData();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to reject request");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Direct Create ───────────────────────────────────────────────────────────
	const handleDirectCreate = async () => {
		if (!newCategories.trim()) { toast.error("Please enter at least one category name"); return; }
		const categoriesList = newCategories.split(/[,\n]/).map(c => c.trim()).filter(c => c.length > 0);
		if (categoriesList.length === 0) { toast.error("Please enter valid category names"); return; }
		try {
			setIsProcessing(true);
			const response = await apiClient("/api/categories/create-direct", {
				method: "POST",
				body: JSON.stringify({ categories: categoriesList }),
			});
			if (response.success) {
				const { totalCreated, skipped } = response.data;
				let msg = `${totalCreated} categories created successfully.`;
				if (skipped > 0) msg += ` ${skipped} skipped (already exist).`;
				toast.success(msg);
				setIsCreateOpen(false);
				setNewCategories("");
				fetchCategoriesData();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to create categories");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Edit ────────────────────────────────────────────────────────────────────
	const openEdit = (cat: ApprovedCategory) => {
		setEditTarget(cat);
		setEditName(cat.categoryName);
		setEditDesc("");
		setEditSample("");
		setIsEditOpen(true);
	};

	const handleEdit = async () => {
		if (!editTarget || !editName.trim()) return;
		try {
			setIsProcessing(true);
			const response = await apiClient(`/api/categories/${editTarget.id}`, {
				method: "PUT",
				body: JSON.stringify({
					categoryName: editName.trim(),
					...(editDesc.trim() ? { description: editDesc.trim() } : {}),
					...(editSample.trim() ? { sampleProduct: editSample.trim() } : {}),
				}),
			});
			if (response.success) {
				toast.success("Category updated successfully!");
				setIsEditOpen(false);
				setEditTarget(null);
				fetchCategoriesData();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update category");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Soft Delete ─────────────────────────────────────────────────────────────
	const openSoftDelete = (cat: ApprovedCategory) => {
		setSoftDeleteTarget(cat);
		setSoftDeleteReason("");
		setIsSoftDeleteOpen(true);
	};

	const handleSoftDelete = async () => {
		if (!softDeleteTarget) return;
		try {
			setIsProcessing(true);
			const response = await apiClient(`/api/categories/${softDeleteTarget.id}`, {
				method: "DELETE",
				body: JSON.stringify(softDeleteReason.trim() ? { reason: softDeleteReason.trim() } : {}),
			});
			if (response.success) {
				toast.success(`"${softDeleteTarget.categoryName}" moved to recycle bin`);
				setIsSoftDeleteOpen(false);
				setSoftDeleteTarget(null);
				fetchCategoriesData();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to delete category");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Restore ─────────────────────────────────────────────────────────────────
	const handleRestore = async (cat: DeletedCategory) => {
		try {
			setIsProcessing(true);
			const token = localStorage.getItem("alpa_token");
			const res = await fetch(`${BASE_URL}/api/categories/restore/${cat.id}`, {
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const body = await res.json();
			if (body.success) {
				toast.success(`"${cat.categoryName}" restored successfully`);
				fetchDeletedCategories();
				fetchCategoriesData();
			} else {
				toast.error(body.message || "Failed to restore category");
			}
		} catch {
			toast.error("Failed to restore category");
		} finally {
			setIsProcessing(false);
		}
	};

	// ─── Hard Delete ─────────────────────────────────────────────────────────────
	const openHardDelete = (cat: DeletedCategory) => {
		setHardDeleteTarget(cat);
		setHardDeleteConfirm("");
		setIsHardDeleteOpen(true);
	};

	const handleHardDelete = async () => {
		if (!hardDeleteTarget) return;
		if (hardDeleteConfirm !== hardDeleteTarget.categoryName) {
			toast.error("Category name does not match.");
			return;
		}
		try {
			setIsProcessing(true);
			const token = localStorage.getItem("alpa_token");
			const res = await fetch(`${BASE_URL}/api/categories/hard-delete/${hardDeleteTarget.id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ reason: "Permanently deleted via Admin Dashboard" }),
			});
			const body = await res.json();
			if (body.success) {
				toast.success(`"${hardDeleteTarget.categoryName}" permanently deleted`);
				setIsHardDeleteOpen(false);
				setHardDeleteTarget(null);
				fetchDeletedCategories();
			} else {
				toast.error(body.message || "Failed to permanently delete category");
			}
		} catch {
			toast.error("Failed to permanently delete category");
		} finally {
			setIsProcessing(false);
		}
	};

	const openHistory = (id: string, name: string) => {
		setHistoryTarget({ id, name });
		setHistoryOpen(true);
	};

	// ─── Loading skeleton ────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="space-y-8 p-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="h-24 animate-pulse bg-muted" />
					))}
				</div>
				<Card className="h-96 animate-pulse bg-muted" />
			</div>
		);
	}

	if (!data) {
		return (
			<Card className="p-12 text-center">
				<p className="text-muted-foreground">Failed to load categories data</p>
			</Card>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* ── Header ── */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground text-sm">
						Manage categories, review requests, and inspect the full audit trail
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="w-4 h-4" />
							Add Direct Category
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Add New Categories</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="categories-input">Category Names</Label>
								<Textarea
									id="categories-input"
									placeholder="Enter category names (separate by comma or newline)"
									value={newCategories}
									onChange={(e) => setNewCategories(e.target.value)}
									className="h-32 resize-none"
								/>
								<p className="text-[10px] text-muted-foreground">Example: Books, Tools, Gardening</p>
							</div>
							<Button className="w-full" disabled={isProcessing || !newCategories.trim()} onClick={handleDirectCreate}>
								{isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
								Create Categories
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* ── Stats ── */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="p-5">
					<p className="text-xs font-medium text-muted-foreground">Total Categories</p>
					<div className="flex items-center justify-between mt-1">
						<p className="text-3xl font-bold">{data.totalCategories}</p>
						<Package className="w-5 h-5 text-muted-foreground" />
					</div>
				</Card>
				<Card className="p-5">
					<p className="text-xs font-medium text-muted-foreground">Total Products</p>
					<p className="text-3xl font-bold mt-1">{data.totalProducts}</p>
				</Card>
				<Card className="p-5 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10">
					<p className="text-xs font-medium text-muted-foreground">Pending Requests</p>
					<div className="flex items-center justify-between mt-1">
						<p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{data.totalPending}</p>
						<Clock className="w-5 h-5 text-yellow-500" />
					</div>
				</Card>
				<Card className="p-5 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
					<p className="text-xs font-medium text-muted-foreground">Rejected Requests</p>
					<div className="flex items-center justify-between mt-1">
						<p className="text-3xl font-bold text-red-600 dark:text-red-500">{data.totalRejected}</p>
						<X className="w-5 h-5 text-red-500" />
					</div>
				</Card>
			</div>

			{/* ── Tabs ── */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="flex flex-wrap h-auto gap-1 mb-2">
					<TabsTrigger value="active" className="gap-1.5">
						<CheckCircle2 className="w-3.5 h-3.5" />
						Active
						<Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-semibold">{data.totalApproved}</Badge>
					</TabsTrigger>
					<TabsTrigger value="pending" className="gap-1.5">
						<Clock className="w-3.5 h-3.5" />
						Pending
						{data.totalPending > 0 && (
							<Badge className="ml-1 px-1.5 py-0 text-[10px] font-semibold bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400">{data.totalPending}</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="rejected" className="gap-1.5">
						<X className="w-3.5 h-3.5" />
						Rejected
						{data.totalRejected > 0 && (
							<Badge className="ml-1 px-1.5 py-0 text-[10px] font-semibold bg-red-100 text-red-700 border-red-300 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400">{data.totalRejected}</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="recycle-bin" className="gap-1.5">
						<Trash2 className="w-3.5 h-3.5" />
						Recycle Bin
					</TabsTrigger>
					<TabsTrigger value="audit-logs" className="gap-1.5">
						<ScrollText className="w-3.5 h-3.5" />
						Audit Logs
					</TabsTrigger>
				</TabsList>

				{/* ── Active Tab ── */}
				<TabsContent value="active">
					<Card className="overflow-hidden">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="w-12 text-center">#</TableHead>
									<TableHead>Category Name</TableHead>
									<TableHead className="text-center">Products</TableHead>
									<TableHead className="text-right pr-4">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.approvedCategories.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No approved categories yet</TableCell>
									</TableRow>
								) : (
									data.approvedCategories.map((cat, idx) => (
										<TableRow key={cat.id ?? idx} className="hover:bg-muted/30">
											<TableCell className="text-center font-medium">{idx + 1}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="font-semibold">{cat.categoryName}</span>
													{cat.isRequestedCategory && (
														<Badge variant="outline" className="text-[9px] px-1 py-0">Requested</Badge>
													)}
												</div>
											</TableCell>
											<TableCell className="text-center">
												<Badge variant="secondary" className="font-bold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
													<Package className="w-3 h-3 mr-1" />
													{cat.totalProductCount ?? 0}
												</Badge>
											</TableCell>
											<TableCell className="text-right pr-4">
												<div className="flex justify-end gap-1.5">
													<Button
														variant="outline" size="sm"
														className="h-7 text-[11px] px-2 gap-1"
														onClick={() => openEdit(cat)}
													>
														<Pencil className="w-3 h-3" />Edit
													</Button>
													<Button
														variant="outline" size="sm"
														className="h-7 text-[11px] px-2 gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
														onClick={() => openSoftDelete(cat)}
													>
														<Trash2 className="w-3 h-3" />Delete
													</Button>
													<Button
														variant="outline" size="sm"
														className="h-7 text-[11px] px-2 gap-1 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
														onClick={() => openHistory(cat.id, cat.categoryName)}
													>
														<History className="w-3 h-3" />History
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>

				{/* ── Pending Tab ── */}
				<TabsContent value="pending">
					{data.totalPending === 0 ? (
						<Card className="p-10 text-center text-muted-foreground">
							<Clock className="w-8 h-8 opacity-30 mx-auto mb-2" />
							<p className="text-sm">No pending category requests</p>
						</Card>
					) : (
						<Card className="overflow-hidden border-yellow-200 dark:border-yellow-900 shadow-sm">
							<Table>
								<TableHeader className="bg-yellow-50/50 dark:bg-yellow-950/20">
									<TableRow>
										<TableHead className="w-12 text-center">#</TableHead>
										<TableHead>Category Info</TableHead>
										<TableHead>Seller Details</TableHead>
										<TableHead>Sample Product</TableHead>
										<TableHead>Requested On</TableHead>
										<TableHead className="text-right pr-6">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.pendingRequests.map((request, idx) => (
										<TableRow key={request.id} className="hover:bg-yellow-50/20 dark:hover:bg-yellow-950/10">
											<TableCell className="text-center font-medium">{idx + 1}</TableCell>
											<TableCell>
												<div className="space-y-0.5">
													<p className="font-bold text-sm">{request.categoryName}</p>
													<p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]">{request.description}</p>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-0.5">
													<p className="font-semibold text-sm">{request.seller_name}</p>
													<p className="text-[11px] text-muted-foreground">{request.storeName}</p>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-xs bg-muted px-2 py-0.5 rounded-md italic truncate block max-w-[150px]">
													{request.sampleProduct}
												</span>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{new Date(request.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
											</TableCell>
											<TableCell className="text-right pr-4">
												<div className="flex justify-end gap-2">
													<Dialog open={selectedRequest?.id === request.id} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setActionMessage(""); } }}>
														<DialogTrigger asChild>
															<Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setSelectedRequest(request); setActionMessage(""); }}>
																Review
															</Button>
														</DialogTrigger>
														<DialogContent className="max-w-md">
															<DialogHeader><DialogTitle>Review Category Request</DialogTitle></DialogHeader>
															<div className="space-y-6 py-4">
																<div className="space-y-1">
																	<h3 className="font-semibold text-xl">{request.categoryName}</h3>
																	<p className="text-muted-foreground text-sm">{request.description}</p>
																</div>
																<div className="space-y-3 text-sm bg-muted/50 p-5 rounded-xl border">
																	<div className="grid grid-cols-2 gap-4">
																		<div>
																			<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Seller Name</p>
																			<p className="mt-1">{request.seller_name}</p>
																		</div>
																		<div>
																			<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Business</p>
																			<p className="mt-1">{request.businessName}</p>
																		</div>
																		<div>
																			<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Store</p>
																			<p className="mt-1">{request.storeName}</p>
																		</div>
																		<div>
																			<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sample Product</p>
																			<p className="mt-1">{request.sampleProduct}</p>
																		</div>
																	</div>
																</div>
																<div className="space-y-2">
																	<Label htmlFor="action-message">Response Message (Optional)</Label>
																	<Textarea id="action-message" placeholder="Enter a message for the seller..." value={actionMessage} onChange={(e) => setActionMessage(e.target.value)} className="h-24 resize-none" />
																</div>
																<div className="flex gap-3 pt-2">
																	<Button variant="destructive" className="flex-1" disabled={isProcessing} onClick={() => handleRejectRequest(request.id, actionMessage)}>
																		{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" />Reject</>}
																	</Button>
																	<Button className="flex-1" disabled={isProcessing} onClick={() => handleApproveRequest(request.id, actionMessage)}>
																		{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" />Approve</>}
																	</Button>
																</div>
															</div>
														</DialogContent>
													</Dialog>
													<Button
														variant="secondary" size="sm"
														className="h-8 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400"
														onClick={() => handleApproveRequest(request.id)}
														disabled={isProcessing}
													>
														Quick Approve
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</TabsContent>

				{/* ── Rejected Tab ── */}
				<TabsContent value="rejected">
					{data.totalRejected === 0 ? (
						<Card className="p-10 text-center text-muted-foreground">
							<X className="w-8 h-8 opacity-30 mx-auto mb-2" />
							<p className="text-sm">No rejected category requests</p>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{data.rejectedRequests.map((request) => (
								<Card key={request.id} className="p-5 border-red-100 dark:border-red-950 bg-red-50/20 dark:bg-red-950/5">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<h4 className="font-bold">{request.categoryName}</h4>
											<Badge variant="outline" className="text-[10px] uppercase border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 shrink-0 ml-2">Rejected</Badge>
										</div>
										{(request.rejectionReason || request.rejectionMessage) && (
											<p className="text-xs italic text-muted-foreground">
												&ldquo;{request.rejectionReason ?? request.rejectionMessage}&rdquo;
											</p>
										)}
										<div className="pt-2 border-t text-[11px] space-y-1 text-muted-foreground">
											<p><span className="font-semibold">Seller:</span> {request.seller_name}</p>
											<p><span className="font-semibold">Store:</span> {request.storeName}</p>
											<p><span className="font-semibold">Date:</span> {new Date(request.requestedAt).toLocaleDateString()}</p>
										</div>
										<Button
											variant="ghost" size="sm"
											className="w-full h-7 text-[11px] gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
											onClick={() => openHistory(request.id, request.categoryName)}
										>
											<History className="w-3 h-3" />View History
										</Button>
									</div>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* ── Recycle Bin Tab ── */}
				<TabsContent value="recycle-bin">
					{deletedLoading ? (
						<Card className="p-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="w-4 h-4 animate-spin" />Loading recycle bin…
						</Card>
					) : deletedCategories.length === 0 ? (
						<Card className="p-10 text-center text-muted-foreground">
							<Trash2 className="w-8 h-8 opacity-30 mx-auto mb-2" />
							<p className="text-sm">Recycle bin is empty</p>
						</Card>
					) : (
						<Card className="overflow-hidden border-orange-200 dark:border-orange-900 shadow-sm">
							<Table>
								<TableHeader className="bg-orange-50/50 dark:bg-orange-950/20">
									<TableRow>
										<TableHead className="w-12 text-center">#</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Status Before Delete</TableHead>
										<TableHead>Deleted By</TableHead>
										<TableHead>Deleted On</TableHead>
										<TableHead className="text-right pr-4">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{deletedCategories.map((cat, idx) => (
										<TableRow key={cat.id} className="hover:bg-orange-50/20 dark:hover:bg-orange-950/10">
											<TableCell className="text-center font-medium">{idx + 1}</TableCell>
											<TableCell>
												<p className="font-semibold">{cat.categoryName}</p>
												{cat.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{cat.description}</p>}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-[10px]">{cat.status}</Badge>
											</TableCell>
											<TableCell>
												<p className="text-xs">{cat.deleted_by_name ?? "—"}</p>
												<p className="text-[10px] text-muted-foreground">{cat.deleted_by_email ?? ""}</p>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{new Date(cat.softDeletedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
											</TableCell>
											<TableCell className="text-right pr-4">
												<div className="flex justify-end gap-1.5">
													<Button
														variant="outline" size="sm"
														className="h-7 text-[11px] px-2 gap-1 text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/20"
														disabled={isProcessing}
														onClick={() => handleRestore(cat)}
													>
														<RotateCcw className="w-3 h-3" />Restore
													</Button>
													<Button
														variant="outline" size="sm"
														className="h-7 text-[11px] px-2 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/20"
														onClick={() => openHardDelete(cat)}
													>
														<Skull className="w-3 h-3" />Delete Permanently
													</Button>
													<Button
														variant="ghost" size="sm"
														className="h-7 text-[11px] px-2 gap-1 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
														onClick={() => openHistory(cat.id, cat.categoryName)}
													>
														<History className="w-3 h-3" />History
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Card>
					)}
				</TabsContent>

				{/* ── Audit Logs Tab ── */}
				<TabsContent value="audit-logs">
					{/* Filter bar */}
					<div className="flex flex-wrap items-center gap-3 mb-4">
						<div className="flex items-center gap-2">
							<Filter className="w-4 h-4 text-muted-foreground" />
							<span className="text-sm font-medium">Filter by action:</span>
						</div>
						<Select value={auditActionFilter} onValueChange={(v) => { setAuditActionFilter(v); setAuditPage(1); }}>
							<SelectTrigger className="w-52 h-8 text-xs">
								<SelectValue placeholder="All actions" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All actions</SelectItem>
								{Object.entries(AUDIT_ACTION_CONFIG).map(([key, cfg]) => (
									<SelectItem key={key} value={key}>{cfg.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
						{auditTotal > 0 && (
							<span className="ml-auto text-xs text-muted-foreground">
								{auditTotal} event{auditTotal !== 1 ? "s" : ""}
							</span>
						)}
					</div>

					{/* Table */}
					{auditLoading ? (
						<Card className="p-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
							<Loader2 className="w-4 h-4 animate-spin" />Loading audit logs…
						</Card>
					) : auditLogs.length === 0 ? (
						<Card className="p-10 text-center text-muted-foreground">
							<ScrollText className="w-8 h-8 opacity-30 mx-auto mb-2" />
							<p className="text-sm">No audit events found</p>
						</Card>
					) : (
						<>
							<Card className="overflow-hidden">
								<Table>
									<TableHeader className="bg-muted/50">
										<TableRow>
											<TableHead className="w-10 text-center">#</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Action</TableHead>
											<TableHead>Actor</TableHead>
											<TableHead>Changed Fields</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Timestamp</TableHead>
											<TableHead className="w-14 text-center">Diff</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{auditLogs.map((entry, idx) => {
											const badge = getAuditBadge(entry.action);
											const catName = getCategoryName(entry);
											return (
												<TableRow
													key={entry.id}
													className="hover:bg-muted/30 cursor-pointer"
													onClick={() => { setSelectedLogEntry(entry); setDiffOpen(true); }}
												>
													<TableCell className="text-center text-xs text-muted-foreground">
														{(auditPage - 1) * 20 + idx + 1}
													</TableCell>
													<TableCell>
														<span className="font-semibold text-sm">{catName}</span>
														<p className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{entry.entityId}</p>
													</TableCell>
													<TableCell>
														<span className={cn(
															"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border whitespace-nowrap",
															badge.className
														)}>
															{badge.label}
														</span>
													</TableCell>
													<TableCell>
														<p className="text-xs font-medium">{entry.actorEmail ?? entry.actorId ?? "System"}</p>
														{entry.actorRole && (
															<span className={cn(
																"inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-medium mt-0.5",
																entry.actorRole === "ADMIN"  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" :
																entry.actorRole === "SELLER" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
																"bg-muted text-muted-foreground"
															)}>
																{entry.actorRole}
															</span>
														)}
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{entry.changedFields?.length > 0
																? entry.changedFields.map((f) => (
																	<span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{f}</span>
																))
																: <span className="text-[10px] text-muted-foreground">—</span>
															}
														</div>
													</TableCell>
													<TableCell>
														<p className="text-xs text-muted-foreground italic truncate max-w-[160px]">{entry.reason ?? "—"}</p>
													</TableCell>
													<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
														{formatDate(entry.createdAt)}
													</TableCell>
													<TableCell className="text-center">
														<Button
															variant="ghost" size="sm" className="h-7 w-7 p-0"
															onClick={(e) => { e.stopPropagation(); setSelectedLogEntry(entry); setDiffOpen(true); }}
														>
															<Eye className="h-3.5 w-3.5" />
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</Card>

							{/* Pagination */}
							{auditTotalPages > 1 && (
								<div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
									<span>Page {auditPage} of {auditTotalPages} · {auditTotal} total events</span>
									<div className="flex gap-1">
										<Button
											variant="outline" size="sm" className="h-7 px-2 text-xs"
											disabled={auditPage <= 1 || auditLoading}
											onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
										>
											<ChevronLeft className="h-3 w-3" />Prev
										</Button>
										<Button
											variant="outline" size="sm" className="h-7 px-2 text-xs"
											disabled={auditPage >= auditTotalPages || auditLoading}
											onClick={() => setAuditPage((p) => p + 1)}
										>
											Next<ChevronRight className="h-3 w-3" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</TabsContent>
			</Tabs>

			{/* ── Edit Modal ── */}
			<Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setEditTarget(null); }}>
				<DialogContent className="max-w-md">
					<DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Category Name <span className="text-destructive">*</span></Label>
							<Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Category name" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-desc">Description <span className="text-muted-foreground text-xs">(optional — leave blank to keep existing)</span></Label>
							<Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Leave blank to keep existing value" className="resize-none h-20" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-sample">Sample Product <span className="text-muted-foreground text-xs">(optional)</span></Label>
							<Input id="edit-sample" value={editSample} onChange={(e) => setEditSample(e.target.value)} placeholder="Leave blank to keep existing value" />
						</div>
						<Button className="w-full" disabled={isProcessing || !editName.trim()} onClick={handleEdit}>
							{isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
							Save Changes
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Soft Delete Confirm ── */}
			<Dialog open={isSoftDeleteOpen} onOpenChange={(o) => { setIsSoftDeleteOpen(o); if (!o) setSoftDeleteTarget(null); }}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="w-4 h-4 text-orange-500" />Move to Recycle Bin
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p className="text-sm text-muted-foreground">
							<strong className="text-foreground">&ldquo;{softDeleteTarget?.categoryName}&rdquo;</strong> will be moved to the recycle bin. It can be restored later.
						</p>
						<div className="space-y-2">
							<Label htmlFor="soft-delete-reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
							<Textarea id="soft-delete-reason" value={softDeleteReason} onChange={(e) => setSoftDeleteReason(e.target.value)} placeholder="Reason for deletion…" className="resize-none h-20" />
						</div>
						<div className="flex gap-3">
							<Button variant="outline" className="flex-1" onClick={() => setIsSoftDeleteOpen(false)}>Cancel</Button>
							<Button variant="destructive" className="flex-1" disabled={isProcessing} onClick={handleSoftDelete}>
								{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" />Move to Bin</>}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Hard Delete Confirm ── */}
			<Dialog open={isHardDeleteOpen} onOpenChange={(o) => { setIsHardDeleteOpen(o); if (!o) { setHardDeleteTarget(null); setHardDeleteConfirm(""); } }}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-600">
							<Skull className="w-4 h-4" />Permanently Delete
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 flex gap-2 text-sm text-rose-700 dark:text-rose-400">
							<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
							<p>This action is <strong>irreversible</strong>. The category row will be permanently removed. Audit logs are retained.</p>
						</div>
						<p className="text-sm text-muted-foreground">
							Type <strong className="text-foreground font-mono">{hardDeleteTarget?.categoryName}</strong> to confirm:
						</p>
						<Input value={hardDeleteConfirm} onChange={(e) => setHardDeleteConfirm(e.target.value)} placeholder="Type category name to confirm" />
						<div className="flex gap-3">
							<Button variant="outline" className="flex-1" onClick={() => setIsHardDeleteOpen(false)}>Cancel</Button>
							<Button
								variant="destructive"
								className="flex-1 bg-rose-600 hover:bg-rose-700"
								disabled={isProcessing || hardDeleteConfirm !== hardDeleteTarget?.categoryName}
								onClick={handleHardDelete}
							>
								{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Skull className="w-4 h-4 mr-2" />Delete Forever</>}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Per-category Audit History Sheet ── */}
			<Sheet open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) setHistoryTarget(null); }}>
				<SheetContent className="w-full sm:max-w-lg overflow-y-auto">
					<SheetHeader className="mb-4">
						<SheetTitle className="flex items-center gap-2">
							<History className="w-4 h-4 text-purple-500" />
							Category Audit History
						</SheetTitle>
					</SheetHeader>
					{historyTarget && (
						<CategoryAuditHistory categoryId={historyTarget.id} categoryName={historyTarget.name} />
					)}
				</SheetContent>
			</Sheet>

			{/* ── Diff Modal ── */}
			<AuditLogDiffModal
				entry={selectedLogEntry}
				open={diffOpen}
				onOpenChange={(o) => { setDiffOpen(o); if (!o) setSelectedLogEntry(null); }}
			/>
		</div>
	);
};

export default AdminCategoriesPage;
