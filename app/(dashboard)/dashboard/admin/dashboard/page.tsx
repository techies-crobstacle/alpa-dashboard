"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Activity,
	CreditCard,
	DollarSign,
	Users,
	ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import UserListCard from "../UserListCard";

const stats = [
	{
		title: "Total Revenue",
		value: "$45,231.89",
		icon: DollarSign,
		description: "+20.1% from last month",
		trend: "up",
		color: "text-emerald-600",
		bgColor: "bg-emerald-50",
	},
	// {
	// 	title: "Subscriptions",
	// 	value: "+2,350",
	// 	icon: Users,
	// 	description: "+180.1% from last month",
	// 	trend: "up",
	// 	color: "text-blue-600",
	// 	bgColor: "bg-blue-50",
	// },
	{
		title: "Sales",
		value: "+12,234",
		icon: CreditCard,
		description: "+19% from last month",
		trend: "up",
		color: "text-purple-600",
		bgColor: "bg-purple-50",
	},
	{
		title: "Active Now",
		value: "+573",
		icon: Activity,
		description: "+201 since last hour",
		trend: "up",
		color: "text-orange-600",
		bgColor: "bg-orange-50",
	},
];

// Utility to get token from cookie if not in localStorage
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )alpa_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function DashboardPage() {
	const router = useRouter();
	const [checking, setChecking] = useState(true);
	const [userRole, setUserRole] = useState<string | null>(null);
	const [slaData, setSlaData] = useState<any>(null);
	const [loadingSla, setLoadingSla] = useState(false);
	const [sellers, setSellers] = useState<any[]>([]);
	const [selectedSeller, setSelectedSeller] = useState<string>("");
	const [loadingSellers, setLoadingSellers] = useState(false);

	// Function to fetch sellers list for SLA Dashboard
	const fetchSellers = async () => {
		setLoadingSellers(true);
		try {
			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");
			
			console.log("🔍 Fetching sellers with token:", token ? `${token.slice(0, 20)}...` : "NO TOKEN");
			
			const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/users/all`;
			console.log("📍 API URL:", url);
			
			// Use fetch directly with better error handling
			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					...(token && { "Authorization": `Bearer ${token}` }),
				},
				credentials: "include",
			});
			
			console.log("📊 Response Status:", response.status, response.statusText);
			console.log("📊 Response Headers:", {
				contentType: response.headers.get("content-type"),
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ API Error Response:", errorText);
				throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			console.log("✅ API /api/users/all Response:", data);
			console.log("✅ Response type:", typeof data, "Is Array:", Array.isArray(data));
			
			// Handle different response structures
			let allUsers = [];
			
			if (Array.isArray(data)) {
				// Response is directly an array
				console.log("📦 Response is a direct array");
				allUsers = data;
			} else if (data.users && Array.isArray(data.users)) {
				// Response has a 'users' property
				console.log("📦 Response has .users property");
				allUsers = data.users;
			} else if (data.data && Array.isArray(data.data)) {
				// Response has a 'data' property
				console.log("📦 Response has .data property");
				allUsers = data.data;
			} else if (data.result && Array.isArray(data.result)) {
				// Response has a 'result' property
				console.log("📦 Response has .result property");
				allUsers = data.result;
			} else {
				console.warn("⚠️ Unexpected API response structure:", data);
				allUsers = [];
			}
			
			// Filter for sellers only
			const sellersOnly = allUsers.filter((u: any) => 
				u.role === "SELLER" || u.role === "seller" || u.userRole === "SELLER" || u.userRole === "seller"
			);
			
			console.log(`✅ Total users: ${allUsers.length}, Sellers: ${sellersOnly.length}`, sellersOnly);
			setSellers(sellersOnly);
			
			// Auto-select first seller if available
			if (sellersOnly.length > 0) {
				setSelectedSeller(sellersOnly[0].id);
				toast.success(`Loaded ${sellersOnly.length} seller(s)`);
			} else {
				setSelectedSeller("");
				toast.info("No sellers found in the system");
			}
		} catch (err: any) {
			console.error("❌ Error fetching sellers:", err);
			console.error("❌ Error message:", err?.message);
			console.error("❌ Error stack:", err?.stack);
			toast.error(err?.message || "Failed to load sellers");
			setSellers([]);
			setSelectedSeller("");
		} finally {
			setLoadingSellers(false);
		}
	};

	// Function to fetch notifications for selected seller
	const fetchSlaData = async (sellerId: string) => {
		if (!sellerId) {
			setSlaData(null);
			return;
		}
		
		setLoadingSla(true);
		try {
			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");
			
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/seller/notifications?sellerId=${sellerId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						...(token && { "Authorization": `Bearer ${token}` }),
					},
					credentials: "include",
				}
			);
			
			if (!response.ok) {
				throw new Error(`Failed to fetch SLA data: ${response.status} ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log(`SLA data for seller ${sellerId}:`, data);
			
			setSlaData(data);
			
			// Show success message if notifications exist
			if (data?.notifications?.length > 0) {
				console.log(`Loaded ${data.notifications.length} notifications`);
			}
		} catch (error: any) {
			console.error("Failed to fetch SLA data:", error);
			toast.error(error?.message || "Failed to fetch SLA data");
			
			// Set empty state on error
			setSlaData({
				success: false,
				notifications: [],
				summary: {
					total: 0,
					pending: 0,
					overdue: 0,
					critical: 0
				}
			});
		} finally {
			setLoadingSla(false);
		}
	};

	// Initial auth check
	useEffect(() => {
		const checkAuth = async () => {
			if (typeof window === "undefined") {
				setChecking(false);
				return;
			}
			
			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");
			
			if (!token) {
				console.log("No token found, redirecting to login");
				toast.error("Please login to continue");
				setChecking(false);
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
				console.log("User payload:", payload);
				
				// Check if token is expired
				if (payload.exp && payload.exp * 1000 < Date.now()) {
					console.warn("Token expired");
					localStorage.removeItem("alpa_token");
					localStorage.removeItem("auth_token");
					toast.error("Session expired. Please login again.");
					setChecking(false);
					setTimeout(() => router.push("/login"), 300);
					return;
				}
				
				// Check user role - be flexible with case and whitespace
				const userRole = payload.role?.toLowerCase()?.trim();
				console.log(`User role from token: "${userRole}"`);
				
				setUserRole(payload.role);
				
				// Only allow admin access
				const isAdmin = userRole?.includes("admin");
				
				if (!isAdmin) {
					console.error(`Access denied: user role is "${userRole}", admin required`);
					toast.error(`Unauthorized - Admin access required. Your role: ${payload.role}`);
					setChecking(false);
					setTimeout(() => router.push("/dashboard"), 300);
					return;
				}
				
				console.log("User is admin, fetching sellers");
				// Fetch sellers directly
				await fetchSellers();
				setChecking(false);
			} catch (e) {
				console.error("Token validation error:", e);
				localStorage.removeItem("alpa_token");
				localStorage.removeItem("auth_token");
				toast.error("Invalid session. Please login again.");
				setChecking(false);
				setTimeout(() => router.push("/login"), 300);
			}
		};
		
		checkAuth();
	}, [router]);

	// Fetch SLA data when seller is selected
	useEffect(() => {
		if (selectedSeller && (userRole === "admin" || userRole === "ADMIN")) {
			console.log(`Selected seller changed to: ${selectedSeller}`);
			fetchSlaData(selectedSeller);
		}
	}, [selectedSeller, userRole]);

	// Handle seller selection change
	const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newSellerId = e.target.value;
		console.log(`Seller selection changed to: ${newSellerId}`);
		setSelectedSeller(newSellerId);
	};


	// Skeleton loader for the whole page
	function renderSkeletonPage() {
		return (
			<div className="space-y-8 animate-pulse">
				{/* Header Skeleton */}
				<div className="flex flex-col gap-2">
					<div className="h-10 w-1/3 bg-gray-200 rounded mb-2" />
					<div className="h-6 w-1/2 bg-gray-100 rounded" />
				</div>

				{/* Stats Grid Skeleton */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="p-4 rounded-lg border bg-white flex flex-col gap-3">
							<div className="flex flex-row items-center justify-between">
								<div className="h-4 w-20 bg-gray-200 rounded" />
								<div className="h-8 w-8 bg-gray-100 rounded-lg" />
							</div>
							<div className="h-8 w-2/3 bg-gray-200 rounded" />
							<div className="h-4 w-1/2 bg-gray-100 rounded" />
						</div>
					))}
				</div>

				{/* SLA Dashboard and User List Skeletons */}
				<div className="grid gap-6 lg:grid-cols-2">
					{/* SLA Dashboard Card Skeleton */}
					<div className="p-6 rounded-lg border bg-white flex flex-col gap-4">
						<div className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
						<div className="h-4 w-1/4 bg-gray-100 rounded mb-4" />
						<div className="flex items-center gap-2 mb-4">
							<div className="h-8 w-32 bg-gray-100 rounded" />
							<div className="h-8 w-40 bg-gray-100 rounded" />
						</div>
						{/* Summary Stats Skeleton */}
						<div className="grid grid-cols-2 gap-4">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="p-4 rounded-lg border bg-gray-50 flex flex-col gap-2">
									<div className="h-4 w-1/2 bg-gray-200 rounded" />
									<div className="h-6 w-1/3 bg-gray-100 rounded" />
								</div>
							))}
						</div>
						{/* Notifications List Skeleton */}
						<div className="space-y-2 mt-4">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
									<div className="w-2 h-2 rounded-full mt-2 bg-gray-300" />
									<div className="flex-1 min-w-0">
										<div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
										<div className="h-3 w-1/2 bg-gray-100 rounded mb-1" />
										<div className="flex gap-2 mt-2">
											<div className="h-3 w-12 bg-gray-100 rounded" />
											<div className="h-3 w-10 bg-gray-100 rounded" />
										</div>
									</div>
									<div className="h-3 w-10 bg-gray-100 rounded mt-2" />
								</div>
							))}
						</div>
					</div>
					{/* User List Card Skeleton */}
					<div className="p-6 rounded-lg border bg-white flex flex-col gap-4">
						<div className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
						{[...Array(5)].map((_, i) => (
							<div key={i} className="h-4 w-full bg-gray-100 rounded mb-2" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (checking || loadingSellers || loadingSla) {
		return renderSkeletonPage();
	}

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex flex-col gap-2">
				<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground text-lg">
					Welcome back! Here&apos;s an overview of your data.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat) => {
					const Icon = stat.icon;

					return (
						<Card
							key={stat.title}
							className="group hover:shadow-lg transition-all duration-200"
						>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{stat.title}
								</CardTitle>
								<div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
									<Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="text-3xl font-bold mb-2">{stat.value}</div>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{stat.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Additional Content Sections */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* SLA Dashboard Card */}
				<Card>
					<CardHeader>
                        <div>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<CardTitle className="text-xl font-semibold">
									SLA Dashboard
								</CardTitle>
								<p className="text-muted-foreground mt-1">
									Service Level Agreement monitoring
								</p>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<span className="text-sm text-muted-foreground whitespace-nowrap">
									Select Seller:
								</span>
								<div className="relative">
									<select
										value={selectedSeller}
										onChange={handleSellerChange}
										disabled={loadingSellers || sellers.length === 0}
										className="min-w-[200px] px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
									>
										<option value="">
											{loadingSellers 
												? "Loading sellers..." 
												: sellers.length === 0 
													? "No sellers available" 
													: "Choose a seller"}
										</option>
										{sellers.map((seller) => (
											<option key={seller.id} value={seller.id}>
												{seller.name || seller.email || `Seller ${seller.id.slice(0, 8)}`}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400" />
								</div>
								{/* <div className="text-xs text-muted-foreground whitespace-nowrap">
									({sellers.length} {sellers.length === 1 ? 'seller' : 'sellers'})
								</div> */}
							</div>
						</div>
                        
                        </div>
					</CardHeader>
					<CardContent className="space-y-4">
						{loadingSellers ? (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
									<span className="text-muted-foreground">Loading sellers...</span>
								</div>
							</div>
						) : !selectedSeller ? (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
									<span className="text-muted-foreground">
										{sellers.length === 0 
											? "No sellers found. Please add sellers first." 
											: "Please select a seller to view SLA data"}
									</span>
								</div>
							</div>
						) : loadingSla ? (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
									<span className="text-muted-foreground">Loading SLA data...</span>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								{/* Summary Stats */}
								<div className="grid grid-cols-2 gap-4">
									<div className="p-4 rounded-lg border bg-blue-50">
										<p className="text-sm font-medium text-blue-600">Total Notifications</p>
										<p className="text-2xl font-bold text-blue-700">
											{slaData?.summary?.total || 0}
										</p>
									</div>
									<div className="p-4 rounded-lg border bg-green-50">
										<p className="text-sm font-medium text-green-600">Pending</p>
										<p className="text-2xl font-bold text-green-700">
											{slaData?.summary?.pending || 0}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="p-4 rounded-lg border bg-red-50">
										<p className="text-sm font-medium text-red-600">Overdue</p>
										<p className="text-2xl font-bold text-red-700">
											{slaData?.summary?.overdue || 0}
										</p>
									</div>
									<div className="p-4 rounded-lg border bg-orange-50">
										<p className="text-sm font-medium text-orange-600">Critical</p>
										<p className="text-2xl font-bold text-orange-700">
											{slaData?.summary?.critical || 0}
										</p>
									</div>
								</div>

								{/* Notifications List */}
								<div className="space-y-2">
									<p className="font-medium text-gray-700">Recent Notifications</p>
									<div className="max-h-64 overflow-y-auto space-y-2">
										{slaData?.notifications?.length > 0 ? (
											slaData.notifications.map((notification: any) => {
												const isHighPriority = notification.priority === "HIGH";
												const isOverdue = notification.isOverdue;
												const badgeColor = isOverdue ? "bg-red-500" : isHighPriority ? "bg-orange-500" : "bg-blue-500";
												const bgColor = isOverdue ? "border-red-200 bg-red-50" : isHighPriority ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50";
												
												return (
													<div key={notification.id} className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor}`}>
														<div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${badgeColor}`} />
														<div className="flex-1 min-w-0">
															<div className="flex items-start justify-between gap-2">
																<div className="flex-1 min-w-0">
																	<p className="font-medium text-gray-800 text-sm">
																		{notification.message}
																	</p>
																	{notification.notes && (
																		<p className="text-xs text-gray-600 mt-1">
																			{notification.notes}
																		</p>
																	)}
																	<div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
																		{notification.order?.customerName && (
																			<span className="truncate">
																				Order: {notification.order.customerName}
																			</span>
																		)}
																		<span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
																			notification.slaIndicator === 'GREEN' ? 'bg-green-100 text-green-700' :
																			notification.slaIndicator === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
																			'bg-red-100 text-red-700'
																		}`}>
																			{notification.slaIndicator}
																		</span>
																		<span className="whitespace-nowrap">
																			{notification.timeRemaining 
																				? `${notification.timeRemaining.toFixed(1)}h remaining` 
																				: 'Time elapsed'}
																		</span>
																	</div>
																</div>
																<div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
																	{new Date(notification.createdAt).toLocaleDateString()}
																</div>
															</div>
														</div>
													</div>
												);
											})
										) : (
											<div className="text-center py-8 text-gray-500">
												<Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
												<p>No notifications found for this seller</p>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				   {/* User List Card */}
				   <UserListCard />
			</div>
		</div>
	);
}
