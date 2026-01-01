"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { decodeJWT } from "@/lib/jwt";
import {
	LayoutDashboard,
	Settings,
	Users,
	BarChart3,
	FolderKanban,
	ChevronLeft,
	ChevronRight,
	
	Database,
	
	LogIn,
	AlertCircle,
	ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const baseSidebarGroups = [
	{
		title: "General",
		items: [
			{
				title: "Dashboard",
				href: "/dashboard",
				icon: LayoutDashboard,
				badge: null,
			},
			{
				title: "Analytics",
				href: "/dashboard/analytics",
				icon: BarChart3,
				badge: "New",
			},
			{
				title: "Settings",
				href: "/dashboard/settings",
				icon: Settings,
				badge: null,
			},
		],
	},
	{
		title: "Pages",
		items: [
			{
				title: "Report",
				href: "/dashboard/report",
				icon: Users,
				badge: "12",
			},
			{
				title: "Users",
				href: "/dashboard/users",
				icon: Users,
				badge: "12",
			},
			{
				title: "Sellers",
				href: "/dashboard/admin/sellers",
				icon: Users,
				badge: "12",
			},
			{
				title: "Products",
				href: "/dashboard/projects",
				icon: FolderKanban,
				badge: null,
			},
			{
				title: "Products",
				href: "/dashboard/admin/products",
				icon: FolderKanban,
				badge: null,
			},
			{
				title: "Categories",
				href: "/dashboard/admin/categories",
				icon: FolderKanban,
				badge: null,
			},
			{
				title: "Coupons",
				href: "/dashboard/admin/coupon",
				icon: FolderKanban,
				badge: null,
			},
			
			{
				title: "Orders",
				href: "/dashboard/orders",
				icon: ListOrdered,
				badge: "3",
			},
			{
				title: "Orders",
				href: "/dashboard/admin/orders",
				icon: ListOrdered,
				badge: "3",
			},
			{
				title: "Invoices",
				href: "/dashboard/invoice",
				icon: ListOrdered,
				badge: "4",
			},
			{
				title: "Auth Pages",
				href: "/dashboard/auth",
				icon: LogIn,
				badge: null,
			},
			{
				title: "Profile",
				href: "/dashboard/customer/profile",
				icon: ListOrdered,
				badge: null,
			},
			{
				title: "My Orders",
				href: "/dashboard/customer/orders",
				icon: ListOrdered,
				badge: null,
			},

			// {
			// 	title: "Error Pages",
			// 	href: "/dashboard/errors",
			// 	icon: AlertCircle,
			// 	badge: null,
			// },
		],
	},
	{
		title: "Others",
		items: [
			// {
			// 	title: "Messages",
			// 	href: "/dashboard/messages",
			// 	icon: MessageSquare,
			// 	badge: "5",
			// },
			// {
			// 	title: "Database",
			// 	href: "/dashboard/database",
			// 	icon: Database,
			// 	badge: null,
			// },
			// {
			// 	title: "Security",
			// 	href: "/dashboard/security",
			// 	icon: Shield,
			// 	badge: "!",
			// },
			// {
			// 	title: "Help",
			// 	href: "/dashboard/help",
			// 	icon: HelpCircle,
			// 	badge: null,
			// },
		],
	},

	{
		title: "Role",
		items: [
			{
				// The title will be set dynamically in the component based on the user's role
				title: "",
				href: "/dashboard/role",
				icon: Users,
				badge: null,
			},
		],
	},
];

interface SidebarProps {
	onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [role, setRole] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("alpa_token");
			const decoded = token ? decodeJWT(token) : null;
			setRole(typeof decoded?.role === 'string' ? decoded.role : null);
		}
	}, []);

	const handleLinkClick = () => {
		if (onMobileClose) {
			onMobileClose();
		}
	};

	// Filter sidebar groups/items based on role
	const sidebarGroups = baseSidebarGroups.map((group) => {
		// Deep copy to avoid mutating base
		let filteredItems = group.items.filter((item) => {
			// Admin-only pages
			if (["/dashboard/users", "/dashboard/errors", "/dashboard/admin/products","/dashboard/admin/orders", "/dashboard/admin/sellers", "/dashboard/auth", "/dashboard/admin/coupon", "/dashboard/admin/categories" ].includes(item.href)) {
				return role === "ADMIN";
			}
			// Seller and customer can see /dashboard/orders
			// if (["/dashboard/orders"].includes(item.href)) {
			// 	return role === "SELLER" || role === "CUSTOMER";
			// }
			// Seller-only pages
			if (["/dashboard/projects", "/dashboard/orders"].includes(item.href)) {
				return role === "SELLER";
			}
			// Customer-only pages
			if (["/dashboard/customer/orders", "/dashboard/customer/profile", "/dashboard/settings"].includes(item.href)) {
				return role === "CUSTOMER";
			}
			// Role page: visible to all roles
			if (["/dashboard/role"].includes(item.href)) {
				return true;
			}
			// Users, Analytics, Settings, Dashboard: visible to admin and seller
			if ([ "/dashboard/analytics", "/dashboard/settings", "/dashboard", "/dashboard/invoice","/dashboard/report"].includes(item.href)) {
				return role === "ADMIN" || role === "SELLER";
			}
			// Default: visible to all
			return true;
		});
		// If this is the Role group, set the title to the user's role
		if (group.title === "Role" && filteredItems.length > 0) {
			filteredItems = filteredItems.map((item) => ({
				...item,
				title: role ? `Role: ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}` : "Role: Unknown",
			}));
		}
		return { ...group, items: filteredItems };
	});

	return (
		<div
			className={cn(
				"flex h-full flex-col border-r bg-card shadow-sm transition-all duration-300",
				isCollapsed ? "w-16" : "w-72",
			)}
		>
			{/* Logo */}
			<div className="flex h-16 items-center border-b px-6 justify-between">
				{!isCollapsed && (
					<Link href="/dashboard" className="flex items-center py-4 gap-3 group">
						<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
							<LayoutDashboard className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold group-hover:text-primary transition-colors">
							Dashboard
						</span>
					</Link>
				)}
				{isCollapsed && (
					<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
						<LayoutDashboard className="w-4 h-4 text-primary-foreground" />
					</div>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-muted"
					onClick={() => setIsCollapsed(!isCollapsed)}
				>
					{isCollapsed ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</Button>
			</div>


			{/* Navigation Groups (Scrollable) */}
			<nav className="flex-1 space-y-8 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
				{sidebarGroups.map((group) =>
					group.items.length > 0 ? (
						<div key={group.title} className="space-y-3">
							{/* Group Title */}
							{!isCollapsed && (
								<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
									{group.title}
								</h3>
							)}

							{/* Group Items */}
							<div className="space-y-2">
								{group.items.map((item) => {
									const isActive = pathname === item.href;
									const Icon = item.icon;

									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={handleLinkClick}
											className={cn(
												"group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-muted",
												isActive
													? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
													: "text-muted-foreground hover:text-foreground",
												isCollapsed && "justify-center px-3 py-4",
											)}
											title={isCollapsed ? item.title : undefined}
										>
											<Icon
												className={cn(
													"transition-all duration-200",
													isCollapsed ? "h-5 w-5" : "h-4 w-4",
													isActive && !isCollapsed && "text-primary-foreground",
												)}
											/>
											{!isCollapsed && (
												<span className="group-hover:translate-x-0.5 transition-transform duration-200">
													{item.title}
												</span>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					) : null
				)}
			</nav>

			{/* Role Indicator at Bottom */}
			<div className="border-t p-4 mt-auto flex items-center justify-center">
				<span className="text-xs text-muted-foreground">
					{role ? `Role: ${role.charAt(0).toUpperCase() + role.slice(1)}` : "Role: Unknown"}
				</span>
			</div>
		</div>
	);
}
