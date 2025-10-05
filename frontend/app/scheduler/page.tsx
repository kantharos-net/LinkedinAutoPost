"use client";

import { addDays, eachDayOfInterval, endOfMonth, format, isSameDay, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { usePostsStore } from "@/src/lib/stores/posts";
import { cn } from "@/src/lib/utils";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulerPage() {
  const jobs = usePostsStore((state) => state.jobs.filter((job) => job.status === "scheduled"));
  const [month, setMonth] = useState(new Date());

  const calendar = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = addDays(endOfMonth(month), 6);
    const days = eachDayOfInterval({ start, end });
    return days;
  }, [month]);

  const scheduledByDay = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      if (!job.scheduledFor) return acc;
      const key = format(parseISO(job.scheduledFor), "yyyy-MM-dd");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const upcoming = [...jobs]
    .filter((job) => job.scheduledFor)
    .sort((a, b) => (a.scheduledFor! > b.scheduledFor! ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Scheduler</h1>
          <p className="text-muted-foreground">Visualize upcoming posts and manage publishing cadence.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMonth(addDays(month, -30))}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" onClick={() => setMonth(addDays(month, 30))}>
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{format(month, "MMMM yyyy")}</CardTitle>
          <CardDescription>Counts include all scheduled jobs per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
            {weekDays.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {calendar.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const count = scheduledByDay[key] ?? 0;
              const isCurrentMonth = day.getMonth() === month.getMonth();
              return (
                <div
                  key={key}
                  className={cn(
                    "flex h-24 flex-col rounded-md border bg-card p-2 text-left",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-semibold">{format(day, "d")}</span>
                  {count > 0 && (
                    <span className="mt-2 inline-flex h-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {count} scheduled
                    </span>
                  )}
                  <div className="mt-auto space-y-1 text-[11px] text-muted-foreground">
                    {jobs
                      .filter((job) => job.scheduledFor && isSameDay(parseISO(job.scheduledFor), day))
                      .slice(0, 2)
                      .map((job) => (
                        <p key={job.id} className="truncate">
                          {job.title}
                        </p>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming posts</CardTitle>
          <CardDescription>Includes scheduled and queued posts with future run times.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Scheduled for</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.scheduledFor ? format(parseISO(job.scheduledFor), "MMM d, HH:mm") : "-"}</TableCell>
                  <TableCell className="capitalize">{job.channel}</TableCell>
                  <TableCell>{job.tags.join(", ")}</TableCell>
                </TableRow>
              ))}
              {upcoming.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No posts scheduled yet.
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
