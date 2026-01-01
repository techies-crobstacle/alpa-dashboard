
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const getLoginInfo = () => {
  if (typeof window !== "undefined") {
    // Example: adjust keys as per your login implementation
    const name = localStorage.getItem("alpa_name") || "User";
    const email = localStorage.getItem("alpa_email") || "user@example.com";
    return { name, email };
  }
  return { name: "User", email: "user@example.com" };
};

const ProfilePage = () => {
  const [{ name, email }, setInfo] = useState(getLoginInfo());

  useEffect(() => {
    setInfo(getLoginInfo());
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <Avatar className="size-16">
            <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">{name}</CardTitle>
            <div className="text-muted-foreground">{email}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          <div className="pt-4">
            <Button variant="outline" disabled>Edit Profile</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
