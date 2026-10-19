import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppForm } from "@/components/AppForm";

export const Route = createFileRoute("/app/new")({
  validateSearch: (search: Record<string, unknown>): { appId?: string } => ({
    appId: typeof search.appId === "string" ? search.appId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add application — Friction Timer" },
      { name: "description", content: "Add a new application to limit." },
    ],
  }),
  component: NewAppPage,
});

function NewAppPage() {
  const { appId } = Route.useSearch();
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="container-app flex min-h-0 flex-1 flex-col gap-3 py-3">
        <h2 className="shrink-0 text-lg font-bold">New application</h2>
        <AppForm key={appId} suggestedAppId={appId} />
      </main>
    </div>
  );
}
