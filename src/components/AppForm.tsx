import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { cn } from "cn"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useApps, useAppMutations, type FrictionApp, type FrictionAppDraft } from "@/lib/friction"
import { StageApp, StageMessages, StageTime } from "./app-form/stages"
import {
  DEFAULT_DRAFT,
  draftFromApp,
  sanitizeDraft,
  type Stage,
} from "./app-form/utils"

export function AppForm({ initial, suggestedAppId }: { initial?: FrictionApp; suggestedAppId?: string }) {
  const navigate = useNavigate()
  const { data: existingApps } = useApps()
  const mutations = useAppMutations()
  const isEdit = !!initial

  const [stage, setStage] = useState<Stage>(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<FrictionAppDraft>(() =>
    initial ? draftFromApp(initial) : DEFAULT_DRAFT,
  )
  const coveredAppIds = new Set(
    existingApps
      .filter((app) => app.id !== initial?.id)
      .map((app) => app.appId),
  )
  const appAlreadyCovered = draft.appId !== initial?.appId && coveredAppIds.has(draft.appId)
  const reminderInvalid = !Number.isInteger(draft.reminderIntervalMinutes) || draft.reminderIntervalMinutes < 1 || draft.reminderIntervalMinutes > 2147483647

  async function save() {
    if (!draft.appId || appAlreadyCovered || reminderInvalid || mutations.saving) return
    const clean = sanitizeDraft(draft)

    try {
      if (initial) await mutations.update(initial.id, clean)
      else await mutations.create(clean)
      navigate({ to: "/" })
    } catch {
      /* error surfaced via mutations.error */
    }
  }

  async function handleDelete() {
    if (!initial || mutations.saving) return

    try {
      await mutations.remove(initial.id)
      navigate({ to: "/" })
    } catch {
      /* error surfaced via mutations.error */
    }
  }

  return (
    <form className="flex min-w-0 flex-col gap-6" onSubmit={(event) => {
      event.preventDefault()
      if (!draft.appId || appAlreadyCovered || (stage !== 0 && reminderInvalid) || mutations.saving) return
      if (stage < 2) setStage((stage + 1) as Stage)
      else void save()
    }}>
      <Stepper stage={stage} />

      {stage === 0 && (
        <StageApp
          draft={draft}
          setDraft={setDraft}
          isEdit={isEdit}
          coveredAppIds={coveredAppIds}
          currentAppId={initial?.appId}
          suggestedAppId={suggestedAppId}
        />
      )}
      <fieldset hidden={stage !== 1} disabled={stage !== 1} className="min-w-0">
        <StageTime draft={draft} setDraft={setDraft} />
      </fieldset>
      {stage === 2 && <StageMessages draft={draft} setDraft={setDraft} />}

      {appAlreadyCovered && (
        <Alert><AlertDescription>
          That app is already covered by another saved entry. Choose a different app to continue.
        </AlertDescription></Alert>
      )}
      {reminderInvalid && <Alert variant="destructive"><AlertDescription>
        Enter a whole number from 1 to 2,147,483,647 minutes for session reminders.
      </AlertDescription></Alert>}

      {mutations.error && !confirmDelete && (
        <Alert variant="destructive"><AlertDescription>
          {mutations.error.message}
        </AlertDescription></Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          onClick={() => (stage === 0 ? navigate({ to: "/" }) : setStage((stage - 1) as Stage))}
          disabled={mutations.saving}
          variant="outline"
        >
          {stage === 0 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          {isEdit && stage === 0 && (
            <AlertDialog open={confirmDelete} onOpenChange={(open) => {
              if (mutations.saving) return
              mutations.clearError()
              setConfirmDelete(open)
            }}>
              <AlertDialogTrigger asChild>
                <Button type="button" disabled={mutations.saving} variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent aria-busy={mutations.saving}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove the pause for {initial.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes its saved pause settings and messages. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {mutations.error && <Alert variant="destructive"><AlertDescription>
                  Couldn't remove the pause: {mutations.error.message} Try deleting again.
                </AlertDescription></Alert>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={mutations.saving}>Keep app</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" disabled={mutations.saving} onClick={(event) => {
                    event.preventDefault()
                    void handleDelete()
                  }}>
                    {mutations.saving ? "Deleting…" : "Delete pause"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {stage < 2 ? (
            <Button
              type="submit"
              disabled={!draft.appId || appAlreadyCovered || (stage === 1 && reminderInvalid)}
            >
              Next →
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={mutations.saving || appAlreadyCovered || reminderInvalid}
            >
              {mutations.saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function Stepper({ stage }: { stage: Stage }) {
  return (
    <ol aria-label="Application setup" className="grid grid-cols-3 gap-2">
      {["App", "Timing", "Messages"].map((label, i) => (
        <li key={label} aria-current={i === stage ? "step" : undefined}
          className={cn("flex min-w-0 flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center text-sm", i === stage ? "border-primary bg-primary/10" : "text-muted-foreground")}>
          <Badge variant={i === stage ? "default" : "outline"}>{i + 1}</Badge>
          <span className="max-w-full wrap-anywhere">{label}</span>
        </li>
      ))}
    </ol>
  )
}
