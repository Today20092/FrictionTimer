import { ServiceButtonSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ServicePermissionKey, ServiceStatus } from "@/lib/friction"

export function PermissionsSection({ loading, error, data, onOpenSettings }: {
  loading: boolean; error: Error | null; data: ServiceStatus
  onOpenSettings: (key: ServicePermissionKey) => Promise<void>
}) {
  const anyDisabled = !loading && (!data.overlay || !data.accessibility)
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Permissions</h2>
        <p className="text-sm text-muted-foreground">Both permissions keep your pauses working.</p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error.message}</AlertDescription></Alert>}
      {loading ? <><ServiceButtonSkeleton /><ServiceButtonSkeleton /></> : (
        <div className="flex flex-col gap-3">
          {([["overlay", "Display over other apps"], ["accessibility", "Accessibility service"]] as const).map(([key, label]) => (
            <Button key={key} variant="outline" className="h-auto justify-between gap-3 py-4" onClick={() => { void onOpenSettings(key).catch(() => { /* Hook surfaces the error. */ }) }}>
              <span className="min-w-0 flex-1 text-left wrap-anywhere">{label}</span>
              <Badge variant={data[key] ? "secondary" : "outline"}>{data[key] ? "Enabled" : "Set up"}</Badge>
            </Button>
          ))}
        </div>
      )}
      {anyDisabled && <Alert><AlertTitle>Finish setting up</AlertTitle><AlertDescription>Tap each permission above to enable it in Android settings.</AlertDescription></Alert>}
    </section>
  )
}
