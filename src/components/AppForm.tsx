import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export function AppForm({ initial }: { initial?: FrictionApp }) {
  const navigate = useNavigate()
  const { data: existingApps } = useApps()
  const mutations = useAppMutations()
  const isEdit = !!initial

  const [stage, setStage] = useState<Stage>(0)
  const [draft, setDraft] = useState<FrictionAppDraft>(() =>
    initial ? draftFromApp(initial) : DEFAULT_DRAFT,
  )
  const coveredAppIds = new Set(
    existingApps
      .filter((app) => app.id !== initial?.id)
      .map((app) => app.appId),
  )
  const appAlreadyCovered = draft.appId !== initial?.appId && coveredAppIds.has(draft.appId)

  async function save() {
    if (!draft.appId || appAlreadyCovered || mutations.saving) return
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
    <div className="flex min-w-0 flex-col gap-6">
      <Stepper stage={stage} />

      {stage === 0 && (
        <StageApp
          draft={draft}
          setDraft={setDraft}
          isEdit={isEdit}
          coveredAppIds={coveredAppIds}
          currentAppId={initial?.appId}
        />
      )}
      {stage === 1 && <StageTime draft={draft} setDraft={setDraft} />}
      {stage === 2 && <StageMessages draft={draft} setDraft={setDraft} />}

      {appAlreadyCovered && (
        <Alert><AlertDescription>
          That app is already covered by another saved entry. Choose a different app to continue.
        </AlertDescription></Alert>
      )}

      {mutations.error && (
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
            <Button
              type="button"
              onClick={handleDelete}
              disabled={mutations.saving}
              variant="destructive"
            >
              Delete
            </Button>
          )}
          {stage < 2 ? (
            <Button
              type="button"
              disabled={!draft.appId || appAlreadyCovered}
              onClick={() => setStage((stage + 1) as Stage)}
            >
              Next →
            </Button>
          ) : (
            <Button
              type="button"
              onClick={save}
              disabled={mutations.saving || appAlreadyCovered}
            >
              {mutations.saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          )}
        </div>
      </div>
    </div>
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
