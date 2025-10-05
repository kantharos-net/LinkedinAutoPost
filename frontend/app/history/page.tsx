"use client";

import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { usePostsStore } from "@/src/lib/stores/posts";
import { formatNumber } from "@/src/lib/utils";

export default function HistoryPage() {
  const jobs = usePostsStore((state) => state.jobs);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return jobs.filter((job) => job.title.toLowerCase().includes(search.toLowerCase()));
  }, [jobs, search]);

  const metrics = useMemo(() => {
    const now = new Date();
    const last30 = subDays(now, 30);
    const published = jobs.filter((job) => job.status === "published");
    const published30 = published.filter((job) => parseISO(job.createdAt) > last30);
    const failed = jobs.filter((job) => job.status === "failed");
    const perDay = Array.from({ length: 30 }).map((_, index) => {
      const day = subDays(now, 29 - index);
      const key = format(day, "yyyy-MM-dd");
      const count = published.filter((job) => format(parseISO(job.createdAt), "yyyy-MM-dd") === key).length;
      return { date: format(day, "MMM d"), count };
    });
    const byChannel = published.reduce<Record<string, number>>((acc, job) => {
      acc[job.channel] = (acc[job.channel] ?? 0) + 1;
      return acc;
    }, {});
    return {
      published: published.length,
      published30: published30.length,
      failed: failed.length,
      perDay,
      byChannel
    };
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">History & Analytics</h1>
          <p className="text-muted-foreground">Analyze performance trends and export past activity.</p>
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Published (all time)</CardTitle>
            <CardDescription>Total published posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(metrics.published)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Published (30 days)</CardTitle>
            <CardDescription>Velocity of recent publishing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(metrics.published30)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed jobs</CardTitle>
            <CardDescription>Requires manual attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">{formatNumber(metrics.failed)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publishing cadence</CardTitle>
          <CardDescription>Last 30 days of posts across all channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.perDay}>
                <defs>
                  <linearGradient id="historyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#historyArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>Search across historical posts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "failed" ? "destructive" : job.status === "published" ? "default" : "secondary"}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{job.channel}</TableCell>
                  <TableCell>{format(parseISO(job.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>{job.tags.join(", ")}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No matching entries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
