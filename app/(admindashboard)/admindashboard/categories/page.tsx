"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, Clock, X, CheckCircle2, Package } from "lucide-react";

interface ApprovedCategory {
	categoryName: string;
	totalProductCount: number;
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

const AdminCategoriesPage = () => {
	const [data, setData] = useState<CategoriesResponse["data"] | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [actionMessage, setActionMessage] = useState("");
	
	// Direct creation state
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newCategories, setNewCategories] = useState("");

	useEffect(() => {
		fetchCategoriesData();
	}, []);

	const fetchCategoriesData = async () => {
		try {
			setLoading(true);
			const response = await apiClient("/api/categories/");
			
			if (response.success && response.data) {
				setData(response.data);
			}
		} catch (error) {
			console.error("Error fetching categories:", error);
			toast.error("Failed to load categories data");
		} finally {
			setLoading(false);
		}
	};

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
			console.error("Error approving request:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to approve request";
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

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
			console.error("Error rejecting request:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to reject request";
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDirectCreate = async () => {
		if (!newCategories.trim()) {
			toast.error("Please enter at least one category name");
			return;
		}

		// Split by comma or newline and filter out empty strings
		const categoriesList = newCategories
			.split(/[,\n]/)
			.map(c => c.trim())
			.filter(c => c.length > 0);

		if (categoriesList.length === 0) {
			toast.error("Please enter valid category names");
			return;
		}

		try {
			setIsProcessing(true);
			const response = await apiClient("/api/categories/create-direct", {
				method: "POST",
				body: JSON.stringify({ categories: categoriesList }),
			});

			if (response.success) {
				const { totalCreated, skipped } = response.data;
				let message = `${totalCreated} categories created successfully.`;
				if (skipped > 0) {
					message += ` ${skipped} were skipped (already exist).`;
				}
				
				toast.success(message);
				setIsCreateOpen(false);
				setNewCategories("");
				fetchCategoriesData();
			}
		} catch (error) {
			console.error("Error creating categories:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to create categories";
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

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
		<div className="space-y-8 p-6">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Admin Categories</h1>
					<p className="text-muted-foreground">
						Manage approved categories and review pending requests from sellers
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
								<p className="text-[10px] text-muted-foreground">
									Example: Books, Tools, Gardening
								</p>
							</div>

							<Button
								className="w-full"
								disabled={isProcessing || !newCategories.trim()}
								onClick={handleDirectCreate}
							>
								{isProcessing ? (
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
								) : (
									<Plus className="w-4 h-4 mr-2" />
								)}
								Create Categories
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="p-6">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Total Categories</p>
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold">{data.totalCategories}</p>
							<Package className="w-5 h-5 text-muted-foreground" />
						</div>
					</div>
				</Card>
				<Card className="p-6">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Total Products</p>
						<p className="text-3xl font-bold">{data.totalProducts}</p>
					</div>
				</Card>
				<Card className="p-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{data.totalPending}</p>
							<Clock className="w-5 h-5 text-yellow-500" />
						</div>
					</div>
				</Card>
				<Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Rejected Requests</p>
						<div className="flex items-center justify-between">
							<p className="text-3xl font-bold text-red-600 dark:text-red-500">{data.totalRejected}</p>
							<X className="w-5 h-5 text-red-500" />
						</div>
					</div>
				</Card>
			</div>

			{/* Pending Requests Section */}
			{data.totalPending > 0 && (
				<div className="space-y-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<Clock className="w-5 h-5 text-yellow-500" />
							Pending Requests ({data.totalPending})
						</h2>
						<p className="text-muted-foreground text-sm mt-1">
							New category requests from sellers awaiting your review
						</p>
					</div>
					<Card className="overflow-hidden border-yellow-200 dark:border-yellow-900 shadow-sm">
						<Table>
							<TableHeader className="bg-yellow-50/50 dark:bg-yellow-950/20">
								<TableRow>
									<TableHead className="w-16 text-center">#</TableHead>
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
												<p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]">
													{request.description}
												</p>
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
											{new Date(request.requestedAt).toLocaleDateString(undefined, {
												month: 'short',
												day: 'numeric',
												year: 'numeric'
											})}
										</TableCell>
										<TableCell className="text-right pr-4">
											<div className="flex justify-end gap-2">
												<Dialog open={selectedRequest?.id === request.id} onOpenChange={(open) => {
													if (!open) {
														setSelectedRequest(null);
														setActionMessage("");
													}
												}}>
													<DialogTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															className="h-8 text-xs"
															onClick={() => {
																setSelectedRequest(request);
																setActionMessage("");
															}}
														>
															Review
														</Button>
													</DialogTrigger>
													<DialogContent className="max-w-md">
														<DialogHeader>
															<DialogTitle>Review Category Request</DialogTitle>
														</DialogHeader>
														<div className="space-y-6 py-4">
															<div className="space-y-2">
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
																<Textarea
																	id="action-message"
																	placeholder="Enter a message for the seller..."
																	value={actionMessage}
																	onChange={(e) => setActionMessage(e.target.value)}
																	className="h-24 resize-none"
																/>
															</div>

															<div className="flex gap-3 pt-2">
																<Button
																	variant="destructive"
																	className="flex-1"
																	disabled={isProcessing}
																	onClick={() => handleRejectRequest(request.id, actionMessage)}
																>
																	{isProcessing ? (
																		<Loader2 className="w-4 h-4 animate-spin" />
																	) : (
																		<>
																			<X className="w-4 h-4 mr-2" />
																			Reject
																		</>
																			)}
																</Button>
																<Button
																	className="flex-1"
																	disabled={isProcessing}
																	onClick={() => handleApproveRequest(request.id, actionMessage)}
																>
																	{isProcessing ? (
																		<Loader2 className="w-4 h-4 animate-spin" />
																	) : (
																		<>
																			<CheckCircle2 className="w-4 h-4 mr-2" />
																			Approve
																		</>
																	)}
																</Button>
															</div>
														</div>
													</DialogContent>
												</Dialog>
												<Button 
													variant="secondary" 
													size="sm"
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
				</div>
			)}

			{/* Approved Categories Table Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<CheckCircle2 className="w-5 h-5 text-green-500" />
							Approved Categories ({data.totalApproved})
						</h2>
						<p className="text-muted-foreground text-sm mt-1">
							Currently active categories available for all sellers
						</p>
					</div>
				</div>
				<Card className="overflow-hidden border-muted-foreground/10">
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow>
								<TableHead className="w-16 text-center">#</TableHead>
								<TableHead>Category Name</TableHead>
								<TableHead className="text-right pr-8 font-semibold">Total Product Count</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.approvedCategories.length === 0 ? (
								<TableRow>
									<TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
										No approved categories found
									</TableCell>
								</TableRow>
							) : (
								data.approvedCategories.map((category, idx) => (
									<TableRow key={idx} className="hover:bg-muted/30">
										<TableCell className="font-medium text-center">{idx + 1}</TableCell>
										<TableCell className="font-semibold text-base">{category.categoryName}</TableCell>
										<TableCell className="text-right pr-8">
											<Badge 
												variant="secondary" 
												className="font-bold px-3 py-1 bg-primary/10 text-primary border-primary/20"
											>
												<Package className="w-3.5 h-3.5 mr-1.5" />
												{category.totalProductCount || 0}
											</Badge>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</Card>
			</div>

			{/* Rejected Requests Section */}
			{data.totalRejected > 0 && (
				<div className="space-y-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-muted-foreground">
							<X className="w-5 h-5" />
							Recently Rejected ({data.totalRejected})
						</h2>
						<p className="text-muted-foreground text-sm mt-1">
							History of rejected category requests
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{data.rejectedRequests.map((request) => (
							<Card
								key={request.id}
								className="p-5 border-red-100 dark:border-red-950 bg-red-50/20 dark:bg-red-950/5 opacity-80"
							>
								<div className="space-y-3">
									<div className="flex justify-between items-center text-muted-foreground">
										<h4 className="font-bold">{request.categoryName}</h4>
										<Badge variant="outline" className="text-[10px] uppercase border-red-200 bg-red-50 text-red-700">Rejected</Badge>
									</div>
									<p className="text-xs italic text-muted-foreground">"{request.rejectionReason || "No reason provided"}"</p>
									<div className="pt-2 border-t text-[11px] space-y-1">
										<p><span className="font-semibold">Seller:</span> {request.seller_name}</p>
										<p><span className="font-semibold">Date:</span> {new Date(request.requestedAt).toLocaleDateString()}</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminCategoriesPage;
