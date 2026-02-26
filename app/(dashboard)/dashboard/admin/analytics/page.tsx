"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingUp, Download, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

interface AnalyticsData {
	totalRevenue: string;
	totalOrders: number;
	totalItemsSold: number;
	averageOrderValue: string;
	statusBreakdown: Record<string, number>;
	topProducts: Array<{
		productId: string;
		title: string;
		quantity: number;
		revenue: number;
	}>;
	period: {
		startDate: string;
		endDate: string;
	};
}

interface DayData {
	date: string;
	revenue: number;
	orders: number;
}

const AnalyticsPage = () => {
	const router = useRouter();
	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [dayData, setDayData] = useState<DayData[]>([]);
	const [timeframe, setTimeframe] = useState<"7D" | "30D" | "1Y">("30D");
	const [chartLoading, setChartLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [exporting, setExporting] = useState(false);

	// Function to fetch analytics data
	const fetchAnalytics = async () => {
		setRefreshing(true);
		try {
			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");

			if (!token) {
				throw new Error("No authentication token found");
			}

			console.log("🔍 Fetching analytics with token:", token ? `${token.slice(0, 20)}...` : "NO TOKEN");

			const url = `${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com"}/api/admin/sales/analytics`;
			console.log("📍 Analytics API URL:", url);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
				credentials: "include",
			});

			console.log("📊 Analytics Response Status:", response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Analytics API Error:", errorText);
				throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log("✅ Analytics Data:", data);

			if (data.success && data.analytics) {
				setAnalytics(data.analytics);
				toast.success("Analytics data loaded successfully");
			} else {
				throw new Error("Invalid analytics response structure");
			}
		} catch (error: any) {
			console.error("❌ Error fetching analytics:", error);
			toast.error(error?.message || "Failed to fetch analytics");
			setAnalytics(null);
		} finally {
			setRefreshing(false);
		}
	};

	// Function to export sales data as CSV
	const exportSalesData = async () => {
		setExporting(true);
		try {
			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");

			if (!token) {
				throw new Error("No authentication token found");
			}

			const url = `${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com"}/api/admin/sales/export`;
			
			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${token}`,
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`Failed to export data: ${response.status} ${response.statusText}`);
			}

			// Get the CSV file blob
			const blob = await response.blob();
			
			// Create a URL for the blob
			const blobUrl = window.URL.createObjectURL(blob);
			
			// Create a link element and trigger download
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the blob URL
			window.URL.revokeObjectURL(blobUrl);
			
			toast.success("Sales data exported successfully");
		} catch (error: any) {
			console.error("❌ Error exporting sales data:", error);
			toast.error(error?.message || "Failed to export sales data");
		} finally {
			setExporting(false);
		}
	};
	// Fetch chart data from the dedicated revenue-chart endpoint
	const fetchChartData = useCallback(async (tf: "7D" | "30D" | "1Y") => {
		setChartLoading(true);
		try {
			const endpoint = `/api/admin/analytics/revenue-chart?period=${tf}`;
			console.log("📊 Fetching chart:", `${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com"}${endpoint}`);

			const json = await api.get(endpoint);

			if (json?.success && Array.isArray(json.data)) {
				const formatted: DayData[] = json.data.map(
					(entry: { date: string; revenue: number; orders: number }) => ({
						date: new Date(entry.date + "T00:00:00").toLocaleDateString(
							"en-US",
							tf === "1Y"
								? { month: "short", year: "2-digit" }
								: { month: "short", day: "numeric" }
						),
						revenue: entry.revenue,
						orders: entry.orders,
					})
				);
				setDayData(formatted);
			} else {
				throw new Error("Invalid chart response structure");
			}
		} catch (error) {
			console.error("Failed to fetch chart data:", error);
			toast.error("Failed to load chart data");
		} finally {
			setChartLoading(false);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		const checkAuth = async () => {
			if (typeof window === "undefined") {
				setLoading(false);
				return;
			}

			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");

			if (!token) {
				console.log("No token found, redirecting to login");
				toast.error("Please login to continue");
				setLoading(false);
				setTimeout(() => router.push("/login"), 300);
				return;
			}

			try {
				// Validate token format (JWT has 3 parts)
				const parts = token.split(".");
				if (parts.length !== 3) {
					throw new Error("Invalid token format");
				}

				const payload = JSON.parse(atob(parts[1]));
				const userRole = payload.role?.toLowerCase()?.trim();

				const isAdmin = userRole?.includes("admin");

				if (!isAdmin) {
					console.error(`Access denied: user role is "${userRole}", admin required`);
					toast.error(`Unauthorized - Admin access required`);
					setLoading(false);
					setTimeout(() => router.push("/dashboard"), 300);
					return;
				}

				// Fetch analytics summary and chart data in parallel
				await Promise.all([fetchAnalytics(), fetchChartData(timeframe)]);
				setLoading(false);
			} catch (e) {
				console.error("Token validation error:", e);
				localStorage.removeItem("alpa_token");
				localStorage.removeItem("auth_token");
				toast.error("Invalid session. Please login again.");
				setLoading(false);
				setTimeout(() => router.push("/login"), 300);
			}
		};

		checkAuth();
	}, [router]);

	// Re-fetch chart data when timeframe changes
	useEffect(() => {
		if (!loading) {
			fetchChartData(timeframe);
		}
	}, [timeframe, loading, fetchChartData]);

	// Skeleton loader
	const renderSkeleton = () => (
		<div className="space-y-8 animate-pulse">
			<div className="h-10 w-1/4 bg-gray-200 rounded" />
			<div className="grid gap-6 md:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="p-4 rounded-lg border bg-white h-32" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="p-6 rounded-lg border bg-white h-80" />
				))}
			</div>
		</div>
	);

	if (loading) {
		return renderSkeleton();
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
					<p className="text-muted-foreground text-lg mt-2">
						Real-time sales analytics and performance metrics
					</p>
				</div>
				
				<div className="flex gap-3">
					<button
						onClick={() => exportSalesData()}
						disabled={exporting}
						className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					>
						<Download className="h-4 w-4" />
						{exporting ? "Exporting..." : "Export CSV"}
					</button>
					<button
						onClick={() => Promise.all([fetchAnalytics(), fetchChartData(timeframe)])}
						disabled={refreshing || chartLoading}
						className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					>
						{refreshing || chartLoading ? "Refreshing..." : "Refresh Data"}
					</button>
				</div>
			</div>

			{/* Key Metrics Cards */}
			{analytics && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
							<DollarSign className="h-5 w-5 text-emerald-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${parseFloat(analytics.totalRevenue).toFixed(2)}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								All-time revenue
							</p>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
							<TrendingUp className="h-5 w-5 text-blue-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.totalOrders}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Orders placed
							</p>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="text-sm font-medium">Items Sold</CardTitle>
							<TrendingUp className="h-5 w-5 text-purple-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.totalItemsSold}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Total units
							</p>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
							<DollarSign className="h-5 w-5 text-orange-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${parseFloat(analytics.averageOrderValue).toFixed(2)}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Per order average
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Charts Section */}
			<div className="grid gap-6 lg:grid-cols-1">
				{/* Sales Revenue and Orders Chart */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-semibold">
									Revenue & Orders Overview
								</CardTitle>
								<p className="text-muted-foreground text-sm mt-1">
									Daily sales revenue and order count
								</p>
							</div>
							<div className="flex gap-2">
								{(["7D", "30D", "1Y"] as const).map((tf) => (
									<button
										key={tf}
										onClick={() => setTimeframe(tf)}
										className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
											timeframe === tf
												? "bg-primary text-white"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{tf}
									</button>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent>
					{chartLoading ? (
						<div className="flex items-center justify-center h-80 text-gray-500 gap-2">
							<RefreshCw className="h-5 w-5 animate-spin" />
							<p>Fetching real-time chart data...</p>
						</div>
					) : dayData.length > 0 ? (
						<ResponsiveContainer width="100%" height={400}>
							<LineChart
								data={dayData}
								margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
							>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="date"
									angle={-45}
									textAnchor="end"
									height={80}
									tick={{ fontSize: 12 }}
								/>
								<YAxis
									yAxisId="left"
									tick={{ fontSize: 12 }}
									label={{ value: "Revenue ($)", angle: -90, position: "insideLeft" }}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									tick={{ fontSize: 12 }}
									label={{ value: "Orders", angle: 90, position: "insideRight" }}
								/>
								<Tooltip
									formatter={(value: number | undefined) => value?.toFixed(2) ?? "0.00"}
									contentStyle={{ backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "8px" }}
								/>
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="revenue"
									stroke="#3b82f6"
									dot={false}
									name="Revenue ($)"
									strokeWidth={2}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="orders"
									stroke="#10b981"
									dot={false}
									name="Orders"
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-80 text-gray-500">
							<p>No chart data available for this period</p>
						</div>
					)}
					</CardContent>
				</Card>
			</div>

			{/* Order Status and Top Products */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Order Status Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Order Status Breakdown
						</CardTitle>
						<p className="text-muted-foreground text-sm mt-1">
							Distribution of orders by status
						</p>
					</CardHeader>
					<CardContent>
						{analytics?.statusBreakdown ? (
							<div className="space-y-3">
								{Object.entries(analytics.statusBreakdown).map(([status, count]: [string, any]) => (
									<div key={status} className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-700">{status}</span>
										<div className="flex items-center gap-3">
											<div className="w-32 bg-gray-200 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full"
													style={{
														width: `${
															analytics.totalOrders > 0
																? (count / analytics.totalOrders) * 100
																: 0
														}%`,
													}}
												/>
											</div>
											<span className="text-sm font-bold text-gray-800 w-12 text-right">
												{count}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p>No order data available</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Top Products */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Top Products
						</CardTitle>
						<p className="text-muted-foreground text-sm mt-1">
							Best performing products by revenue
						</p>
					</CardHeader>
					<CardContent>
						{analytics?.topProducts && analytics.topProducts.length > 0 ? (
							<div className="space-y-3">
								{analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
									<div
										key={product.productId}
										className="flex items-start gap-3 pb-3 border-b last:border-b-0"
									>
										<div className="text-lg font-bold text-gray-400 w-6 flex-shrink-0">
											{index + 1}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-gray-800 text-sm truncate">
												{product.title}
											</p>
											<div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
												<span>Qty: {product.quantity}</span>
												<span>•</span>
												<span className="text-green-600 font-semibold">
													${parseFloat(product.revenue).toFixed(2)}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p>No product data available</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AnalyticsPage;
