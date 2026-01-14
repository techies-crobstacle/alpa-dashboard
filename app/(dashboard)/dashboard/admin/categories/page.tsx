"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Package } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// TypeScript interfaces for the API response
interface Category {
id: string | null | undefined;
  name: string;
  productCount: number;
}

interface CategorySummary {
  totalCategories: number;
  totalProducts: number;
}

interface CategoriesApiResponse {
  success: boolean;
  categories: Category[];
  summary: CategorySummary;
}

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [summary, setSummary] = useState<CategorySummary>({ totalCategories: 0, totalProducts: 0 });
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);

	// Fetch categories from API
	const fetchCategories = async () => {
		try {
			setLoading(true);
			console.log("Fetching categories...");
			
			const response: CategoriesApiResponse = await api.get('/api/admin/categories', {
				headers: {
					Authorization: ""
				}
			});
			console.log('Categories API Response:', response);

			if (response.success) {
				setCategories(response.categories || []);
				setSummary(response.summary || { totalCategories: 0, totalProducts: 0 });
			} else {
				throw new Error('API returned success: false');
			}

		} catch (error) {
			console.error('Failed to fetch categories:', error);
			toast.error("Failed to load categories", {
				description: "Please try refreshing the page.",
			});
			// Set empty state on error
			setCategories([]);
			setSummary({ totalCategories: 0, totalProducts: 0 });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground">
						View and manage product categories.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchCategories}
						disabled={loading}
						className="gap-2"
					>
						<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
					<Button
						onClick={() => setShowAdd(true)}
						className="gap-2 w-full md:w-auto"
					>
						<Plus className="w-4 h-4" /> Add Category
					</Button>
				</div>
			</div>
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2">
						<span className="text-muted-foreground text-sm flex items-center gap-2">
							<Package className="w-4 h-4" />
							Total Categories
						</span>
						<span className="text-3xl font-bold">
							{loading ? (
								<div className="h-9 w-12 bg-muted animate-pulse rounded"></div>
							) : (
								summary.totalCategories
							)}
						</span>
					</CardContent>
				</Card>
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2">
						<span className="text-muted-foreground text-sm flex items-center gap-2">
							<Package className="w-4 h-4" />
							Total Products
						</span>
						<span className="text-3xl font-bold">
							{loading ? (
								<div className="h-9 w-12 bg-muted animate-pulse rounded"></div>
							) : (
								summary.totalProducts
							)}
						</span>
					</CardContent>
				</Card>
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2 items-start justify-center">
						<span className="text-muted-foreground text-sm">
							Average Products/Category
						</span>
						<span className="text-3xl font-bold">
							{loading ? (
								<div className="h-9 w-12 bg-muted animate-pulse rounded"></div>
							) : (
								summary.totalCategories > 0 
									? Math.round(summary.totalProducts / summary.totalCategories * 10) / 10
									: 0
							)}
						</span>
					</CardContent>
				</Card>
			</div>
			{/* Table */}
			<Card className="overflow-x-auto rounded-lg border bg-background mt-2">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">#</TableHead>
							<TableHead>Category Name</TableHead>
							<TableHead>Product Count</TableHead>
							<TableHead className="w-32">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							// Loading skeleton rows
							[...Array(3)].map((_, idx) => (
								<TableRow key={idx}>
									<TableCell>
										<div className="h-4 w-6 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
									</TableCell>
									<TableCell>
										<div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
									</TableCell>
								</TableRow>
							))
						) : categories.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center text-muted-foreground py-8"
								>
									<div className="flex flex-col items-center gap-2">
										<Package className="w-8 h-8 text-muted-foreground/50" />
										<span>No categories found.</span>
										<span className="text-sm">Add your first category to get started.</span>
									</div>
								</TableCell>
							</TableRow>
						) : (
							categories.map((cat, idx) => (
								<TableRow key={`${cat.name}-${idx}`}>
									<TableCell className="font-medium">{idx + 1}</TableCell>
									<TableCell className="font-semibold">{cat.name}</TableCell>
									<TableCell>
										   <Badge variant="secondary" className="font-medium">
											   {cat.productCount}
										   </Badge>
									</TableCell>
									<TableCell>
										<Button
											variant="outline"
											size="sm"
											disabled
										>
											Edit
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>
			{/* Add Category Modal Placeholder */}
			{showAdd && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
					<div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-sm">
						<h2 className="text-lg font-semibold mb-4">
							Add New Category
						</h2>
						<input
							type="text"
							placeholder="Category name"
							className="w-full border rounded px-3 py-2 mb-4"
							// onChange handler would go here
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setShowAdd(false)}
							>
								Cancel
							</Button>
							<Button disabled>Add</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
