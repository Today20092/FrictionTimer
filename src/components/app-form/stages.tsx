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
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useInstalledApps, useServiceStatus, type FrictionAppDraft } from "@/lib/friction"
import { hmsToSeconds, secondsToHMS } from "./utils"

type DraftSetter = Dispatch<SetStateAction<FrictionAppDraft>>

export function StageApp({ draft, setDraft, isEdit, coveredAppIds, currentAppId, suggestedAppId }: {
  draft: FrictionAppDraft; setDraft: DraftSetter; isEdit: boolean
  coveredAppIds: Set<string>; currentAppId?: string; suggestedAppId?: string
}) {
  const [query, setQuery] = useState("")
  const { data: apps, loading, pending, error, refresh } = useInstalledApps(query)
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
    <FieldGroup className="h-full min-h-0 gap-3">
      <Field className="shrink-0 gap-2">
        <FieldLabel htmlFor="app-search">Choose an application</FieldLabel>
        <FieldDescription className="sr-only">{isEdit ? "Change which installed app to limit." : "Pick from apps installed on the device."}</FieldDescription>
        <Input id="app-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps…" />
      </Field>
      {error && !pending && <Alert variant="destructive"><AlertDescription>
        Couldn't load installed apps: {error.message}
        <Button type="button" variant="outline" onClick={refresh}>Retry</Button>
      </AlertDescription></Alert>}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border" aria-busy={loading || pending}>
        {loading || pending ? Array.from({ length: 5 }, (_, i) => <InstalledAppRowSkeleton key={i} />) : error ? null : apps.length === 0 ? (
          <Empty><EmptyHeader><EmptyTitle>No apps found</EmptyTitle><EmptyDescription>Try a different search.</EmptyDescription></EmptyHeader></Empty>
        ) : (
          <RadioGroup aria-label="Installed applications" value={draft.appId} onValueChange={(appId) => {
            const app = apps.find((item) => item.appId === appId)
            if (app) setDraft((current) => ({ ...current, appId, name: app.name }))
          }} className="gap-0">
            {apps.map((app) => {
              const covered = app.appId !== currentAppId && coveredAppIds.has(app.appId)
              return (
                <label key={app.appId} className="relative flex min-w-0 cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-0 has-[[data-state=checked]]:bg-primary/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
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
    <FieldGroup className="gap-2">
      <TimeBlock label="Wait time" hint="Pause before opening. Minimum one second." {...wait}
        onChange={(h, m, s) => setDraft((current) => ({ ...current, waitSeconds: hmsToSeconds(h, m, s) }))} />
      <Field orientation="horizontal" className="relative rounded-xl border p-3">
        <FieldContent>
          <FieldLabel htmlFor="unlimited">Unlimited duration</FieldLabel>
          <FieldDescription id="unlimited-hint">Unlocked until you leave the app.</FieldDescription>
        </FieldContent>
        <Switch id="unlimited" aria-describedby="unlimited-hint" checked={draft.durationSeconds === 0} onCheckedChange={(unlimited) => {
          if (unlimited) setFiniteDuration(draft.durationSeconds)
          setDraft((current) => ({ ...current, durationSeconds: unlimited ? 0 : finiteDuration }))
        }} />
      </Field>
      {draft.durationSeconds !== 0 && <TimeBlock label="Duration" hint="Time unlocked. Minimum one second." {...duration}
        onChange={(h, m, s) => setDraft((current) => ({ ...current, durationSeconds: hmsToSeconds(h, m, s) }))} />}
      <Field orientation="horizontal" className="relative rounded-xl border p-3">
        <FieldContent>
          <FieldLabel htmlFor="session-reminders">Session reminders</FieldLabel>
          <FieldDescription id="session-reminders-hint">Quiet nudges during each visit.</FieldDescription>
        </FieldContent>
        <Switch id="session-reminders" aria-describedby="session-reminders-hint" checked={draft.reminderEnabled}
          onCheckedChange={reminderEnabled => setDraft(current => ({ ...current, reminderEnabled,
            reminderIntervalMinutes: !reminderEnabled && (!Number.isInteger(current.reminderIntervalMinutes) || current.reminderIntervalMinutes < 1 || current.reminderIntervalMinutes > 2147483647) ? 10 : current.reminderIntervalMinutes,
          }))} />
      </Field>
      {draft.reminderEnabled && <>
        <Field className="gap-2" data-invalid={reminderInvalid || undefined}>
          <FieldLabel htmlFor="reminder-minutes">Remind me every (minutes)</FieldLabel>
          <Input id="reminder-minutes" type="number" min={1} max={2147483647} step={1}
            aria-invalid={reminderInvalid || undefined}
            value={Number.isNaN(draft.reminderIntervalMinutes) ? "" : draft.reminderIntervalMinutes}
            aria-describedby="reminder-minutes-hint"
            onChange={event => setDraft(current => ({ ...current, reminderIntervalMinutes: event.target.valueAsNumber }))} />
          <FieldDescription id="reminder-minutes-hint" className="sr-only">Enter a positive whole number of minutes. Waiting time does not count.</FieldDescription>
        </Field>
        {!services.loading && !services.error && !services.data.notifications && <Alert><AlertDescription>
          Notifications are disabled. Enable them to receive session reminders; your waiting pauses still work.
          <Button type="button" variant="outline" onClick={() => { void services.openSettings("notifications").catch(() => {}) }}>Enable notifications</Button>
        </AlertDescription></Alert>}
        {services.error && <Alert variant="destructive"><AlertDescription>
          Couldn't check notification permission: {services.error.message}
          <Button type="button" variant="outline" onClick={services.refresh}>Retry</Button>
        </AlertDescription></Alert>}
        {services.settingsError && <Alert variant="destructive"><AlertDescription>
          Couldn't open Android settings: {services.settingsError.message}
          <Button type="button" variant="outline" onClick={() => { void services.openSettings("notifications").catch(() => {}) }}>Retry</Button>
        </AlertDescription></Alert>}
      </>}
    </FieldGroup>
  )
}

function TimeBlock({ label, hint, h, m, s, onChange }: {
  label: string; hint: string; h: number; m: number; s: number
  onChange: (h: number, m: number, s: number) => void
}) {
  const [values, setValues] = useState({ h: String(h), m: String(m), s: String(s) })

  function change(part: keyof typeof values, value: string) {
    const next = { ...values, [part]: value }
    setValues(next)
    const hours = Number(next.h), minutes = Number(next.m), seconds = Number(next.s)
    if (Object.values(next).every((text) => text.trim() !== "" && Number.isInteger(Number(text))) &&
      hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59 &&
      hmsToSeconds(hours, minutes, seconds) >= 1) {
      onChange(hours, minutes, seconds)
    }
  }

  return (
    <FieldSet className="min-w-0 gap-2 rounded-xl border p-3">
      <FieldLegend className="mb-1">{label}</FieldLegend>
      <FieldDescription>{hint}</FieldDescription>
      <FieldGroup className="grid grid-cols-3 gap-2">
        <NumberField label="Hours" value={values.h} max={23} onChange={(value) => change("h", value)} />
        <NumberField label="Minutes" value={values.m} max={59} onChange={(value) => change("m", value)} />
        <NumberField label="Seconds" value={values.s} min={Number(values.h) === 0 && Number(values.m) === 0 ? 1 : 0} max={59} onChange={(value) => change("s", value)} />
      </FieldGroup>
    </FieldSet>
  )
}

function NumberField({ label, value, min = 0, max, onChange }: {
  label: string; value: string; min?: number; max: number; onChange: (value: string) => void
}) {
  const id = useId()
  const invalid = value.trim() === "" || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max
  return (
    <Field className="min-w-0 gap-1" data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type="number" inputMode="numeric" required min={min} max={max} step={1} value={value}
        aria-invalid={invalid} aria-describedby={`${id}-hint${invalid ? ` ${id}-error` : ""}`}
        onFocus={(e) => e.currentTarget.select()} onChange={(e) => onChange(e.target.value)} />
      <FieldDescription id={`${id}-hint`} className="sr-only">{min}–{max}</FieldDescription>
      {invalid && <FieldError id={`${id}-error`}>Enter a whole number from {min} to {max}.</FieldError>}
    </Field>
  )
}

export function StageMessages({ draft, setDraft }: { draft: FrictionAppDraft; setDraft: DraftSetter }) {
  return (
    <FieldGroup className="gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">Friction messages</h3>
        <p className="text-sm text-muted-foreground">Gentle reminders shown during the countdown.</p>
      </div>
      {draft.messages.map((message, index) => (
        <Field key={index} className="gap-2">
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
  return <Textarea id={id} ref={ref} rows={2} value={value} onChange={(e) => onChange(e.target.value)}
    placeholder="A gentle nudge…" className="min-w-0 resize-none overflow-hidden wrap-anywhere" />
}
