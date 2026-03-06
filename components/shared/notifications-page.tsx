"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Loader2, Bell, Package, ShoppingCart, UserCheck,
	AlertCircle, CheckCircle2, Clock, DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
	id: string;
	title: string;
	message: string;
	type: string;
	isRead: boolean;
	metadata?: Record<string, unknown>;
	createdAt: string;
};

type NotificationsResponse = {
	notifications: Notification[];
	unreadCount: number;
	pagination: { page: number; limit: number; total: number };
};

const getIcon = (type: string) => {
	switch (type) {
		case "NEW_ORDER":     return <ShoppingCart className="h-5 w-5 text-blue-600" />;
		case "ORDER_UPDATE":  return <Package className="h-5 w-5 text-orange-600" />;
		case "PAYMENT":       return <DollarSign className="h-5 w-5 text-green-600" />;
		case "USER_ACTION":   return <UserCheck className="h-5 w-5 text-purple-600" />;
		case "ALERT":         return <AlertCircle className="h-5 w-5 text-red-600" />;
		case "SELLER_APPROVED":        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
		case "PRODUCT_RECOMMENDATION": return <Package className="h-5 w-5 text-indigo-600" />;
		default:              return <Bell className="h-5 w-5 text-muted-foreground" />;
	}
};

const typeColor: Record<string, string> = {
	NEW_ORDER:             "bg-blue-100 text-blue-800 border-blue-200",
	ORDER_UPDATE:          "bg-orange-100 text-orange-800 border-orange-200",
	PAYMENT:               "bg-green-100 text-green-800 border-green-200",
	USER_ACTION:           "bg-purple-100 text-purple-800 border-purple-200",
	ALERT:                 "bg-red-100 text-red-800 border-red-200",
	SELLER_APPROVED:       "bg-green-100 text-green-800 border-green-200",
	PRODUCT_RECOMMENDATION:"bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function NotificationsPage() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
	const [markingId, setMarkingId] = useState<string | null>(null);

	useEffect(() => { fetchNotifications(); }, []);

	const fetchNotifications = async () => {
		setLoading(true);
		try {
			const res: NotificationsResponse = await api.get("/api/notifications");
			setNotifications(res.notifications ?? []);
			setUnreadCount(res.unreadCount ?? 0);
			setPagination(res.pagination ?? { page: 1, limit: 20, total: 0 });
		} catch {
			toast.error("Failed to load notifications");
		} finally {
			setLoading(false);
		}
	};

	const markAsRead = async (id: string) => {
		setMarkingId(id);
		try {
			await api.put(`/api/notifications/${id}/read`);
			setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
			setUnreadCount(prev => Math.max(0, prev - 1));
		} catch {
			toast.error("Failed to mark as read");
		} finally {
			setMarkingId(null);
		}
	};

	const markAllAsRead = async () => {
		try {
			await api.put("/api/notifications/read-all");
			setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
			setUnreadCount(0);
			toast.success("All notifications marked as read");
		} catch {
			toast.error("Failed to mark all as read");
		}
	};

	return (
		<div className="p-6 mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
					</p>
				</div>
				{unreadCount > 0 && (
					<Button variant="outline" size="sm" onClick={markAllAsRead}>
						Mark all as read
					</Button>
				)}
			</div>
			<Separator />

			{/* Body */}
			{loading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : notifications.length === 0 ? (
				<div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
					<Bell className="h-12 w-12 opacity-30" />
					<p className="text-base font-medium">No notifications yet</p>
					<p className="text-sm">We'll let you know when something happens.</p>
				</div>
			) : (
				<div className="space-y-3">
					{notifications.map((n) => (
						<Card
							key={n.id}
							className={`transition-all ${!n.isRead ? "border-primary/25 bg-primary/5" : ""}`}
						>
							<CardContent className="p-4">
								<div className="flex items-start gap-4">
									<div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<p className="text-sm font-medium">{n.title}</p>
													{!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
												</div>
												<p className="text-sm text-muted-foreground mb-3">{n.message}</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Badge variant="outline" className={`text-xs ${typeColor[n.type] ?? "bg-muted text-muted-foreground"}`}>
														{n.type.replace(/_/g, " ")}
													</Badge>
													<div className="flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
													</div>
												</div>
											</div>
											<div className="shrink-0">
												{n.isRead ? (
													<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
												) : (
													<Button
														variant="ghost"
														size="sm"
														className="text-xs h-7"
														disabled={markingId === n.id}
														onClick={() => markAsRead(n.id)}
													>
														{markingId === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark read"}
													</Button>
												)}
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					{pagination.total > pagination.limit && (
						<p className="text-center text-xs text-muted-foreground pt-2">
							Showing {notifications.length} of {pagination.total} notifications
						</p>
					)}
				</div>
			)}
		</div>
	);
}
