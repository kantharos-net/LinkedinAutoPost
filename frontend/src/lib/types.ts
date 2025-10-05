export interface GeneratePostContentRequest {
  description: string;
  skills: string[];
}

export type GeneratePostContentResponse = string;

export interface PublishPostRequest {
  text: string;
}

export interface LinkedInPostResponse {
  id?: string;
  [key: string]: unknown;
}

export interface NormalizedApiError {
  message: string;
  status?: number;
  requestId?: string | null;
  details?: unknown;
}

export interface JobLogEntry {
  id: string;
  jobId: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export type JobStatus = "draft" | "queued" | "scheduled" | "publishing" | "published" | "failed";

export interface PostJob {
  id: string;
  title: string;
  channel: string;
  scheduledFor?: string;
  createdAt: string;
  status: JobStatus;
  attempts: number;
  tags: string[];
  content: string;
  prompt?: string;
  errorMessage?: string;
}
