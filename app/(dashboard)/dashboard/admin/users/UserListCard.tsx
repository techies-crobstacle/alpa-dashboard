"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function UserListCard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? (localStorage.getItem("alpa_token") || localStorage.getItem("auth_token")) : null;
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://alpa-be.onrender.com"}/api/users/all`;
        
        console.log("📍 UserListCard fetching from:", apiUrl);
        console.log("🔍 Token exists:", !!token);
        
        const res = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        });
        
        console.log("📊 UserListCard Response Status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ UserListCard API Error:", errorText);
          throw new Error(`Failed to fetch users: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("✅ UserListCard Data:", data);
        
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch (e: any) {
        console.error("❌ UserListCard Error:", e.message);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Users</CardTitle>
        <p className="text-muted-foreground">Latest 7 users in the system</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <span className="text-muted-foreground">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <span className="text-muted-foreground">No users found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Avatar</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {users.slice(-7).reverse().map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2">
                      <Avatar className="h-10 w-10 border">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name || user.email}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-lg">
                            {user.name ? user.name[0] : user.email[0]}
                          </span>
                        )}
                      </Avatar>
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground truncate max-w-[160px]">{user.name || <span className="italic text-muted-foreground">No Name</span>}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{user.email}</td>
                    <td className="px-4 py-2">
                      <Badge variant={user.role === "ADMIN" ? "destructive" : user.role === "SELLER" ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {user.isVerified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}