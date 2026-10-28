// Domain types — keep these stable; swapping the backing driver shouldn't change them.

export type FrictionApp = {
  id: string;
  appId: string; // e.g. com.instagram.android
  name: string; // human readable
  waitSeconds: number; // wait before unlock
  durationSeconds: number; // 0 = unlimited session with a return window; otherwise seconds
  returnGraceSeconds: number; // allowed time away from an unlimited session; 0 disables it
  messages: string[]; // lines shown during wait
  reminderEnabled: boolean;
  reminderIntervalMinutes: number;
};

export type ServiceStatus = {
  overlay: boolean;
  accessibility: boolean;
  notifications: boolean;
};

export type ServicePermissionKey = keyof ServiceStatus;

export type InstalledApp = {
  appId: string;
  name: string;
};

export type FrictionAppDraft = Omit<FrictionApp, "id">;

export type FrictionAppDefaults = {
  waitSeconds?: number;
  durationSeconds?: number;
  returnGraceSeconds?: number;
  messages?: string[];
  sessionReminders?: { enabled: boolean; intervalMinutes: number };
};
