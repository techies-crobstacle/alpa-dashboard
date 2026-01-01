"use client"
import React from "react";
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
import { Plus } from "lucide-react";

// Dummy data for categories and products
const categories = [
	{
		id: 1,
		name: "Electronics",
		products: [
			{ id: 101, name: "Smartphone" },
			{ id: 102, name: "Laptop" },
		],
	},
	{
		id: 2,
		name: "Clothing",
		products: [
			{ id: 201, name: "T-shirt" },
			{ id: 202, name: "Jeans" },
		],
	},
	{
		id: 3,
		name: "Home Appliances",
		products: [
			{ id: 301, name: "Refrigerator" },
			{ id: 302, name: "Microwave" },
		],
	},
];

export default function CategoriesPage() {
	const [selectedCategory, setSelectedCategory] = React.useState<number | null>(
		null
	);
	const [showAdd, setShowAdd] = React.useState(false);

	// Calculate summary
	const totalCategories = categories.length;
	const totalProducts = categories.reduce(
		(sum, cat) => sum + cat.products.length,
		0
	);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground">
						View and manage product categories.
					</p>
				</div>
				<Button
					onClick={() => setShowAdd(true)}
					className="gap-2 w-full md:w-auto"
				>
					<Plus className="w-4 h-4" /> Add Category
				</Button>
			</div>
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2">
						<span className="text-muted-foreground text-sm">
							Total Categories
						</span>
						<span className="text-3xl font-bold">{totalCategories}</span>
					</CardContent>
				</Card>
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2">
						<span className="text-muted-foreground text-sm">
							Total Products
						</span>
						<span className="text-3xl font-bold">{totalProducts}</span>
					</CardContent>
				</Card>
				<Card className="shadow-none border bg-background">
					<CardContent className="p-6 flex flex-col gap-2 items-start justify-center">
						<span className="text-muted-foreground text-sm">
							Estimated Revenue
						</span>
						<span className="text-3xl font-bold">$0</span>
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
							<TableHead># of Products</TableHead>
							<TableHead className="w-32">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{categories.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center text-muted-foreground py-8"
								>
									No categories found.
								</TableCell>
							</TableRow>
						) : (
							categories.map((cat, idx) => (
								<TableRow key={cat.id}>
									<TableCell className="font-medium">{idx + 1}</TableCell>
									<TableCell className="font-semibold">{cat.name}</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{cat.products.length}
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
