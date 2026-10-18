import { Link } from "@tanstack/react-router"
import { Plus, ArrowUpRight } from "lucide-react"
import { AppCardSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { formatDuration, type FrictionApp } from "@/lib/friction"

export function AppsSection({ loading, error, data, onRetry }: {
  loading: boolean; error: Error | null; data: FrictionApp[]; onRetry: () => void
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your limited apps</h2>
        {!loading && <Badge variant="secondary">{data.length}</Badge>}
      </div>
      {error && <Alert variant="destructive"><AlertDescription>
        Couldn't load apps: {error.message}
        <Button type="button" variant="outline" onClick={onRetry}>Retry</Button>
      </AlertDescription></Alert>}
      {loading ? <><AppCardSkeleton /><AppCardSkeleton /></> : data.length === 0 && !error ? (
        <Empty><EmptyHeader><EmptyTitle>A little pause goes a long way</EmptyTitle><EmptyDescription>Add an app to create a moment of intention before opening it.</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((app) => (
            <li key={app.id}>
              <Link to="/app/$id" params={{ id: app.id }} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-3"><span className="min-w-0 wrap-anywhere">{app.name}</span><ArrowUpRight className="size-4 shrink-0" /></CardTitle>
                    <CardDescription className="wrap-anywhere">{app.appId}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Wait {formatDuration(app.waitSeconds)}</Badge>
                    <Badge variant="outline">{app.durationSeconds === 0 ? "Unlimited session" : `Open for ${formatDuration(app.durationSeconds)}`}</Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button asChild><Link to="/app/new"><Plus /> Add application</Link></Button>
    </section>
  )
}
