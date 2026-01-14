"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Package, ShoppingCart, UserCheck, AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: string;
	isRead: boolean;
	relatedId?: string;
	relatedType?: string;
	metadata?: Record<string, any>;
	createdAt: string;
	updatedAt: string;
};

type NotificationsResponse = {
	success: boolean;
	notifications: Notification[];
	unreadCount: number;
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
};

const getNotificationIcon = (type: string) => {
	switch (type) {
		case "NEW_ORDER":
			return <ShoppingCart className="h-5 w-5 text-blue-600" />;
		case "ORDER_UPDATE":
			return <Package className="h-5 w-5 text-orange-600" />;
		case "PAYMENT":
			return <DollarSign className="h-5 w-5 text-green-600" />;
		case "USER_ACTION":
			return <UserCheck className="h-5 w-5 text-purple-600" />;
		case "ALERT":
			return <AlertCircle className="h-5 w-5 text-red-600" />;
		default:
			return <Bell className="h-5 w-5 text-gray-600" />;
	}
};

const getNotificationTypeColor = (type: string) => {
	switch (type) {
		case "NEW_ORDER":
			return "bg-blue-100 text-blue-800 border-blue-200";
		case "ORDER_UPDATE":
			return "bg-orange-100 text-orange-800 border-orange-200";
		case "PAYMENT":
			return "bg-green-100 text-green-800 border-green-200";
		case "USER_ACTION":
			return "bg-purple-100 text-purple-800 border-purple-200";
		case "ALERT":
			return "bg-red-100 text-red-800 border-red-200";
		default:
			return "bg-gray-100 text-gray-800 border-gray-200";
	}
};

export default function SettingsNotificationsPage() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
	const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

	useEffect(() => {
		fetchNotifications();
	}, []);

	const fetchNotifications = async () => {
		setLoading(true);
		try {
			const response: NotificationsResponse = await api.get("/api/notifications", {
				headers: {
					Authorization: ""
				}
			});
			setNotifications(response.notifications || []);
			setUnreadCount(response.unreadCount || 0);
			setPagination(response.pagination || { page: 1, limit: 20, total: 0 });
		} catch (error) {
			console.error("Failed to fetch notifications:", error);
			toast.error("Failed to load notifications");
		} finally {
			setLoading(false);
		}
	};

	const markAsRead = async (notificationId: string) => {
		setMarkingAsRead(notificationId);
		try {
			await api.put(`/api/notifications/${notificationId}/read`);
			setNotifications(prev => 
				prev.map(notification => 
					notification.id === notificationId 
						? { ...notification, isRead: true }
						: notification
				)
			);
			setUnreadCount(prev => Math.max(0, prev - 1));
			toast.success("Notification marked as read");
		} catch (error) {
			console.error("Failed to mark notification as read:", error);
			toast.error("Failed to mark as read");
		} finally {
			setMarkingAsRead(null);
		}
	};

	const markAllAsRead = async () => {
		try {
			await api.put("/api/notifications/read-all");
			setNotifications(prev => 
				prev.map(notification => ({ ...notification, isRead: true }))
			);
			setUnreadCount(0);
			toast.success("All notifications marked as read");
		} catch (error) {
			console.error("Failed to mark all as read:", error);
			toast.error("Failed to mark all as read");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium">Notifications</h3>
					<p className="text-sm text-muted-foreground">
						View and manage your notifications.
					</p>
				</div>
				{unreadCount > 0 && (
					<Button variant="outline" onClick={markAllAsRead}>
						Mark all as read ({unreadCount})
					</Button>
				)}
			</div>
			<Separator />
			
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : notifications.length === 0 ? (
				<Card className="text-center py-12">
					<CardContent className="pt-6">
						<Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium mb-2">No notifications</h3>
						<p className="text-muted-foreground">You're all caught up! No new notifications.</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{notifications.map((notification) => (
						<Card 
							key={notification.id} 
							className={`transition-all ${
								!notification.isRead 
									? "border-primary/20 bg-primary/5" 
									: "border-border bg-background"
							}`}
						>
							<CardContent className="p-4">
								<div className="flex items-start gap-4">
									<div className="flex-shrink-0 mt-1">
										{getNotificationIcon(notification.type)}
									</div>
									
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<h4 className="text-sm font-medium">{notification.title}</h4>
													{!notification.isRead && (
														<div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
													)}
												</div>
												<p className="text-sm text-muted-foreground mb-3">
													{notification.message}
												</p>
												
												{/* Metadata Display */}
												{notification.metadata && (
													<div className="flex flex-wrap gap-2 mb-3">
														{notification.metadata.totalAmount && (
															<Badge variant="secondary" className="text-xs">
																${notification.metadata.totalAmount}
															</Badge>
														)}
														{notification.metadata.itemCount && (
															<Badge variant="secondary" className="text-xs">
																{notification.metadata.itemCount} items
															</Badge>
														)}
														{notification.metadata.customerName && (
															<Badge variant="secondary" className="text-xs">
																{notification.metadata.customerName}
															</Badge>
														)}
													</div>
												)}
												
												<div className="flex items-center gap-3 text-xs text-muted-foreground">
													<Badge 
														variant="outline" 
														className={`${getNotificationTypeColor(notification.type)} text-xs`}
													>
														{notification.type.replace("_", " ")}
													</Badge>
													<div className="flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
													</div>
												</div>
											</div>
											
											<div className="flex items-center gap-2">
												{notification.isRead ? (
													<CheckCircle2 className="h-4 w-4 text-green-600" />
												) : (
													<Button
														variant="ghost"
														size="sm"
														disabled={markingAsRead === notification.id}
														onClick={() => markAsRead(notification.id)}
														className="text-xs"
													>
														{markingAsRead === notification.id ? (
															<Loader2 className="h-3 w-3 animate-spin" />
														) : (
															"Mark as read"
														)}
													</Button>
												)}
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					
					{/* Pagination Info */}
					{pagination.total > pagination.limit && (
						<div className="text-center text-sm text-muted-foreground pt-4">
							Showing {notifications.length} of {pagination.total} notifications
						</div>
					)}
				</div>
			)}
		</div>
	);
}
