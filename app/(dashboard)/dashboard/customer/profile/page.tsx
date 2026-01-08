"use client";
import { useState ,useEffect } from "react";
import Link from "next/link";
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
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg border-0 bg-background/80">
        <CardHeader className="flex flex-col items-center gap-4 border-b-0 pb-0">
          <div className="relative">
            <Avatar className="size-16 ring-2 ring-primary/20 shadow-md overflow-hidden">
              {profile?.profileImage ? (
                <img 
                  src={profile.profileImage} 
                  alt={profile?.name || 'Profile'} 
                  className="w-20 h-20 object-cover rounded-full" 
                  style={{ maxWidth: '5rem', maxHeight: '5rem', minWidth: '5rem', minHeight: '5rem' }}
                />
              ) : (
                <AvatarFallback className="text-xl">{profile?.name?.[0] || 'U'}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-bold text-center mt-1">
            {loading ? <span className="animate-pulse bg-muted rounded w-32 h-8 inline-block" /> : profile?.name || 'User'}
          </CardTitle>
          <div className="text-muted-foreground text-center">
            {loading ? <span className="animate-pulse bg-muted rounded w-40 h-4 inline-block" /> : profile?.email || 'user@example.com'}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 mt-6">
          {error && <div className="text-destructive text-center">{error}</div>}
          {!loading && profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Phone</span>
                <span className="font-medium text-base">{profile.phone || <span className="text-muted-foreground">-</span>}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Role</span>
                <span className="font-medium text-base">{profile.role}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Verified</span>
                <span className="font-medium text-base">{profile.isVerified ? 'Yes' : 'No'}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Email Verified</span>
                <span className="font-medium text-base">{profile.emailVerified ? 'Yes' : 'No'}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Created At</span>
                <span className="font-medium text-base">{profile.createdAt ? new Date(profile.createdAt).toLocaleString() : '-'}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Updated At</span>
                <span className="font-medium text-base">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '-'}</span>
              </div>
            </div>
          )}
          <div className="pt-4 flex justify-center">
            {/* <Link href="/dashboard/settings" passHref legacyBehavior>
              <Button asChild variant="default">
                <span>Edit Profile</span>
              </Button>
            </Link> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
