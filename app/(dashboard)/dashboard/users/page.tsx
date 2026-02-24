"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { decodeJWT } from "@/lib/jwt";


type User = {
	id: string;
	name: string;
	email: string;
	phone: string;
	role: string;
	isVerified: boolean;
	emailVerified: boolean;
	createdAt: string;
	updatedAt: string;
	profileImage?: string | null;
};


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Use the correct token key as set in login
    const token = typeof window !== "undefined" ? localStorage.getItem("alpa_token") : null;
    console.log("[DEBUG] Token:", token);
    if (!token) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }
    const decoded = decodeJWT(token);
    console.log("[DEBUG] Decoded JWT:", decoded);
    // Accept both 'ADMIN' and 'admin' for role
    if (!decoded || !(decoded.role === "ADMIN" || decoded.role === "admin")) {
      setIsAdmin(false);
      setError("You do not have permission to view this page.");
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    // Show the base URL for debugging
    console.log("[DEBUG] API Base URL:", process.env.NEXT_PUBLIC_API_URL);
    api.get("/api/users/all")
      .then((res) => {
        // If the response is an array, use it directly
        if (Array.isArray(res)) {
          setUsers(res);
        } else if (res && Array.isArray(res.users)) {
          setUsers(res.users);
        } else {
          setUsers([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch users.");
        setLoading(false);	
      });
  }, []);

  if (loading) {
    return <div className="p-8">Loading users...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-red-600">You do not have permission to view this page.</div>;
  }

  // Reset to first page when filters/sort change
  // (handled inline via derived page count below)

  // Filter and search logic
  let filteredUsers = users.filter((user) => {
    // Role filter
    if (roleFilter !== "ALL" && user.role.toUpperCase() !== roleFilter) return false;
    // Search filter (name or email)
    if (search.trim() !== "") {
      const s = search.trim().toLowerCase();
      if (!user.name.toLowerCase().includes(s) && !user.email.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  // Sorting logic
  filteredUsers = filteredUsers.sort((a, b) => {
    let aValue: string | number | boolean | undefined = a[sortBy as keyof User] as string | number | boolean | undefined;
    let bValue: string | number | boolean | undefined = b[sortBy as keyof User] as string | number | boolean | undefined;
    // For string fields, compare case-insensitive
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    // For date, convert to timestamp
    if (sortBy === "createdAt") {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    if (aValue! < bValue!) return sortOrder === "asc" ? -1 : 1;
    if (aValue! > bValue!) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                className="border rounded px-3 py-2 text-sm"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SELLER">Seller</option>
                <option value="CUSTOMER">Customer</option>
              </select>
              
            </div>
            <div>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option value="createdAt">Sort by Created Date</option>
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
              </select>
            </div>
            <div>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value as "asc" | "desc"); setCurrentPage(1); }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => { setRoleFilter("ALL"); setSearch(""); setCurrentPage(1); }}
                type="button"
              >
                Clear Filter
              </Button>
			</div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <span className="text-sm text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.profileImage ? (
                          <AvatarImage src={user.profileImage} alt={user.name} />
                        ) : null}
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isVerified ? "default" : "outline"}
                    >
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => {/* TODO: handle edit user */}}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => {/* TODO: handle delete user */}}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>
                {filteredUsers.length === 0 ? "0" : `${(safePage - 1) * itemsPerPage + 1}–${Math.min(safePage * itemsPerPage, filteredUsers.length)}`} of {filteredUsers.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={safePage === p ? "default" : "outline"}
                      size="sm"
                      className="w-8"
                      onClick={() => handlePageChange(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
