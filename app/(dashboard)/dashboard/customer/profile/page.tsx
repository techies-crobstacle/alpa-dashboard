
"use client";
import { useState ,useEffect } from "react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";


const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/api/profile`)
      .then((data) => {
        setProfile(data.profile || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile");
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <Avatar className="size-16">
            <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">
              {loading ? <span className="animate-pulse bg-muted rounded w-32 h-6 inline-block" /> : profile?.name || "User"}
            </CardTitle>
            <div className="text-muted-foreground">
              {loading ? <span className="animate-pulse bg-muted rounded w-40 h-4 inline-block" /> : profile?.email || "user@example.com"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          {error && <div className="text-destructive">{error}</div>}
          {!loading && profile && (
            <div className="space-y-2">
              <div><span className="font-semibold">Email:</span> {profile.email}</div>
              {profile.phone && <div><span className="font-semibold">Phone:</span> {profile.phone}</div>}
              <div><span className="font-semibold">Role:</span> {profile.role}</div>
              <div><span className="font-semibold">Verified:</span> {profile.isVerified ? "Yes" : "No"}</div>
              <div><span className="font-semibold">Email Verified:</span> {profile.emailVerified ? "Yes" : "No"}</div>
              <div><span className="font-semibold">Created At:</span> {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}</div>
              <div><span className="font-semibold">Updated At:</span> {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "-"}</div>
            </div>
          )}
          <div className="pt-4">
            <Button variant="outline" disabled>Edit Profile</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
