import { ServiceButtonSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ServicePermissionKey, ServiceStatus } from "@/lib/friction"

export function PermissionsSection({ loading, error, settingsError, data, onRetry, onOpenSettings }: {
  loading: boolean; error: Error | null; data: ServiceStatus
  settingsError: Error | null; onRetry: () => void
  onOpenSettings: (key: ServicePermissionKey) => Promise<void>
}) {
  const anyDisabled = !loading && !error && (!data.overlay || !data.accessibility)
  return (
    <section className="flex flex-col gap-3" aria-busy={loading}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Permissions</h2>
        <p className="text-sm text-muted-foreground">Enable pauses and optional reminder notifications.</p>
      </div>
      {error && <Alert variant="destructive"><AlertTitle>Couldn't check permissions</AlertTitle><AlertDescription>
        Permission status is unknown. {error.message}
        <Button type="button" variant="outline" onClick={onRetry}>Retry</Button>
      </AlertDescription></Alert>}
      {settingsError && <Alert variant="destructive"><AlertTitle>Couldn't open Android settings</AlertTitle><AlertDescription>
        {settingsError.message} Tap the permission again to retry.
      </AlertDescription></Alert>}
      {loading ? <><ServiceButtonSkeleton /><ServiceButtonSkeleton /></> : (
        <div className="flex flex-col gap-2">
          {([["overlay", "Display over other apps"], ["accessibility", "Accessibility service"], ["notifications", "Session reminder notifications"]] as const).map(([key, label]) => (
            <Button key={key} variant="outline" className="h-auto justify-between gap-3" onClick={() => { void onOpenSettings(key).catch(() => { /* Hook surfaces the error. */ }) }}>
              <span className="min-w-0 flex-1 text-left wrap-anywhere">{label}</span>
              <Badge variant={!error && data[key] ? "secondary" : "outline"}>{error ? "Unknown" : data[key] ? "Enabled" : "Set up"}</Badge>
            </Button>
          ))}
        </div>
      )}
      {anyDisabled && <Alert><AlertTitle>Finish setting up</AlertTitle><AlertDescription>Tap each permission above to enable it in Android settings.</AlertDescription></Alert>}
    </section>
  )
}
