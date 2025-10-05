"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Form, FormField } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { apiClient } from "@/src/lib/api/client";
import { usePostsStore } from "@/src/lib/stores/posts";
import { useSettingsStore } from "@/src/lib/stores/settings";
import { composerDefaultValues, composerSchema } from "@/src/lib/schemas/composer";
import { z } from "zod";
import { nanoid } from "nanoid";

type ComposerFormValues = z.infer<typeof composerSchema>;

export default function ComposerPage() {
  const { settings } = useSettingsStore();
  const upsertJob = usePostsStore((state) => state.upsertJob);
  const updateJobStatus = usePostsStore((state) => state.updateJobStatus);

  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: {
      ...composerDefaultValues,
      model: settings.defaultModel,
      temperature: settings.defaultTemperature
    }
  });

  const generateMutation = useMutation({
    mutationFn: (values: ComposerFormValues) =>
      apiClient.generatePostContent({
        description: values.prompt,
        skills: (values.tags ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
  });

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; text: string }) => apiClient.publishPost({ text: payload.text })
  });

  const handleGenerate = async (values: ComposerFormValues) => {
    try {
      const content = await generateMutation.mutateAsync(values);
      form.setValue("content", content);
      toast.success("Content generated", { description: "Review and refine before publishing." });
    } catch (error) {
      toast.error("Generation failed", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleSaveDraft = (values: ComposerFormValues) => {
    const id = nanoid();
    upsertJob({
      id,
      title: values.title,
      tags: (values.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      channel: values.channel,
      status: "draft",
      content: values.content ?? "",
      prompt: values.prompt
    });
    toast.success("Draft saved", { description: "Find it in the dashboard and scheduler." });
    form.reset({
      ...composerDefaultValues,
      model: settings.defaultModel,
      temperature: settings.defaultTemperature
    });
  };

  const handlePublish = async (values: ComposerFormValues, mode: "publish" | "schedule") => {
    const id = nanoid();
    const baseJob = upsertJob({
      id,
      title: values.title,
      tags: (values.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      channel: values.channel,
      status: mode === "publish" ? "publishing" : "scheduled",
      content: values.content ?? "",
      prompt: values.prompt,
      scheduledFor: mode === "schedule" && values.scheduledFor ? values.scheduledFor : undefined
    });

    if (mode === "schedule") {
      toast.success("Post scheduled", {
        description: `Scheduled for ${values.scheduledFor || formatISO(new Date())}`
      });
      form.reset({
        ...composerDefaultValues,
        model: settings.defaultModel,
        temperature: settings.defaultTemperature
      });
      return;
    }

    if (!values.content) {
      toast.error("Content missing", { description: "Generate or write content before publishing." });
      updateJobStatus(baseJob.id, "failed", "No content provided");
      return;
    }

    try {
      await publishMutation.mutateAsync({ id: baseJob.id, text: values.content });
      updateJobStatus(baseJob.id, "published");
      toast.success("Post published", { description: "Check LinkedIn to confirm." });
      form.reset({
        ...composerDefaultValues,
        model: settings.defaultModel,
        temperature: settings.defaultTemperature
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      updateJobStatus(baseJob.id, "failed", message);
      toast.error("Publish failed", { description: message });
    }
  };

  const onSubmit = (values: ComposerFormValues) => handleSaveDraft(values);

  const contentValue = form.watch("content");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Composer</h1>
        <p className="text-muted-foreground">Craft a LinkedIn update, generate with GPT, and schedule or publish instantly.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post details</CardTitle>
                <CardDescription>Provide the metadata used for analytics and channel routing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField name="title" label="Title" required>
                  <Input placeholder="Product launch recap" />
                </FormField>
                <FormField
                  name="tags"
                  label="Tags"
                  description="Comma separated tags help with skills extraction."
                >
                  <Input placeholder="launch, automation, ai" />
                </FormField>
                <FormField name="channel" label="Channel" required>
                  {(field) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPT generation</CardTitle>
                <CardDescription>Control the model, temperature, and prompts used to synthesize content.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField name="model" label="Model" required>
                    {(field) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                          <SelectItem value="gpt-4">gpt-4</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                  <FormField name="temperature" label="Temperature" required>
                    {(field) => (
                      <Input type="number" step="0.1" min={0} max={2} {...field} />
                    )}
                  </FormField>
                  <FormField name="maxTokens" label="Max tokens" required>
                    {(field) => <Input type="number" min={64} max={4096} step={32} {...field} />}
                  </FormField>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label htmlFor="autoEnhance">Auto enhance tone</Label>
                      <p className="text-xs text-muted-foreground">Apply platform-specific tone adjustments.</p>
                    </div>
                    <FormField name="autoEnhance">
                      {(field) => (
                        <Switch
                          id="autoEnhance"
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    </FormField>
                  </div>
                </div>
                <FormField
                  name="systemPrompt"
                  label="System prompt"
                  description="Optional guardrails merged with the default system instructions."
                >
                  <Textarea rows={3} placeholder="You are a professional social media assistant..." />
                </FormField>
                <FormField
                  name="prompt"
                  label="Generation brief"
                  description="Describe the event, highlights, and tone for the AI."
                  required
                >
                  <Textarea rows={5} placeholder="We hosted a webinar about AI productivity..." />
                </FormField>
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleGenerate)}
                  disabled={generateMutation.isLoading}
                >
                  {generateMutation.isLoading ? "Generating..." : "Generate with GPT"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Review, edit, and personalize before sharing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField name="content" label="Post content">
                  <Textarea rows={10} placeholder="Your polished LinkedIn update will appear here." />
                </FormField>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Rendered using LinkedIn typography.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-background p-4 text-sm leading-relaxed shadow-sm">
                  {contentValue ? (
                    contentValue.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Generate or paste content to see a preview.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling</CardTitle>
                <CardDescription>Publish instantly or pick a future slot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  name="scheduledFor"
                  label="Schedule for"
                  description={`Timezone: ${settings.timezone}`}
                >
                  <Input type="datetime-local" />
                </FormField>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" variant="secondary" className="w-full">
                  Save draft
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  onClick={form.handleSubmit((values) => handlePublish(values, "publish"))}
                  disabled={publishMutation.isLoading}
                >
                  {publishMutation.isLoading ? "Publishing..." : "Publish now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={form.handleSubmit((values) => handlePublish(values, "schedule"))}
                >
                  Schedule
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
