import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { useServiceStatus } from "@/lib/friction";

export const PERMISSION_SETUP_KEY = "friction-permission-setup-complete";

const steps = [
  { key: "overlay", title: "Show the pause screen", why: "Display over other apps lets Friction Timer show a countdown on top of an app you selected.", without: "Without this, the pause screen cannot appear and your apps will open without a delay.", instruction: "In Android settings, allow Friction Timer to display over other apps, then return here." },
  { key: "accessibility", title: "Notice when a selected app opens", why: "The accessibility service detects which app is in front so Friction Timer knows when to start your pause.", without: "Without this, Friction Timer cannot detect when to pause your selected apps.", instruction: "In Android accessibility settings, find Friction Timer and turn on its service, then return here. Review Android’s access warning before deciding." },
  { key: "notifications", title: "Get session reminders", why: "Notifications let Friction Timer remind you how long you have been using an app when you enable session reminders.", without: "Without this, reminder notifications will not arrive. Your pauses still work if the first two permissions are enabled.", instruction: "In Android notification settings, allow notifications for Friction Timer, then return here." },
] as const;

export function PermissionSetup({ services, onFinish }: { services: ReturnType<typeof useServiceStatus>; onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const known = !services.loading && !services.error;
  return <section className="mx-auto flex w-full max-w-lg flex-col gap-5" aria-labelledby="setup-title">
    <p className="text-sm text-muted-foreground">Set up Friction Timer · {current ? `Step ${step + 1} of 3` : "Review"}</p>
    <h1 id="setup-title" className="text-2xl font-semibold">{current?.title ?? "Your permission choices"}</h1>
    {current ? <>
      <p className="text-sm font-medium">{current.key === "notifications" ? "Optional" : "Needed for pauses"}</p>
      <p>{current.why}</p>
      <p className="text-muted-foreground">{current.without}</p>
      <p className="text-sm">{current.instruction}</p>
      <p role="status">{services.loading ? "Checking permission…" : services.error ? "Permission status is unknown." : services.data[current.key] ? "Enabled" : "Not enabled"}</p>
      {(!known || !services.data[current.key]) && <Button disabled={services.loading} onClick={() => { void services.openSettings(current.key).catch(() => { /* The hook displays the error below. */ }); }}>Open Android settings</Button>}
      <Button variant={known && services.data[current.key] ? "default" : "outline"} onClick={() => setStep(step + 1)}>{known && services.data[current.key] ? "Next" : "Skip for now"}</Button>
    </> : <>
      <p>{!known ? "We could not confirm your permissions. You can check them on the home screen." : services.data.overlay && services.data.accessibility ? "Pauses are ready. Add an app on the home screen to choose when to pause." : "Pauses will not work yet. Enable both Display over other apps and Accessibility service when you are ready."}</p>
      <p>{known && services.data.notifications ? "Notifications are enabled. You can turn on session reminders for each app." : "Session reminder notifications are unavailable until notifications are enabled."}</p>
      <p className="text-sm text-muted-foreground">You can change permissions later in the Permissions section on the home screen or in Android settings.</p>
      <Button onClick={onFinish}>Go to home</Button>
    </>}
    {services.error && <div role="alert"><p>Couldn’t check permissions. {services.error.message}</p><Button variant="outline" onClick={services.refresh}>Retry permission check</Button></div>}
    {services.settingsError && <p role="alert">Couldn’t open Android settings. {services.settingsError.message} Try again, or skip for now.</p>}
    {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
  </section>;
}
