"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { usePostsStore } from "@/src/lib/stores/posts";
import { useSettingsStore } from "@/src/lib/stores/settings";
import { createSseStream } from "@/src/lib/api/client";
import { useEffect } from "react";
import type { JobLogEntry, PostJob } from "@/src/lib/types";
import { toast } from "sonner";

const statusFilters: PostJob["status"][] = [
  "draft",
  "queued",
  "scheduled",
  "publishing",
  "published",
  "failed"
];

export default function JobsPage() {
  const jobs = usePostsStore((state) => state.jobs);
  const updateStatus = usePostsStore((state) => state.updateJobStatus);
  const getLogs = usePostsStore((state) => state.getJobLogs);
  const appendLog = usePostsStore((state) => state.appendLog);
  const { settings } = useSettingsStore();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<PostJob["status"] | "all">("all");
  const [activeJob, setActiveJob] = useState<PostJob | null>(null);

  useEffect(() => {
    if (!settings.enableLiveLogs) return;
    const stream = createSseStream("/jobs/logs", (event) => {
      try {
        const data = JSON.parse(event.data) as JobLogEntry;
        appendLog(data.jobId, {
          level: data.level,
          message: data.message,
          timestamp: data.timestamp
        });
      } catch (error) {
        console.warn("Failed to parse log message", error);
      }
    });
    return () => {
      stream?.close();
    };
  }, [appendLog, settings.enableLiveLogs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = selectedStatus === "all" || job.status === selectedStatus;
      const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [jobs, search, selectedStatus]);

  const retryJob = (job: PostJob) => {
    updateStatus(job.id, "queued");
    appendLog(job.id, {
      level: "info",
      message: "Job manually retried from console",
      timestamp: new Date().toISOString()
    });
    toast.success("Retry triggered", { description: `${job.title} moved back to queue` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs & Logs</h1>
          <p className="text-muted-foreground">Monitor processing status, retry failures, and inspect execution logs.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine jobs by status or search by title.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search jobs" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PostJob["status"] | "all") }>
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="all">All</TabsTrigger>
              {statusFilters.map((status) => (
                <TabsTrigger key={status} value={status} className="capitalize">
                  {status}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job timeline</CardTitle>
          <CardDescription>Click a row to inspect attempts and logs.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id} className="cursor-pointer" onClick={() => setActiveJob(job)}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "failed" ? "destructive" : job.status === "published" ? "default" : "secondary"}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{job.channel}</TableCell>
                  <TableCell>{format(parseISO(job.createdAt), "MMM d, HH:mm")}</TableCell>
                  <TableCell>{job.attempts}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); retryJob(job); }}>
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeJob)} onOpenChange={(open) => !open && setActiveJob(null)}>
        <DialogContent>
          {activeJob && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{activeJob.title}</DialogTitle>
                <DialogDescription>
                  Status: <span className="capitalize">{activeJob.status}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="font-medium">Channel:</span> {activeJob.channel}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {format(parseISO(activeJob.createdAt), "PPpp")}
                </div>
                {activeJob.scheduledFor && (
                  <div>
                    <span className="font-medium">Scheduled:</span> {format(parseISO(activeJob.scheduledFor), "PPpp")}
                  </div>
                )}
                {activeJob.errorMessage && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive">
                    {activeJob.errorMessage}
                  </div>
                )}
                <div>
                  <span className="font-medium">Prompt:</span>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{activeJob.prompt}</p>
                </div>
                <div>
                  <span className="font-medium">Content:</span>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{activeJob.content}</p>
                </div>
                <div>
                  <span className="font-medium">Logs:</span>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-md border p-3 text-xs">
                    {getLogs(activeJob.id).map((log) => (
                      <div key={log.id} className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="uppercase tracking-wide">{log.level}</span>
                          <span>{format(parseISO(log.timestamp), "HH:mm:ss")}</span>
                        </div>
                        <p>{log.message}</p>
                      </div>
                    ))}
                    {getLogs(activeJob.id).length === 0 && <p className="text-muted-foreground">No logs captured.</p>}
                  </div>
                </div>
              </div>
              <DialogFooter className="justify-between">
                <Button variant="outline" onClick={() => retryJob(activeJob)}>
                  Retry
                </Button>
                <Button onClick={() => setActiveJob(null)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
