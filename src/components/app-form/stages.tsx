import { useEffect, useId, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Plus, X } from "lucide-react"
import { InstalledAppRowSkeleton } from "@/components/Skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useInstalledApps, useServiceStatus, type FrictionAppDraft } from "@/lib/friction"
import { hmsToSeconds, secondsToHMS } from "./utils"

type DraftSetter = Dispatch<SetStateAction<FrictionAppDraft>>

export function StageApp({ draft, setDraft, isEdit, coveredAppIds, currentAppId, suggestedAppId }: {
  draft: FrictionAppDraft; setDraft: DraftSetter; isEdit: boolean
  coveredAppIds: Set<string>; currentAppId?: string; suggestedAppId?: string
}) {
  const [query, setQuery] = useState("")
  const { data: apps, loading, pending, error } = useInstalledApps(query)
  const selectedSuggestion = useRef(false)
  useEffect(() => {
    if (selectedSuggestion.current || !suggestedAppId || loading || pending) return
    const app = apps.find(app => app.appId === suggestedAppId)
    if (app) {
      selectedSuggestion.current = true
      setDraft(current => current.appId ? current : { ...current, appId: app.appId, name: app.name })
    }
  }, [apps, loading, pending, suggestedAppId, setDraft])
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="app-search">Choose an application</FieldLabel>
        <FieldDescription>{isEdit ? "Change which installed app to limit." : "Pick from apps installed on the device."}</FieldDescription>
        <Input id="app-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps…" />
      </Field>
      {error && <Alert variant="destructive"><AlertDescription>{error.message}</AlertDescription></Alert>}
      <div className="max-h-96 overflow-x-hidden overflow-y-auto rounded-xl border" aria-busy={loading || pending}>
        {loading || pending ? Array.from({ length: 5 }, (_, i) => <InstalledAppRowSkeleton key={i} />) : apps.length === 0 ? (
          <Empty><EmptyHeader><EmptyTitle>No apps found</EmptyTitle><EmptyDescription>Try a different search.</EmptyDescription></EmptyHeader></Empty>
        ) : (
          <RadioGroup aria-label="Installed applications" value={draft.appId} onValueChange={(appId) => {
            const app = apps.find((item) => item.appId === appId)
            if (app) setDraft((current) => ({ ...current, appId, name: app.name }))
          }} className="gap-0">
            {apps.map((app) => {
              const covered = app.appId !== currentAppId && coveredAppIds.has(app.appId)
              return (
                <label key={app.appId} className="flex min-w-0 cursor-pointer items-center gap-3 border-b p-4 last:border-0 has-[[data-state=checked]]:bg-primary/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                  <RadioGroupItem value={app.appId} disabled={covered} aria-label={app.name} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1 wrap-anywhere">
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">{app.appId}</span>
                  </span>
                  {covered && <Badge variant="secondary">Added</Badge>}
                </label>
              )
            })}
          </RadioGroup>
        )}
      </div>
    </FieldGroup>
  )
}

