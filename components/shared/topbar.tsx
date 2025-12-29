"use client";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJWT } from "@/lib/jwt";
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
		const [user, setUser] = useState<{ name: string; email: string } | null>(null);
		const router = useRouter();

		useEffect(() => {
			if (typeof window !== "undefined") {
				const token = localStorage.getItem("alpa_token");
				const decoded = token ? decodeJWT(token) : null;
				setUser({
					name: decoded?.name && decoded.name.trim() !== "" ? decoded.name : (decoded?.email || "Unknown"),
					email: decoded?.email || "",
				});
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

					{/* Notifications */}
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

					{/* Profile */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors"
							>
								<Avatar className="h-8 w-8 ring-2 ring-background">
									<AvatarImage src="/avatar.png" alt={user?.name || "User"} />
									<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
										{user?.name ? user.name.split(" ").map(n => n[0]).join("") : "UN"}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64 p-2" align="end" forceMount>
							<DropdownMenuLabel className="font-normal p-3">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src="/avatar.png" alt={user?.name || "User"} />
										<AvatarFallback className="bg-primary text-primary-foreground">
											{user?.name ? user.name.split(" ").map(n => n[0]).join("") : "UN"}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{user?.name || "Unknown"}</p>
										<p className="text-xs leading-none text-muted-foreground">
											{user?.email || ""}
										</p>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator className="my-2" />
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<span className="flex items-center gap-2">👤 Profile</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
								<span className="flex items-center gap-2">⚙️ Settings</span>
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
