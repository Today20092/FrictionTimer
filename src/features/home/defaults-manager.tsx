import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { applyAppDefaults, setAppDefaults, useAppDefaults, useApps, type FrictionApp, type FrictionAppDefaults, type FrictionAppDraft } from "@/lib/friction"
import { DEFAULT_DRAFT, applyDefaultsToDraft, draftFromApp, hmsToSeconds, secondsToHMS } from "@/components/app-form/utils"
import { StageMessages, TimeBlock } from "@/components/app-form/stages"

type DefaultField = "wait" | "duration" | "messages" | "reminders"
type EnabledFields = Record<DefaultField, boolean>

const FIELD_LABELS: Record<DefaultField, string> = {
  wait: "Wait time",
  duration: "Duration",
  messages: "Countdown messages",
  reminders: "Session reminders",
}

function enabledFromDefaults(defaults: FrictionAppDefaults): EnabledFields {
  return {
    wait: defaults.waitSeconds !== undefined,
    duration: defaults.durationSeconds !== undefined,
    messages: defaults.messages !== undefined,
    reminders: defaults.sessionReminders !== undefined,
  }
}

function fieldsFromDefaults(defaults: FrictionAppDefaults): FrictionAppDefaults {
  return {
    ...(defaults.waitSeconds === undefined ? {} : { waitSeconds: defaults.waitSeconds }),
    ...(defaults.durationSeconds === undefined ? {} : { durationSeconds: defaults.durationSeconds }),
    ...(defaults.messages === undefined ? {} : { messages: defaults.messages }),
    ...(defaults.sessionReminders === undefined ? {} : { sessionReminders: defaults.sessionReminders }),
  }
}

function selectedDefaults(draft: FrictionAppDraft, enabled: EnabledFields): FrictionAppDefaults {
  return {
    ...(enabled.wait ? { waitSeconds: draft.waitSeconds } : {}),
    ...(enabled.duration ? { durationSeconds: draft.durationSeconds } : {}),
    ...(enabled.messages ? { messages: draft.messages } : {}),
    ...(enabled.reminders ? { sessionReminders: {
      enabled: draft.reminderEnabled,
      intervalMinutes: draft.reminderIntervalMinutes,
    } } : {}),
  }
}

function validDefaults(defaults: FrictionAppDefaults) {
  return defaults.waitSeconds === undefined || (Number.isInteger(defaults.waitSeconds) && defaults.waitSeconds >= 1)
    ? defaults.durationSeconds === undefined || (Number.isInteger(defaults.durationSeconds) && defaults.durationSeconds >= 0)
      ? defaults.sessionReminders === undefined || (Number.isInteger(defaults.sessionReminders.intervalMinutes) && defaults.sessionReminders.intervalMinutes >= 1 && defaults.sessionReminders.intervalMinutes <= 2147483647)
      : false
    : false
}

