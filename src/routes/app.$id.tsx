import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppForm } from "@/components/AppForm";
import { Skeleton } from "@/components/Skeletons";
import { useApp } from "@/lib/friction";

export const Route = createFileRoute("/app/$id")({
  head: () => ({
    meta: [
      { title: "Edit application — Friction Timer" },
      { name: "description", content: "Edit a limited application." },
    ],
  }),
  component: EditAppPage,
});

function EditAppPage() {
  const { id } = useParams({ from: "/app/$id" });
  const navigate = useNavigate();
  const { data: app, loading, error, refresh } = useApp(id);
  const currentApp = app?.id === id ? app : null;

  // Redirect to home only after the fetch has resolved and produced nothing.
  useEffect(() => {
    if (!loading && !error && app === null) {
      navigate({ to: "/" });
    }
  }, [loading, error, app, navigate]);

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="container-app flex min-h-0 flex-1 flex-col gap-3 py-3">
        <h2 className="shrink-0 text-lg font-bold">Edit application</h2>

        {loading && !currentApp && <EditFormSkeleton />}

        {error && (
          <Alert variant="destructive"><AlertDescription>
            Couldn't load app: {error.message}
            <Button type="button" variant="outline" onClick={refresh}>Retry</Button>
          </AlertDescription></Alert>
        )}

        {currentApp && <AppForm key={currentApp.id} initial={currentApp} />}
      </main>
    </div>
  );
}

function EditFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
