"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { decodeJWT } from "@/lib/jwt";
import { Button } from "@/components/ui/button";

export function WelcomeBanner() {
	const [visible, setVisible] = useState(false);
	const [userName, setUserName] = useState("Seller");
	const [productCount, setProductCount] = useState<number | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;

		// Only show this banner for seller accounts
		const token = localStorage.getItem("alpa_token");
		if (!token) return;
		const decoded = decodeJWT(token);
		type D = { role?: string; userType?: string; type?: string };
		const d = decoded as D | null;
		const role = (d?.role || d?.userType || d?.type || "").toLowerCase();
		// If the user is not a seller, skip the banner entirely
		if (role && role !== "seller") return;

		// Resolve user name: profile API → JWT fallback
		const resolveName = async () => {
			try {
				const data = await api.get("/api/profile", { headers: { Authorization: "" } });
				const profile = data?.profile ?? data;
				const name: string =
					profile?.name ||
					profile?.firstName ||
					profile?.username ||
					"";
				if (name) setUserName(name.split(" ")[0]);
			} catch {
				// Fallback to already-decoded JWT data
				type Full = { name?: string; firstName?: string; email?: string };
				const fd = decoded as Full | null;
				const fallback = fd?.name || fd?.firstName || fd?.email || "";
				if (fallback) setUserName(fallback.split(" ")[0].split("@")[0]);
			}
		};

		// Fetch product count — use a local variable to avoid stale closure
		const resolveProductCount = async (): Promise<number | null> => {
			try {
				const data = await api.get("/api/products/my-products", { headers: { Authorization: "" } });
				const count: number | null =
					(Array.isArray(data) ? data.length : null) ??
					(Array.isArray(data?.products) ? data.products.length : null) ??
					data?.total ??
					data?.count ??
					data?.pagination?.total ??
					null;
				return count;
			} catch {
				return null;
			}
		};

		Promise.all([resolveName(), resolveProductCount()]).then(([, count]) => {
			setProductCount(count);
			// Only show when count is known and below the recommended threshold
			if (count !== null && count < 5) {
				setVisible(true);
			}
		});
	}, []);

	if (!visible) return null;

	return (
		<div className="mx-6 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
			{/* Icon */}
			<div className="flex-shrink-0 mt-0.5 rounded-lg bg-primary/10 p-2">
				<Sparkles className="h-5 w-5 text-primary" />
			</div>

			{/* Text */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-foreground">
					Welcome back, {userName}! 👋
				</p>
				<p className="mt-0.5 text-sm text-muted-foreground">
					You currently have{" "}
					<span className="font-medium text-foreground">
						{productCount} {productCount === 1 ? "product" : "products"}
					</span>{" "}
					listed. We recommend adding at least{" "}
					<span className="font-medium text-primary">5 products</span> to your
					store to start receiving orders and improve your visibility.
				</p>

				<div className="mt-3">
					<a href="/dashboard/products">
						<Button size="sm" variant="default" className="gap-1.5 h-8 text-xs">
							<PackagePlus className="h-3.5 w-3.5" />
							Add Products
						</Button>
					</a>
				</div>
			</div>
		</div>
	);
}

