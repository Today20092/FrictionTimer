import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/AppHeader";
import { openExternalUrl, useApps, useInstalledApps, useServiceStatus } from "@/lib/friction";
import { recommendedApps } from "@/lib/friction/recommendations";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppsSection } from "./apps-section";
import { PermissionsSection } from "./permissions-section";

const REPOSITORY_URL = "https://github.com/Today20092/FrictionTimer";

export function HomePage() {
  const apps = useApps();
  const services = useServiceStatus();
  const installed = useInstalledApps("");
  const recommendations = !apps.loading && !apps.error && !installed.loading && !installed.error
    ? recommendedApps(installed.data, apps.data) : [];
  const allPermissionsEnabled = !services.loading && !services.error &&
    services.data.overlay && services.data.accessibility && services.data.notifications;

  const handleRepositoryLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void openExternalUrl(REPOSITORY_URL);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="container-app flex flex-1 flex-col gap-5 py-4">
        {recommendations.length > 0 && <section className="flex min-w-0 flex-col gap-2">
          <h2 className="text-lg font-semibold">Recommended apps</h2>
          <p className="text-sm text-muted-foreground">Add a pause before opening a feed.</p>
          <ul className="grid grid-cols-2 gap-2">
            {recommendations.map(app => <li key={app.appId}>
              <Button asChild variant="outline" className="h-auto w-full min-w-0 justify-start">
                <Link to="/app/new" search={{ appId: app.appId }} className="wrap-anywhere">{app.name}</Link>
              </Button>
            </li>)}
          </ul>
        </section>}
        <AppsSection
          loading={apps.loading}
          error={apps.error}
          data={apps.data}
          onRetry={apps.refresh}
        />

        {!allPermissionsEnabled && <>
          <Separator />

          <PermissionsSection
            loading={services.loading}
            error={services.error}
            settingsError={services.settingsError}
            data={services.data}
            onRetry={services.refresh}
            onOpenSettings={services.openSettings}
          />
        </>}
      </main>
      <footer className="container-app py-3 text-center text-sm text-muted-foreground">
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          onClick={handleRepositoryLinkClick}
        >
          GitHub repository
        </a>
      </footer>
    </div>
  );
}