export function StageTime({ draft, setDraft }: { draft: FrictionAppDraft; setDraft: DraftSetter }) {
  const services = useServiceStatus()
  const reminderInvalid = !Number.isInteger(draft.reminderIntervalMinutes) || draft.reminderIntervalMinutes < 1 || draft.reminderIntervalMinutes > 2147483647
  const wait = secondsToHMS(draft.waitSeconds)
  const duration = secondsToHMS(draft.durationSeconds)
  const [finiteDuration, setFiniteDuration] = useState(draft.durationSeconds || 300)
  return (
    <FieldGroup>
      <TimeBlock label="Wait time" hint="Pause before the app unlocks. Minimum one second." {...wait}
        onChange={(h, m, s) => setDraft((current) => ({ ...current, waitSeconds: Math.max(1, hmsToSeconds(h, m, s)) }))} />
      <Field orientation="horizontal" className="rounded-xl border p-4">
        <FieldContent>
          <FieldLabel htmlFor="unlimited">Unlimited duration</FieldLabel>
          <FieldDescription id="unlimited-hint">Stay unlocked until you leave the app. You'll wait again when you return.</FieldDescription>
        </FieldContent>
        <Switch id="unlimited" aria-describedby="unlimited-hint" checked={draft.durationSeconds === 0} onCheckedChange={(unlimited) => {
          if (unlimited) setFiniteDuration(draft.durationSeconds)
          setDraft((current) => ({ ...current, durationSeconds: unlimited ? 0 : finiteDuration }))
        }} />
      </Field>
      {draft.durationSeconds !== 0 && <TimeBlock label="Duration" hint="How long the app stays unlocked. Minimum one second." {...duration}
        onChange={(h, m, s) => setDraft((current) => ({ ...current, durationSeconds: Math.max(1, hmsToSeconds(h, m, s)) }))} />}
      <Field orientation="horizontal" className="rounded-xl border p-4">
        <FieldContent>
          <FieldLabel htmlFor="session-reminders">Session reminders</FieldLabel>
          <FieldDescription id="session-reminders-hint">Quiet reminders while you use this app. Each visit starts fresh.</FieldDescription>
        </FieldContent>
        <Switch id="session-reminders" aria-describedby="session-reminders-hint" checked={draft.reminderEnabled}
          onCheckedChange={reminderEnabled => setDraft(current => ({ ...current, reminderEnabled,
            reminderIntervalMinutes: !reminderEnabled && (!Number.isInteger(current.reminderIntervalMinutes) || current.reminderIntervalMinutes < 1 || current.reminderIntervalMinutes > 2147483647) ? 10 : current.reminderIntervalMinutes,
          }))} />
      </Field>
      {draft.reminderEnabled && <>
        <Field data-invalid={reminderInvalid || undefined}>
          <FieldLabel htmlFor="reminder-minutes">Remind me every (minutes)</FieldLabel>
          <Input id="reminder-minutes" type="number" min={1} max={2147483647} step={1}
            aria-invalid={reminderInvalid || undefined}
            value={Number.isNaN(draft.reminderIntervalMinutes) ? "" : draft.reminderIntervalMinutes}
            aria-describedby="reminder-minutes-hint"
            onChange={event => setDraft(current => ({ ...current, reminderIntervalMinutes: event.target.valueAsNumber }))} />
          <FieldDescription id="reminder-minutes-hint">Enter a positive whole number of minutes. Waiting time does not count.</FieldDescription>
        </Field>
        {!services.loading && !services.error && !services.data.notifications && <Alert><AlertDescription>
          Notifications are disabled. Enable them to receive session reminders; your waiting pauses still work.
          <Button type="button" variant="outline" onClick={() => { void services.openSettings("notifications").catch(() => {}) }}>Enable notifications</Button>
        </AlertDescription></Alert>}
        {services.error && <Alert variant="destructive"><AlertDescription>{services.error.message}</AlertDescription></Alert>}
      </>}
    </FieldGroup>
  )
}

function TimeBlock({ label, hint, h, m, s, onChange }: {
  label: string; hint: string; h: number; m: number; s: number
  onChange: (h: number, m: number, s: number) => void
}) {
  return (
    <FieldSet className="min-w-0 rounded-xl border p-4">
      <FieldLegend>{label}</FieldLegend>
      <FieldDescription>{hint}</FieldDescription>
      <FieldGroup className="grid grid-cols-3 gap-3">
        <NumberField label="Hours" value={h} max={23} onChange={(value) => onChange(value, m, s)} />
        <NumberField label="Minutes" value={m} max={59} onChange={(value) => onChange(h, value, s)} />
        <NumberField label="Seconds" value={s} max={59} onChange={(value) => onChange(h, m, value)} />
      </FieldGroup>
    </FieldSet>
  )
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const id = useId()
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type="text" inputMode="numeric" pattern="[0-9]*" value={editing ?? String(value)}
        onFocus={(e) => { setEditing(value === 0 ? "" : String(value)); e.currentTarget.select() }}
        onBlur={() => setEditing(null)} onChange={(e) => {
          const text = e.target.value
          if (!/^\d*$/.test(text)) return
          setEditing(text)
          onChange(Math.min(max, Number(text)))
        }} />
    </Field>
  )
}

export function StageMessages({ draft, setDraft }: { draft: FrictionAppDraft; setDraft: DraftSetter }) {
  return (
    <FieldGroup>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">Friction messages</h3>
        <p className="text-sm text-muted-foreground">Shown during the countdown. Add a few gentle reminders to rotate through.</p>
      </div>
      {draft.messages.map((message, index) => (
        <Field key={index}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor={`message-${index}`}>Message {index + 1}</FieldLabel>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove message ${index + 1}`} onClick={() =>
              setDraft((current) => ({ ...current, messages: current.messages.filter((_, i) => i !== index) }))
            }><X /></Button>
          </div>
          <MessageField id={`message-${index}`} value={message} onChange={(value) => setDraft((current) => ({
            ...current, messages: current.messages.map((text, i) => i === index ? value : text),
          }))} />
        </Field>
      ))}
      <Button type="button" variant="outline" onClick={() => setDraft((current) => ({ ...current, messages: [...current.messages, ""] }))}>
        <Plus /> Add message
      </Button>
    </FieldGroup>
  )
}

function MessageField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = "auto"
    element.style.height = `${element.scrollHeight + 2}px`
  }, [value])
  return <Textarea id={id} ref={ref} rows={3} value={value} onChange={(e) => onChange(e.target.value)}
    placeholder="A gentle nudge…" className="min-w-0 resize-none overflow-hidden wrap-anywhere" />
}
