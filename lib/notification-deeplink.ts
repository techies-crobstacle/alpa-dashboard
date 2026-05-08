type NotificationLike = {
	type: string;
	relatedId?: string | null;
	relatedType?: string | null;
	metadata?: Record<string, unknown>;
	title?: string;
	message?: string;
};

const normalizeRole = (role: string | null): string | null => {
	if (typeof role !== "string") return null;
	const normalized = role.trim().toUpperCase();
	return normalized.length > 0 ? normalized : null;
};

const getString = (value: unknown): string | null => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const getRelatedId = (n: NotificationLike): string | null => {
	const direct = getString(n.relatedId);
	if (direct) return direct;

	const metadata = n.metadata ?? {};
	const keys = [
		"orderId",
		"refundId",
		"requestId",
		"productId",
		"sellerId",
		"customerId",
		"userId",
		"id",
	];
	for (const key of keys) {
		const value = getString(metadata[key]);
		if (value) return value;
	}

	return null;
};

const getRelatedType = (n: NotificationLike): string | null => {
	const direct = getString(n.relatedType);
	if (direct) return direct;

	const metadata = n.metadata ?? {};
	const candidates = ["relatedType", "entityType", "resourceType", "targetType"];
	for (const key of candidates) {
		const value = getString(metadata[key]);
		if (value) return value;
	}

	return null;
};

const isRefundContext = (n: NotificationLike): boolean => {
	const relatedType = getRelatedType(n);
	if (relatedType && relatedType.toLowerCase().includes("refund")) return true;

	const metadata = n.metadata ?? {};
	const status = getString(metadata.status);
	if (status && status.toUpperCase().includes("REFUND")) return true;

	if (getString(metadata.refundId)) return true;
	if (getString(metadata.refundRequestId)) return true;

	const title = (n.title ?? "").toLowerCase();
	const message = (n.message ?? "").toLowerCase();
	return title.includes("refund") || message.includes("refund");
};

const isAdmin = (role: string | null) => {
	const normalizedRole = normalizeRole(role);
	return normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";
};

const buildOrderLink = (role: string | null, id?: string | null): string => {
	const normalizedRole = normalizeRole(role);
	if (isAdmin(role)) return id ? `/admindashboard/orders?highlight=${id}&tab=all` : "/admindashboard/orders";
	if (normalizedRole === "CUSTOMER") return id ? `/customerdashboard/orders?highlight=${id}` : "/customerdashboard/orders";
	return id ? `/sellerdashboard/orders?highlight=${id}` : "/sellerdashboard/orders";
};

const buildRefundLink = (role: string | null, id?: string | null): string => {
	const normalizedRole = normalizeRole(role);
	if (isAdmin(role)) return id ? `/admindashboard/refund?highlight=${id}` : "/admindashboard/refund";
	if (normalizedRole === "CUSTOMER") return id ? `/customerdashboard/orders?highlight=${id}` : "/customerdashboard/orders";
	return id ? `/sellerdashboard/refund?highlight=${id}` : "/sellerdashboard/refund";
};

const getLinkFromRelatedType = (relatedType: string | null | undefined, role: string | null, id?: string | null): string | null => {
	const normalizedRole = normalizeRole(role);
	const baseType = (relatedType ?? "").toLowerCase();
	const type = baseType.endsWith("s") ? baseType.slice(0, -1) : baseType;
	switch (type) {
		case "order":
			return buildOrderLink(role, id);
		case "refund":
			return buildRefundLink(role, id);
		case "product":
			if (isAdmin(role)) return id ? `/admindashboard/products/${id}` : "/admindashboard/products";
			if (normalizedRole === "SELLER") return id ? `/sellerdashboard/products/${id}` : "/sellerdashboard/products";
			return "/customerdashboard/orders";
		case "category":
			if (isAdmin(role)) return "/admindashboard/categories";
			if (normalizedRole === "SELLER") return "/sellerdashboard/categories";
			return null;
		case "seller":
			if (isAdmin(role)) return id ? `/admindashboard/sellers?highlight=${id}` : "/admindashboard/sellers";
			if (normalizedRole === "SELLER") return "/sellerdashboard/profile";
			return null;
		case "customer":
			if (isAdmin(role)) return id ? `/admindashboard/customers?highlight=${id}` : "/admindashboard/customers";
			if (normalizedRole === "CUSTOMER") return "/customerdashboard/profile";
			return null;
		case "user":
			if (isAdmin(role)) return id ? `/admindashboard/users?highlight=${id}` : "/admindashboard/users";
			return null;
		case "coupon":
			if (isAdmin(role)) return "/admindashboard/coupon";
			if (normalizedRole === "SELLER") return "/sellerdashboard/coupons";
			return null;
		case "shipping":
			if (isAdmin(role)) return "/admindashboard/shipping";
			return buildOrderLink(role, id);
		case "bank_change":
		case "bank":
			if (isAdmin(role)) return `/admindashboard/sellers/bank-change-requests${id ? `?highlight=${id}` : ""}`;
			return "/sellerdashboard/settings/bank-details";
		default:
			return null;
	}
};

export const getNotificationDeepLink = (n: NotificationLike, role: string | null): string | null => {
	const normalizedRole = normalizeRole(role);
	const id = getRelatedId(n);
	const relatedType = getRelatedType(n);
	const type = (n.type ?? "").toUpperCase();

	if (type.includes("REFUND")) {
		return buildRefundLink(role, id);
	}

	switch (type) {
		case "NEW_ORDER":
		case "ORDER_STATUS_CHANGED":
		case "ORDER_CANCELLED":
		case "ORDER_UPDATE":
			if (isAdmin(role) && isRefundContext(n)) return buildRefundLink(role, id);
			return buildOrderLink(role, id);
		case "PRODUCT_STATUS_CHANGED":
		case "LOW_STOCK_ALERT":
			return id ? `/sellerdashboard/products/${id}` : "/sellerdashboard/products";
		case "NEW_PRODUCT_SUBMITTED":
		case "PRODUCT_LOW_STOCK_DEACTIVATED":
			return id ? `/admindashboard/products/${id}` : "/admindashboard/products";
		case "CATEGORY_REQUEST":
		case "CATEGORY_REQUEST_RESUBMITTED":
			if (isAdmin(role)) return "/admindashboard/categories";
			if (normalizedRole === "SELLER") return "/sellerdashboard/categories";
			return null;
		case "SELLER_APPLICATION":
			return isAdmin(role) ? (id ? `/admindashboard/sellers?highlight=${id}` : "/admindashboard/sellers") : null;
		case "SELLER_APPROVED":
			return normalizedRole === "SELLER" ? "/sellerdashboard" : "/admindashboard/sellers";
		case "SELLER_REJECTED":
			return normalizedRole === "SELLER" ? "/sellerdashboard/auth" : "/admindashboard/sellers";
		case "CULTURAL_APPROVAL":
			return normalizedRole === "SELLER" ? "/sellerdashboard/profile" : "/admindashboard/sellers";
		case "PRODUCT_RECOMMENDATION":
			return normalizedRole === "SELLER" ? "/sellerdashboard/products" : "/admindashboard/products";
		case "BANK_CHANGE_REQUESTED":
			return `/admindashboard/sellers/bank-change-requests${id ? `?highlight=${id}` : ""}`;
		case "BANK_CHANGE_APPROVED":
		case "BANK_CHANGE_REJECTED":
			return "/sellerdashboard/settings/bank-details";
		default:
			return getLinkFromRelatedType(relatedType, role, id);
	}
};