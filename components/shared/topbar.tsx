"use client";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/jwt";
import { api } from "@/lib/api";
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


	export default function Topbar() {
		const [user, setUser] = useState<{ name: string; email: string; profileImage?: string } | null>(null);
		const [isLoading, setIsLoading] = useState(true);
		const router = useRouter();

		// Fetch profile data from API
		const fetchProfileData = async () => {
			try {
				setIsLoading(true);
				const data = await api.get('/api/profile');
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
			}
		}, []);

		const handleLogout = () => {
			if (typeof window !== "undefined") {
				localStorage.removeItem("alpa_token");
				// Remove the cookie by setting it expired
				document.cookie = "alpa_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
				router.push("/login");
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
					<AppSwitcher />

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
								<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
									3
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-80 p-2" align="end" forceMount>
							<DropdownMenuLabel className="font-semibold p-3">Notifications</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* Example notifications, replace with dynamic data */}
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<div className="flex items-center gap-2">
									<span className="inline-block w-2 h-2 rounded-full bg-primary" />
									<span className="font-medium">Order #1234 shipped</span>
									<span className="ml-auto text-xs text-muted-foreground">2m ago</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<div className="flex items-center gap-2">
									<span className="inline-block w-2 h-2 rounded-full bg-secondary" />
									<span className="font-medium">New message from support</span>
									<span className="ml-auto text-xs text-muted-foreground">10m ago</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<div className="flex items-center gap-2">
									<span className="inline-block w-2 h-2 rounded-full bg-destructive" />
									<span className="font-medium">Payment failed</span>
									<span className="ml-auto text-xs text-muted-foreground">1h ago</span>
								</div>
							</DropdownMenuItem>
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
