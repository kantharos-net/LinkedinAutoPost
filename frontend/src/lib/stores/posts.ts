import { addMinutes, formatISO } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { JobLogEntry, PostJob } from "@/src/lib/types";

interface PostsState {
  jobs: PostJob[];
  logs: Record<string, JobLogEntry[]>;
  upsertJob: (job: Partial<PostJob> & { id?: string }) => PostJob;
  updateJobStatus: (id: string, status: PostJob["status"], errorMessage?: string) => void;
  appendLog: (jobId: string, entry: Omit<JobLogEntry, "id" | "jobId">) => JobLogEntry;
  getJobLogs: (jobId: string) => JobLogEntry[];
  reset: () => void;
}

const initialJobs: PostJob[] = [];

export const usePostsStore = create<PostsState>()(
  persist(
    (set, get) => ({
      jobs: initialJobs,
      logs: {},
      upsertJob: (job) => {
        const id = job.id ?? nanoid();
        const nextJob: PostJob = {
          id,
          title: job.title ?? "Untitled Post",
          channel: job.channel ?? "linkedin",
          createdAt: job.createdAt ?? formatISO(new Date()),
          status: job.status ?? "draft",
          attempts: job.attempts ?? 0,
          tags: job.tags ?? [],
          content: job.content ?? "",
          prompt: job.prompt,
          errorMessage: job.errorMessage,
          scheduledFor: job.scheduledFor
        };

        set((state) => {
          const exists = state.jobs.findIndex((item) => item.id === id);
          if (exists >= 0) {
            const jobs = [...state.jobs];
            jobs[exists] = { ...jobs[exists], ...nextJob };
            return { jobs };
          }
          return { jobs: [nextJob, ...state.jobs] };
        });

        return get().jobs.find((item) => item.id === id) ?? nextJob;
      },
      updateJobStatus: (id, status, errorMessage) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, status, errorMessage, attempts: job.attempts + (status === "failed" ? 1 : 0) } : job
          )
        })),
      appendLog: (jobId, entry) => {
        const log: JobLogEntry = {
          id: nanoid(),
          jobId,
          ...entry
        };
        set((state) => ({
          logs: {
            ...state.logs,
            [jobId]: [...(state.logs[jobId] ?? []), log]
          }
        }));
        return log;
      },
      getJobLogs: (jobId) => get().logs[jobId] ?? [],
      reset: () =>
        set({
          jobs: initialJobs,
          logs: {}
        })
    }),
    {
      name: "lap-posts",
      version: 1
    }
  )
);

export function seedDemoData() {
  const store = usePostsStore.getState();
  if (store.jobs.length > 0) return;
  const base = new Date();
  const sample = [
    {
      title: "Launch recap",
      status: "published" as const,
      createdAt: formatISO(addMinutes(base, -180)),
      channel: "linkedin",
      attempts: 1,
      tags: ["launch", "product"],
      content: "We just launched our auto-poster!",
      scheduledFor: undefined
    },
    {
      title: "Weekly update",
      status: "scheduled" as const,
      createdAt: formatISO(addMinutes(base, -60)),
      scheduledFor: formatISO(addMinutes(base, 120)),
      channel: "linkedin",
      attempts: 0,
      tags: ["update"],
      content: "Drafting next week's update."
    },
    {
      title: "AI tips",
      status: "failed" as const,
      createdAt: formatISO(addMinutes(base, -240)),
      scheduledFor: formatISO(addMinutes(base, -180)),
      channel: "linkedin",
      attempts: 2,
      tags: ["ai", "tips"],
      content: "Sharing AI best practices.",
      errorMessage: "LinkedIn API returned 401"
    }
  ];

  sample.forEach((item) =>
    store.upsertJob({
      ...item,
      id: nanoid()
    })
  );
}
