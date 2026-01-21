// "use client";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
// 	Activity,
// 	CreditCard,
// 	DollarSign,
// 	Users,
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { api } from "@/lib/api";

// const stats = [
// 	{
// 		title: "Total Revenue",
// 		value: "$45,231.89",
// 		icon: DollarSign,
// 		description: "+20.1% from last month",
// 		trend: "up",
// 		color: "text-emerald-600",
// 		bgColor: "bg-emerald-50",
// 	},
// 	{
// 		title: "Subscriptions",
// 		value: "+2,350",
// 		icon: Users,
// 		description: "+180.1% from last month",
// 		trend: "up",
// 		color: "text-blue-600",
// 		bgColor: "bg-blue-50",
// 	},
// 	{
// 		title: "Sales",
// 		value: "+12,234",
// 		icon: CreditCard,
// 		description: "+19% from last month",
// 		trend: "up",
// 		color: "text-purple-600",
// 		bgColor: "bg-purple-50",
// 	},
// 	{
// 		title: "Active Now",
// 		value: "+573",
// 		icon: Activity,
// 		description: "+201 since last hour",
// 		trend: "up",
// 		color: "text-orange-600",
// 		bgColor: "bg-orange-50",
// 	},
// ];

// 	const router = useRouter();
// 	const [checking, setChecking] = useState(true);
// 	const [userRole, setUserRole] = useState<string | null>(null);
// 	const [slaData, setSlaData] = useState<any>(null);
// 	const [loadingSla, setLoadingSla] = useState(false);
// 	// Track acknowledge loading and status for each notification
// 	const [ackState, setAckState] = useState<Record<string, { loading: boolean; acknowledged: boolean }>>({});

// 	useEffect(() => {
// 		if (typeof window !== "undefined") {
// 			const token = localStorage.getItem("alpa_token") || localStorage.getItem("auth_token");
// 			if (token) {
// 				try {
// 					const payload = JSON.parse(atob(token.split(".")[1]));
// 					setUserRole(payload.role);
// 					// Fetch notifications data
// 					const fetchSlaData = async () => {
// 						setLoadingSla(true);
// 						try {
// 							const response = await api.get("/api/seller/notifications");
// 							setSlaData(response);
// 							// Initialize ackState for notifications
// 							if (response.notifications) {
// 								const ackInit: Record<string, { loading: boolean; acknowledged: boolean }> = {};
// 								response.notifications.forEach((n: any) => {
// 									ackInit[n.id] = { loading: false, acknowledged: !!n.acknowledged };
// 								});
// 								setAckState(ackInit);
// 							}
// 						} catch (error) {
// 							setSlaData({
// 								success: false,
// 								notifications: [],
// 								summary: {
// 									total: 0,
// 									pending: 0,
// 									overdue: 0,
// 									critical: 0
// 								}
// 							});
// 						} finally {
// 							setLoadingSla(false);
// 						}
// 					};
// 					fetchSlaData();
// 				} catch (e) {
// 					console.error("Token decode error:", e);
// 				}
// 			}
// 		}
// 		setChecking(false);
// 	}, [router]);

// 	if (checking) {
// 		return <div className="flex h-screen w-screen items-center justify-center"><span>Loading...</span></div>;
// 	}

// 	return (
// 		<div className="space-y-8">
// 			{/* Header Section */}
// 			<div className="flex flex-col gap-2">
// 				<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
// 				<p className="text-muted-foreground text-lg">
// 					Welcome back! Here&apos;s an overview of your data.
// 				</p>
// 			</div>

// 			{/* Stats Grid */}
// 			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
// 				{stats.map((stat) => {
// 					const Icon = stat.icon;

// 					return (
// 						<Card
// 							key={stat.title}
// 							className="group hover:shadow-lg transition-all duration-200"
// 						>
// 							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
// 								<CardTitle className="text-sm font-medium text-muted-foreground">
// 									{stat.title}
// 								</CardTitle>
// 								<div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
// 									<Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
// 								</div>
// 							</CardHeader>
// 							<CardContent className="pt-0">
// 								<div className="text-3xl font-bold mb-2">{stat.value}</div>
// 								<p className="text-sm text-muted-foreground leading-relaxed">
// 									{stat.description}
// 								</p>
// 							</CardContent>
// 						</Card>
// 					);
// 				})}
// 			</div>