export function DefaultsManager({ onBack }: { onBack: () => void }) {
  const apps = useApps()
  const stored = useAppDefaults()
  const initialized = useRef(false)
  const [draft, setDraft] = useState<FrictionAppDraft>(DEFAULT_DRAFT)
  const [enabled, setEnabled] = useState<EnabledFields>({ wait: false, duration: false, messages: false, reminders: false })
  const [sourceAppId, setSourceAppId] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedCount, setAppliedCount] = useState<number | null>(null)

  useEffect(() => {
    if (stored.loading || initialized.current) return
    initialized.current = true
    setDraft(current => applyDefaultsToDraft(current, stored.data))
    setEnabled(enabledFromDefaults(stored.data))
  }, [stored.data, stored.loading])

  const activeDefaults = fieldsFromDefaults(stored.data)
  const outgoingDefaults = selectedDefaults(draft, enabled)
  const settingsDirty = JSON.stringify(outgoingDefaults) !== JSON.stringify(activeDefaults)
  const remindersInvalid = enabled.reminders && (!Number.isInteger(draft.reminderIntervalMinutes) || draft.reminderIntervalMinutes < 1 || draft.reminderIntervalMinutes > 2147483647)
  const saveDisabled = stored.loading || !!stored.error || saving || !validDefaults(outgoingDefaults) || remindersInvalid
  const allSelected = apps.data.length > 0 && selectedIds.length === apps.data.length

  useEffect(() => setAppliedCount(null), [settingsDirty])

  function copyFromApp(app: FrictionApp) {
    setDraft(draftFromApp(app))
    setSourceAppId(app.id)
  }

  async function saveDefaults() {
    setSaving(true)
    setError(null)
    setAppliedCount(null)
    try {
      await setAppDefaults(outgoingDefaults)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function applyDefaultsToApps() {
    setApplying(true)
    setError(null)
    try {
      const count = await applyAppDefaults(selectedIds, activeDefaults)
      setAppliedCount(count)
      setConfirmApply(false)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : String(applyError))
    } finally {
      setApplying(false)
    }
  }

  function toggleApp(id: string, checked: boolean) {
    setSelectedIds(current => checked ? [...new Set([...current, id])] : current.filter(item => item !== id))
    setAppliedCount(null)
    setError(null)
  }

  const targetNames = apps.data.filter(app => selectedIds.includes(app.id)).map(app => app.name)
  const appliedFieldLabels = (Object.keys(FIELD_LABELS) as DefaultField[])
    .filter(field => activeDefaults[
      field === "wait" ? "waitSeconds" : field === "duration" ? "durationSeconds" : field === "messages" ? "messages" : "sessionReminders"
    ] !== undefined)
    .map(field => FIELD_LABELS[field])

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">App defaults</h2>
          <p className="text-sm text-muted-foreground">New apps use these settings. Existing apps change only when you apply them below.</p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
      </div>

      {stored.error && <Alert variant="destructive"><AlertDescription>
        Couldn't load app defaults: {stored.error.message} <Button type="button" variant="outline" onClick={stored.refresh}>Retry</Button>
      </AlertDescription></Alert>}
      {apps.error && <Alert variant="destructive"><AlertDescription>
        Couldn't load saved apps: {apps.error.message} <Button type="button" variant="outline" onClick={apps.refresh}>Retry</Button>
      </AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {appliedCount !== null && <Alert><AlertDescription>Updated {appliedCount} {appliedCount === 1 ? "app" : "apps"}.</AlertDescription></Alert>}

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <Field className="gap-2">
          <FieldLabel htmlFor="defaults-source">Copy values from a saved app</FieldLabel>
          <select id="defaults-source" value={sourceAppId} onChange={event => {
            const app = apps.data.find(item => item.id === event.target.value)
            if (app) copyFromApp(app)
            else setSourceAppId("")
          }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Choose an app…</option>
            {apps.data.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}
          </select>
          <FieldDescription>Choose which settings to keep as defaults below.</FieldDescription>
        </Field>

        <FieldGroup className="gap-3">
          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-wait">Use a default wait time</FieldLabel></FieldContent>
            <Switch id="default-wait" checked={enabled.wait} onCheckedChange={wait => setEnabled(current => ({ ...current, wait }))} />
          </Field>
          <TimeBlock label="Default wait time" hint="Pause before opening. Minimum one second." {...secondsToHMS(draft.waitSeconds)}
            onChange={(h, m, s) => setDraft(current => ({ ...current, waitSeconds: hmsToSeconds(h, m, s) }))} />

          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-duration">Use a default duration</FieldLabel></FieldContent>
            <Switch id="default-duration" checked={enabled.duration} onCheckedChange={duration => setEnabled(current => ({ ...current, duration }))} />
          </Field>
          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-unlimited">Unlimited duration</FieldLabel></FieldContent>
            <Switch id="default-unlimited" checked={draft.durationSeconds === 0} onCheckedChange={unlimited => setDraft(current => ({ ...current, durationSeconds: unlimited ? 0 : Math.max(1, current.durationSeconds || 300) }))} />
          </Field>
          {draft.durationSeconds !== 0 && <TimeBlock label="Default duration" hint="Time unlocked. Minimum one second." {...secondsToHMS(draft.durationSeconds)}
            onChange={(h, m, s) => setDraft(current => ({ ...current, durationSeconds: hmsToSeconds(h, m, s) }))} />}

          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-messages">Use default countdown messages</FieldLabel></FieldContent>
            <Switch id="default-messages" checked={enabled.messages} onCheckedChange={messages => setEnabled(current => ({ ...current, messages }))} />
          </Field>
          <StageMessages draft={draft} setDraft={setDraft} />

          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-reminders">Use default session reminders</FieldLabel><FieldDescription>Includes whether reminders are on and their interval.</FieldDescription></FieldContent>
            <Switch id="default-reminders" checked={enabled.reminders} onCheckedChange={reminders => setEnabled(current => ({ ...current, reminders }))} />
          </Field>
          <Field orientation="horizontal" className="rounded-xl border p-3">
            <FieldContent><FieldLabel htmlFor="default-reminders-on">Session reminders</FieldLabel></FieldContent>
            <Switch id="default-reminders-on" checked={draft.reminderEnabled} onCheckedChange={reminderEnabled => setDraft(current => ({ ...current, reminderEnabled }))} />
          </Field>
          <Field className="gap-2" data-invalid={remindersInvalid || undefined}>
            <FieldLabel htmlFor="default-reminder-minutes">Remind me every (minutes)</FieldLabel>
            <Input id="default-reminder-minutes" type="number" min={1} max={2147483647} step={1} value={Number.isNaN(draft.reminderIntervalMinutes) ? "" : draft.reminderIntervalMinutes}
              aria-invalid={remindersInvalid || undefined} onChange={event => setDraft(current => ({ ...current, reminderIntervalMinutes: event.target.valueAsNumber }))} />
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void saveDefaults()} disabled={saveDisabled}>
            {saving ? "Saving…" : "Save defaults"}
          </Button>
          <Button type="button" variant="outline" onClick={() => {
            setDraft(applyDefaultsToDraft(DEFAULT_DRAFT, stored.data))
            setEnabled(enabledFromDefaults(stored.data))
            setError(null)
          }} disabled={stored.loading || saving}>Discard edits</Button>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Apply to existing apps</h3>
              <p className="text-sm text-muted-foreground">Uses the saved defaults above; unticked settings stay unchanged.</p>
            </div>
            {apps.data.length > 0 && <Button type="button" variant="outline" onClick={() => setSelectedIds(allSelected ? [] : apps.data.map(app => app.id))}>
              {allSelected ? "Clear selection" : "Select all"}
            </Button>}
          </div>
          {apps.loading ? <p className="text-sm text-muted-foreground">Loading apps…</p> : apps.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add an app before applying defaults.</p>
          ) : <FieldGroup className="gap-2">
            {apps.data.map(app => <Field key={app.id} orientation="horizontal" className="rounded-xl border p-3">
              <FieldContent><FieldLabel htmlFor={`apply-${app.id}`}>{app.name}</FieldLabel><FieldDescription>{app.appId}</FieldDescription></FieldContent>
              <Switch id={`apply-${app.id}`} checked={selectedIds.includes(app.id)} onCheckedChange={checked => toggleApp(app.id, checked)} />
            </Field>)}
          </FieldGroup>}
          {settingsDirty && <p className="text-sm text-muted-foreground">Save your default changes before applying them.</p>}
          <Button type="button" variant="outline" disabled={selectedIds.length === 0 || appliedFieldLabels.length === 0 || apps.loading || !!apps.error || !!stored.error || settingsDirty} onClick={() => setConfirmApply(true)}>
            Apply to {selectedIds.length || "selected"} {selectedIds.length === 1 ? "app" : "apps"}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmApply} onOpenChange={open => !applying && setConfirmApply(open)}>
        <AlertDialogContent aria-busy={applying}>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply defaults to {selectedIds.length} {selectedIds.length === 1 ? "app" : "apps"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This changes {appliedFieldLabels.join(", ")} for {targetNames.join(", ")}. Other settings stay as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={applying} onClick={event => {
              event.preventDefault()
              void applyDefaultsToApps()
            }}>{applying ? "Applying…" : "Apply settings"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
