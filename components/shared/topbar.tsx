"use client";
import Link from "next/link";
import { Bell, Search, ShoppingCart, Package, DollarSign, UserCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/jwt";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSwitcher } from "./app-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

type Notification = {
	id: string;
	title: string;
	message: string;
	type: string;
	isRead: boolean;
	createdAt: string;
	metadata?: Record<string, any>;
};

const getNotificationIcon = (type: string) => {
	switch (type) {
		case "NEW_ORDER":
			return <ShoppingCart className="h-4 w-4 text-blue-600" />;
		case "ORDER_UPDATE":
			return <Package className="h-4 w-4 text-orange-600" />;
		case "PAYMENT":
			return <DollarSign className="h-4 w-4 text-green-600" />;
		case "USER_ACTION":
			return <UserCheck className="h-4 w-4 text-purple-600" />;
		case "ALERT":
			return <AlertCircle className="h-4 w-4 text-red-600" />;
		default:
			return <Bell className="h-4 w-4 text-gray-600" />;
	}
};

	export default function Topbar() {
		const [user, setUser] = useState<{ name: string; email: string; profileImage?: string } | null>(null);
		const [isLoading, setIsLoading] = useState(true);
		const [notifications, setNotifications] = useState<Notification[]>([]);
		const [unreadCount, setUnreadCount] = useState(0);
		const [notificationsLoading, setNotificationsLoading] = useState(false);
		const router = useRouter();

		// Fetch notifications from API
		const fetchNotifications = async () => {
			try {
				setNotificationsLoading(true);
				const response = await api.get('/api/notifications?limit=4', {
					headers: {
						Authorization: ""
					}
				});
				setNotifications(response.notifications || []);
				setUnreadCount(response.unreadCount || 0);
			} catch (error) {
				console.error('Failed to fetch notifications:', error);
				// Set fallback data on error
				setNotifications([]);
				setUnreadCount(0);
			} finally {
				setNotificationsLoading(false);
			}
		};

		// Fetch profile data from API
		const fetchProfileData = async () => {
			try {
				setIsLoading(true);
				const data = await api.get('/api/profile', {
					headers: {
						Authorization: ""
					}
				});
				console.log('Profile API Response:', data); // Debug log
				
				const profile = data.profile || data;
				
				// Try different common field names for profile image
				const profileImageUrl = profile.profileImage || profile.profile_image || profile.avatar || profile.picture || profile.image || '';
				
				setUser({
					name: profile.name || 'Unknown User',
					email: profile.email || '',
					profileImage: profileImageUrl,
				});
			} catch (error) {
				console.error('Failed to fetch profile:', error);
				
				// Fallback to JWT data if API fails
				const token = localStorage.getItem("alpa_token");
				const decoded = token ? decodeJWT(token) : null;
				let name = "Unknown";
				let email = "";
				
				type Decoded = { name?: string; email?: string };
				const safeDecoded: Decoded = (decoded && typeof decoded === 'object') ? decoded as Decoded : {};
				
				if (typeof safeDecoded.name === 'string' && safeDecoded.name.trim() !== "") {
					name = safeDecoded.name;
				} else if (typeof safeDecoded.email === 'string') {
					name = safeDecoded.email;
				}
				
				if (typeof safeDecoded.email === 'string') {
					email = safeDecoded.email;
				}
				
				setUser({ name, email });
			} finally {
				setIsLoading(false);
			}
		};

		useEffect(() => {
			if (typeof window !== "undefined") {
				fetchProfileData();
				fetchNotifications();
			}
		}, []);

		// Silently loads a hidden iframe on the Website so it can clear its own session.
		// Resolves when the Website posts "alpa-logout-done" or after a 2-second timeout.
		const triggerCrossDomainLogout = (iframeUrl: string): Promise<void> => {
			return new Promise((resolve) => {
				const iframe = document.createElement("iframe");
				iframe.src = iframeUrl;
				iframe.style.cssText = "display:none;width:0;height:0;border:none;position:absolute;";
				document.body.appendChild(iframe);

				const timer = setTimeout(() => {
					window.removeEventListener("message", handler);
					if (document.body.contains(iframe)) document.body.removeChild(iframe);
					resolve();
				}, 2000);

				function handler(e: MessageEvent) {
					if (
						e.origin === "https://apla-fe.vercel.app" &&
						e.data === "alpa-logout-done"
					) {
						clearTimeout(timer);
						window.removeEventListener("message", handler);
						if (document.body.contains(iframe)) document.body.removeChild(iframe);
						resolve();
					}
				}
				window.addEventListener("message", handler);
			});
		};

		const handleLogout = async () => {
			if (typeof window !== "undefined") {
				// 1. Invalidate the server-side session
				const token =
					localStorage.getItem("alpa_token") ||
					localStorage.getItem("auth_token");
				try {
					await fetch(
						`${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com"}/api/auth/logout`,
						{
							method: "POST",
							credentials: "include",
							headers: {
								"Content-Type": "application/json",
								...(token ? { Authorization: `Bearer ${token}` } : {}),
							},
						}
					);
				} catch (_) {
					// Best-effort — always continue to clear local state
				}

				// 2. Silently clear the Webapp session via hidden iframe
				await triggerCrossDomainLogout("https://apla-fe.vercel.app/logout-callback");

				// 3. Clear Dashboard localStorage
				localStorage.removeItem("alpa_token");
				localStorage.removeItem("auth_token");
				localStorage.removeItem("user_data");
				localStorage.removeItem("user");

				// 4. Clear cookies
				document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
				document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
				document.cookie = "alpa_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

				// 5. Redirect to the Webapp
				window.location.href = "https://apla-fe.vercel.app/";
			}
		};

		return (
			<div className="flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				{/* Search */}
				<div className="flex items-center max-w-2xl flex-1">
					<div className="relative w-full max-w-lg">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search anything..."
							className="pl-10 pr-4 py-2 h-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
						/>
					</div>
				</div>

				{/* Right Section */}
				<div className="flex items-center gap-3">
					{/* App Switcher */}
					{/* <AppSwitcher /> */}

					{/* Theme Toggle */}
					<ThemeToggle />

					{/* Notifications Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="relative h-9 w-9 hover:bg-muted transition-colors"
								aria-label="Notifications"
							>
								<Bell className="h-4 w-4" />
								{unreadCount > 0 && (
									<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
										{unreadCount > 99 ? '99+' : unreadCount}
									</span>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-80 p-2" align="end" forceMount>
							<DropdownMenuLabel className="font-semibold p-3 flex items-center justify-between">
								<span>Notifications</span>
								{unreadCount > 0 && (
									<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
										{unreadCount} new
									</span>
								)}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							
							{notificationsLoading ? (
								<div className="p-4 text-center text-sm text-muted-foreground">
									Loading notifications...
								</div>
							) : notifications.length === 0 ? (
								<div className="p-4 text-center text-sm text-muted-foreground">
									<Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
									No new notifications
								</div>
							) : (
								<>
									{notifications.map((notification) => (
										<DropdownMenuItem 
											key={notification.id} 
											className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors"
										>
											<div className="flex items-start gap-3">
												<div className="flex-shrink-0 mt-0.5">
													{getNotificationIcon(notification.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="font-medium text-sm line-clamp-1">
															{notification.title}
														</span>
														{!notification.isRead && (
															<span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
														)}
													</div>
													<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
														{notification.message}
													</p>
													<div className="flex items-center justify-between mt-2">
														<span className="text-xs text-muted-foreground">
															{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
														</span>
														{notification.metadata?.totalAmount && (
															<span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
																${notification.metadata.totalAmount}
															</span>
														)}
													</div>
												</div>
											</div>
										</DropdownMenuItem>
									))}
								</>
							)}
							
							<DropdownMenuSeparator />
							<DropdownMenuItem className="p-3 cursor-pointer text-primary hover:bg-muted rounded-md transition-colors">
								<Link href="/dashboard/settings/notifications"><span className="flex items-center gap-2">View all notifications</span></Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Profile */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors"
								disabled={isLoading}
							>
								<Avatar className="h-8 w-8 ring-2 ring-background">
									<AvatarImage src={user?.profileImage || "/avatar.png"} alt={user?.name || "User"} />
									<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
										{isLoading ? "..." : (user?.name ? user.name.split(" ").map(n => n[0]).join("") : "UN")}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64 p-2" align="end" forceMount>
							<DropdownMenuLabel className="font-normal p-3">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src={user?.profileImage || "/avatar.png"} alt={user?.name || "User"} />
										<AvatarFallback className="bg-primary text-primary-foreground">
											{isLoading ? "..." : (user?.name ? user.name.split(" ").map(n => n[0]).join("") : "UN")}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">
											{isLoading ? "Loading..." : (user?.name || "Unknown")}
										</p>
										<p className="text-xs leading-none text-muted-foreground">
											{isLoading ? "..." : (user?.email || "")}
										</p>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator className="my-2" />
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
									<span>👤 Profile</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
									<span>⚙️ Settings</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<span className="flex items-center gap-2">💳 Billing</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="my-2" />
							<DropdownMenuItem
								className="p-3 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
								onClick={handleLogout}
							>
								<span className="flex items-center gap-2">🚪 Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}
// ...existing code ends here

// (Removed duplicate Topbar function declaration)