// 			{/* Additional Content Sections */}
// 			<div className="grid gap-6 lg:grid-cols-2">
// 				{/* SLA Dashboard Card */}
// 				<Card>
// 					<CardHeader>
// 						<CardTitle className="text-xl font-semibold">
// 							SLA Dashboard
// 						</CardTitle>
// 						<p className="text-muted-foreground">
// 							Service Level Agreement monitoring
// 						</p>
// 					</CardHeader>
// 					<CardContent className="space-y-4">
// 						{loadingSla ? (
// 							<div className="flex items-center justify-center p-8">
// 								<span className="text-muted-foreground">Loading SLA data...</span>
// 							</div>
// 						) : (
// 							<div className="space-y-4">
// 								<div className="grid grid-cols-2 gap-4">
// 									<div className="p-4 rounded-lg border bg-blue-50">
// 										<p className="text-sm font-medium text-blue-600">Total Notifications</p>
// 										<p className="text-2xl font-bold text-blue-700">
// 											{slaData?.summary?.total || 0}
// 										</p>
// 									</div>
// 									<div className="p-4 rounded-lg border bg-green-50">
// 										<p className="text-sm font-medium text-green-600">Pending</p>
// 										<p className="text-2xl font-bold text-green-700">
// 											{slaData?.summary?.pending || 0}
// 										</p>
// 									</div>
// 								</div>
// 								<div className="grid grid-cols-2 gap-4">
// 									<div className="p-4 rounded-lg border bg-red-50">
// 										<p className="text-sm font-medium text-red-600">Overdue</p>
// 										<p className="text-2xl font-bold text-red-700">
// 											{slaData?.summary?.overdue || 0}
// 										</p>
// 									</div>
// 									<div className="p-4 rounded-lg border bg-orange-50">
// 										<p className="text-sm font-medium text-orange-600">Critical</p>
// 										<p className="text-2xl font-bold text-orange-700">
// 											{slaData?.summary?.critical || 0}
// 										</p>
// 									</div>
// 								</div>
// 								{/* Notifications List */}
// 								<div className="space-y-2">
// 									<p className="font-medium text-gray-700">Notifications</p>
// 									<div className="max-h-64 overflow-y-auto space-y-2">
// 										{slaData?.notifications?.length > 0 ? (
// 											slaData.notifications.map((notification: any) => {
// 												const isHighPriority = notification.priority === "HIGH";
// 												const isOverdue = notification.isOverdue;
// 												const badgeColor = isOverdue ? "bg-red-500" : isHighPriority ? "bg-orange-500" : "bg-blue-500";
// 												const bgColor = isOverdue ? "border-red-200 bg-red-50" : isHighPriority ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50";
// 												const ack = ackState[notification.id] || { loading: false, acknowledged: !!notification.acknowledged };
// 												return (
// 													<div key={notification.id} className={`flex items-start gap-4 p-3 rounded-lg border ${bgColor}`}>
// 														<div className={`w-2 h-2 rounded-full mt-2 ${badgeColor}`} />
// 														<div className="flex-1">
// 															<div className="flex items-start justify-between">
// 																<div className="flex-1">
// 																	<p className="font-medium text-gray-800 text-sm">
// 																		{notification.message}
// 																	</p>
// 																	<p className="text-xs text-gray-600 mt-1">
// 																		{notification.notes}
// 																	</p>
// 																	<div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
// 																		<span>Order: {notification.order?.customerName}</span>
// 																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${
// 																			notification.slaIndicator === 'GREEN' ? 'bg-green-100 text-green-700' :
// 																			notification.slaIndicator === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
// 																			'bg-red-100 text-red-700'
// 																		}`}>
// 																			{notification.slaIndicator}
// 																		</span>
// 																		<span>
// 																			{notification.timeRemaining ? `${notification.timeRemaining.toFixed(1)}h remaining` : 'Time elapsed'}
// 																		</span>
// 																	</div>
// 																</div>
// 																<div className="flex flex-col items-end ml-2 gap-2">
// 																	<span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
// 																	<button
// 																		className={`px-3 py-1 rounded text-xs font-medium border ${ack.acknowledged ? 'bg-green-100 text-green-700 border-green-300 cursor-default' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-60`}
// 																		disabled={ack.loading || ack.acknowledged}
// 																		onClick={async () => {
// 																			setAckState((prev) => ({ ...prev, [notification.id]: { ...ack, loading: true } }));
// 																			try {
// 																				await api.patch(`/api/seller/notifications/${notification.id}/acknowledge`);
// 																				toast.success("Notification acknowledged");
// 																				setAckState((prev) => ({ ...prev, [notification.id]: { loading: false, acknowledged: true } }));
// 																			} catch {
// 																				toast.error("Failed to acknowledge notification");
// 																				setAckState((prev) => ({ ...prev, [notification.id]: { ...ack, loading: false } }));
// 																			}
// 																		}}
// 																	>
// 																		{ack.loading ? 'Acknowledging...' : ack.acknowledged ? 'Acknowledged' : 'Acknowledge'}
// 																	</button>
// 																</div>
// 															</div>
// 														</div>
// 													</div>
// 												);
// 											})
// 										) : (
// 											<div className="text-center py-8 text-gray-500">
// 												<p>No notifications found</p>
// 											</div>
// 										)}
// 									</div>
// 								</div>
// 							</div>
// 						)}
// 					</CardContent>
// 				</Card>

