"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettingsStore } from "@/src/lib/stores/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  apiBaseUrl: z.string().url("Provide a valid URL"),
  apiToken: z.string().optional(),
  defaultModel: z.string().min(1),
  defaultTemperature: z.coerce.number().min(0).max(2),
  timezone: z.string().min(1),
  enableLiveLogs: z.boolean()
});

type SettingsForm = z.infer<typeof schema>;

export default function SettingsPage() {
  const { settings, updateSettings, reset } = useSettingsStore();
  const form = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: settings
  });

  const onSubmit = (values: SettingsForm) => {
    updateSettings(values);
    toast.success("Settings saved", { description: "Changes apply to new requests immediately." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Configure API connectivity, defaults, and developer options.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API configuration</CardTitle>
            <CardDescription>Update the backend endpoint and authentication token.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="apiBaseUrl">API base URL</Label>
              <Input id="apiBaseUrl" {...form.register("apiBaseUrl")}></Input>
              {form.formState.errors.apiBaseUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.apiBaseUrl.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="apiToken">API token</Label>
              <Input id="apiToken" type="password" {...form.register("apiToken")} placeholder="Bearer token" />
              <p className="text-xs text-muted-foreground">
                Stored in localStorage only. Required if backend enforces Bearer authentication.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>These values pre-populate the composer and scheduler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="defaultModel">Default model</Label>
                <Input id="defaultModel" {...form.register("defaultModel")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="defaultTemperature">Default temperature</Label>
                <Input id="defaultTemperature" type="number" step="0.1" {...form.register("defaultTemperature")}></Input>
                {form.formState.errors.defaultTemperature && (
                  <p className="text-xs text-destructive">{form.formState.errors.defaultTemperature.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" {...form.register("timezone")} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="enableLiveLogs">Live logs</Label>
                  <p className="text-xs text-muted-foreground">Attempts to subscribe to /jobs/logs via SSE.</p>
                </div>
                <Switch
                  id="enableLiveLogs"
                  checked={form.watch("enableLiveLogs")}
                  onCheckedChange={(value) => form.setValue("enableLiveLogs", value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => { reset(); form.reset(useSettingsStore.getState().settings); }}>
            Reset
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
