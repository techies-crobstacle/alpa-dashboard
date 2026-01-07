
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type PolicySection = {
  heading: string;
  content: string;
};

type Policy = {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
};

async function getReturnPolicy(): Promise<Policy> {
  // No token required
  const res = await api.get("/api/support/return-policy");
  return res.policy;
}

export default async function Page() {
  let policy: Policy | null = null;
  try {
    policy = await getReturnPolicy();
  } catch (e: any) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Error loading return policy</CardTitle>
            <CardDescription>{e.message || "Please try again later."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[40vh] p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{policy.title}</CardTitle>
          <CardDescription>
            Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {policy.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-lg mb-1">{section.heading}</h3>
              <div className="text-muted-foreground whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
