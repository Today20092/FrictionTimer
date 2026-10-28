import type { FrictionApp, FrictionAppDefaults, FrictionAppDraft } from "@/lib/friction"

export type Stage = 0 | 1 | 2

export const DEFAULT_DRAFT: FrictionAppDraft = {
  appId: "",
  name: "",
  waitSeconds: 20,
  durationSeconds: 300,
  returnGraceSeconds: 30,
  reminderEnabled: false,
  reminderIntervalMinutes: 10,
  messages: ["Do you really need to open this?", "Take a breath."],
}

export function secondsToHMS(total: number) {
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

export function hmsToSeconds(h: number, m: number, s: number) {
  return Math.max(0, h * 3600 + m * 60 + s)
}

export function draftFromApp(app: FrictionApp): FrictionAppDraft {
  return {
    appId: app.appId,
    name: app.name,
    waitSeconds: app.waitSeconds,
    durationSeconds: app.durationSeconds,
    returnGraceSeconds: app.returnGraceSeconds,
    messages: [...app.messages],
    reminderEnabled: app.reminderEnabled,
    reminderIntervalMinutes: app.reminderIntervalMinutes,
  }
}

export function applyDefaultsToDraft(draft: FrictionAppDraft, defaults: FrictionAppDefaults): FrictionAppDraft {
  return {
    ...draft,
    ...(defaults.waitSeconds === undefined ? {} : { waitSeconds: defaults.waitSeconds }),
    ...(defaults.durationSeconds === undefined ? {} : { durationSeconds: defaults.durationSeconds }),
    ...(defaults.returnGraceSeconds === undefined ? {} : { returnGraceSeconds: defaults.returnGraceSeconds }),
    ...(defaults.messages === undefined ? {} : { messages: [...defaults.messages] }),
    ...(defaults.sessionReminders === undefined ? {} : {
      reminderEnabled: defaults.sessionReminders.enabled,
      reminderIntervalMinutes: defaults.sessionReminders.intervalMinutes,
    }),
  }
}

export function sanitizeDraft(draft: FrictionAppDraft): FrictionAppDraft {
  return {
    ...draft,
    waitSeconds: Math.max(1, draft.waitSeconds),
    durationSeconds: Math.max(0, draft.durationSeconds),
    messages: draft.messages.map((message) => message.trim()).filter(Boolean),
  }
}
