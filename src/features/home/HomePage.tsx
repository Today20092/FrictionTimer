import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/AppHeader";
import { openExternalUrl, useApps, useInstalledApps, useServiceStatus } from "@/lib/friction";
import { recommendedApps } from "@/lib/friction/recommendations";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppsSection } from "./apps-section";
import { PermissionsSection } from "./permissions-section";

const AUTHOR_URL = "https://brunorochamoura.com";

export function HomePage() {
  const apps = useApps();
  const services = useServiceStatus();
  const installed = useInstalledApps("");
  const recommendations = !apps.loading && !apps.error && !installed.loading && !installed.error
    ? recommendedApps(installed.data, apps.data) : [];

  const handleAuthorLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void openExternalUrl(AUTHOR_URL);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="container-app flex flex-1 flex-col gap-8 py-6">
        {recommendations.length > 0 && <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Recommended apps</h2>
          <p className="text-sm text-muted-foreground">Add a pause before opening a feed.</p>
          <ul className="flex flex-col gap-2">
            {recommendations.map(app => <li key={app.appId}>
              <Button asChild variant="outline" className="h-auto w-full justify-start whitespace-normal py-3">
                <Link to="/app/new" search={{ appId: app.appId }}>{app.name}</Link>
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

        <Separator />

        <PermissionsSection
          loading={services.loading}
          error={services.error}
          settingsError={services.settingsError}
          data={services.data}
          onRetry={services.refresh}
          onOpenSettings={services.openSettings}
        />
      </main>
      <footer className="container-app py-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          onClick={handleAuthorLinkClick}
        >
          Made by brunorochamoura.com
        </a>
      </footer>
    </div>
  );
}
