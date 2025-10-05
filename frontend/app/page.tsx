"use client";

import Link from "next/link";
import { useMemo } from "react";
import { subDays, isAfter, format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { usePostsStore } from "@/src/lib/stores/posts";
import { formatNumber } from "@/src/lib/utils";

export default function DashboardPage() {
  const jobs = usePostsStore((state) => state.jobs);

  const metrics = useMemo(() => {
    const now = new Date();
    const last7 = subDays(now, 7);
    const last30 = subDays(now, 30);

    const within7 = jobs.filter((job) => isAfter(parseISO(job.createdAt), last7));
    const within30 = jobs.filter((job) => isAfter(parseISO(job.createdAt), last30));

    const countByStatus = (collection: typeof jobs) =>
      collection.reduce(
        (acc, job) => {
          acc[job.status] = (acc[job.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const recentJobs = [...jobs]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 8);

    const chartData = Array.from({ length: 14 }).map((_, index) => {
      const day = subDays(now, 13 - index);
      const label = format(day, "MMM d");
      const count = jobs.filter((job) => format(parseISO(job.createdAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length;
      return { date: label, count };
    });

    return {
      last7: countByStatus(within7),
      last30: countByStatus(within30),
      recentJobs,
      chartData
    };
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor performance and keep tabs on your automation pipeline.</p>
        </div>
        <Button asChild>
          <Link href="/composer">New Post</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Drafts (7d)", value: metrics.last7["draft"] ?? 0 },
          { label: "Scheduled (7d)", value: metrics.last7["scheduled"] ?? 0 },
          { label: "Published (30d)", value: metrics.last30["published"] ?? 0 },
          { label: "Failed (30d)", value: metrics.last30["failed"] ?? 0 }
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(item.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Posts (last 14 days)</CardTitle>
            <CardDescription>Includes drafts, scheduled posts, and published activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest activity across your channel pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === "failed" ? "destructive" : job.status === "published" ? "default" : "secondary"}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{job.channel}</TableCell>
                    <TableCell>{format(parseISO(job.createdAt), "MMM d, HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {metrics.recentJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No activity yet. Create your first post to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