// 				{/* Quick Actions Card */}
// 				<Card>
// 					<CardHeader>
// 						<CardTitle className="text-xl font-semibold">
// 							Quick Actions
// 						</CardTitle>
// 						<p className="text-muted-foreground">Commonly used features</p>
// 					</CardHeader>
// 					<CardContent className="space-y-4">
// 						<div className="grid grid-cols-2 gap-4">
// 							<button
// 								type="button"
// 								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
// 							>
// 								<Users className="h-6 w-6" />
// 								<span className="text-sm font-medium">Add User</span>
// 							</button>
// 							<button
// 								type="button"
// 								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
// 							>
// 								<CreditCard className="h-6 w-6" />
// 								<span className="text-sm font-medium">New Sale</span>
// 							</button>
// 							<button
// 								type="button"
// 								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
// 							>
// 								<Activity className="h-6 w-6" />
// 								<span className="text-sm font-medium">Reports</span>
// 							</button>
// 							<button
// 								type="button"
// 								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
// 							>
// 								<DollarSign className="h-6 w-6" />
// 								<span className="text-sm font-medium">Analytics</span>
// 							</button>
// 						</div>
// 					</CardContent>
// 				</Card>
// 			</div>
// 		</div>	

// );
// }


"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Activity,
	CreditCard,
	DollarSign,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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
	{
		title: "Subscriptions",
		value: "+2,350",
		icon: Users,
		description: "+180.1% from last month",
		trend: "up",
		color: "text-blue-600",
		bgColor: "bg-blue-50",
	},
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

