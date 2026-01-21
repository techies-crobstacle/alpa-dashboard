"use client";
import { Sidebar } from "@/components/shared/sidebar";
import Topbar from "@/components/shared/topbar";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		// Only run on client to verify token exists
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("alpa_token");
			if (!token) {
				// Use router for navigation
				router.replace("/login");
				return;
			}
		}
		setChecking(false);
	}, [router]);

	if (checking) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="relative flex h-screen overflow-hidden bg-background">
			{/* Sidebar */}
			<Sidebar />

			{/* Main Content */}
			<div className="flex-1 overflow-auto">
				<Topbar />
				<main className="p-8 max-w-[calc(100vw-18rem)] mx-auto">
					<div className="min-h-[calc(100vh-8rem)]">{children}</div>
				</main>
			</div>
		</div>
	);
}