export default function DashboardPage() {
	const router = useRouter();
	const [checking, setChecking] = useState(true);
	const [userRole, setUserRole] = useState<string | null>(null);
	const [slaData, setSlaData] = useState<any>(null);
	const [loadingSla, setLoadingSla] = useState(false);
	// Track acknowledge loading and status for each notification
	const [ackState, setAckState] = useState<Record<string, { loading: boolean; acknowledged: boolean }>>({});

	useEffect(() => {
		const checkAuth = async () => {
			if (typeof window === "undefined") {
				setChecking(false);
				return;
			}

			const token = localStorage.getItem("alpa_token");

			if (!token) {
				console.log("No token found, redirecting to login");
				toast.error("Please login to continue");
				setChecking(false);
				setTimeout(() => router.push("/login"), 300);
				return;
			}

			try {
				// Validate token format
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
					toast.error("Session expired. Please login again.");
					setChecking(false);
					setTimeout(() => router.push("/login"), 300);
					return;
				}

				// Check user role - be flexible with case
				const userRole = payload.role?.toLowerCase()?.trim();
				console.log(`User role from token: "${userRole}"`);

				setUserRole(payload.role);

				// Allow seller and admin to view seller dashboard
				const isSeller = userRole?.includes("seller");
				const isAdmin = userRole?.includes("admin");

				if (isSeller || isAdmin) {
					console.log(`User is ${isAdmin ? 'admin' : 'seller'}, loading dashboard`);
					// Fetch notifications data
					setLoadingSla(true);
					try {
						const response = await api.get("/api/seller/notifications");
						setSlaData(response);
						// Initialize ackState for notifications
						if (response.notifications) {
							const ackInit: Record<string, { loading: boolean; acknowledged: boolean }> = {};
							response.notifications.forEach((n: any) => {
								ackInit[n.id] = { loading: false, acknowledged: !!n.acknowledged };
							});
							setAckState(ackInit);
						}
					} catch (error: any) {
						console.error("Error loading notifications:", error);
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
				} else {
					console.error(`Access denied: user role is "${userRole}"`);
					toast.error(`Unauthorized - Your role is: ${payload.role}. Seller or admin access required.`);
					setChecking(false);
					setTimeout(() => router.push("/dashboard/customer/profile"), 300);
					return;
				}

				setChecking(false);
			} catch (e) {
				console.error("Token validation error:", e);
				localStorage.removeItem("alpa_token");
				toast.error("Invalid session. Please login again.");
				setChecking(false);
				setTimeout(() => router.push("/login"), 300);
			}
		};

		checkAuth();
	}, [router]);

	if (checking) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<span>Loading...</span>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-8">
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
						<CardTitle className="text-xl font-semibold">
							SLA Dashboard
						</CardTitle>
						<p className="text-muted-foreground">
							Service Level Agreement monitoring
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{loadingSla ? (
							<div className="flex items-center justify-center p-8">
								<span className="text-muted-foreground">Loading SLA data...</span>
							</div>
						) : (
							<div className="space-y-4">
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
									<p className="font-medium text-gray-700">Notifications</p>
									<div className="max-h-64 overflow-y-auto space-y-2">
										{slaData?.notifications?.length > 0 ? (
											slaData.notifications.map((notification: any) => {
												const isHighPriority = notification.priority === "HIGH";
												const isOverdue = notification.isOverdue;
												const badgeColor = isOverdue ? "bg-red-500" : isHighPriority ? "bg-orange-500" : "bg-blue-500";
												const bgColor = isOverdue ? "border-red-200 bg-red-50" : isHighPriority ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50";
												const ack = ackState[notification.id] || { loading: false, acknowledged: !!notification.acknowledged };
												return (
													<div key={notification.id} className={`flex items-start gap-4 p-3 rounded-lg border ${bgColor}`}>
														<div className={`w-2 h-2 rounded-full mt-2 ${badgeColor}`} />
														<div className="flex-1">
															<div className="flex items-start justify-between">
																<div className="flex-1">
																	<p className="font-medium text-gray-800 text-sm">
																		{notification.message}
																	</p>
																	<p className="text-xs text-gray-600 mt-1">
																		{notification.notes}
																	</p>
																	<div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
																		<span>Order: {notification.order?.customerName}</span>
																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${
																			notification.slaIndicator === 'GREEN' ? 'bg-green-100 text-green-700' :
																			notification.slaIndicator === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
																			'bg-red-100 text-red-700'
																		}`}>
																			{notification.slaIndicator}
																		</span>
																		<span>
																			{notification.timeRemaining ? `${notification.timeRemaining.toFixed(1)}h remaining` : 'Time elapsed'}
																		</span>
																	</div>
																</div>
																<div className="flex flex-col items-end ml-2 gap-2">
																	<span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
																	<button
																		className={`px-3 py-1 rounded text-xs font-medium border ${ack.acknowledged ? 'bg-green-100 text-green-700 border-green-300 cursor-default' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-60`}
																		disabled={ack.loading || ack.acknowledged}
																		onClick={async () => {
																			setAckState((prev) => ({ ...prev, [notification.id]: { ...ack, loading: true } }));
																			try {
																				await api.patch(`/api/seller/notifications/${notification.id}/acknowledge`);
																				toast.success("Notification acknowledged");
																				setAckState((prev) => ({ ...prev, [notification.id]: { loading: false, acknowledged: true } }));
																			} catch {
																				toast.error("Failed to acknowledge notification");
																				setAckState((prev) => ({ ...prev, [notification.id]: { ...ack, loading: false } }));
																			}
																		}}
																	>
																		{ack.loading ? 'Acknowledging...' : ack.acknowledged ? 'Acknowledged' : 'Acknowledge'}
																	</button>
																</div>
															</div>
														</div>
													</div>
												);
											})
										) : (
											<div className="text-center py-8 text-gray-500">
												<p>No notifications found</p>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Quick Actions
						</CardTitle>
						<p className="text-muted-foreground">Commonly used features</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
							>
								<Users className="h-6 w-6" />
								<span className="text-sm font-medium">Add User</span>
							</button>
							<button
								type="button"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
							>
								<CreditCard className="h-6 w-6" />
								<span className="text-sm font-medium">New Sale</span>
							</button>
							<button
								type="button"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
							>
								<Activity className="h-6 w-6" />
								<span className="text-sm font-medium">Reports</span>
							</button>
							<button
								type="button"
								className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
							>
								<DollarSign className="h-6 w-6" />
								<span className="text-sm font-medium">Analytics</span>
							</button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>	
	);
}