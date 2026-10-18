package com.brunorochamoura.frictiontimer

class FrictionReminderSession {
  var appId: String? = null
    private set
  private var startedAtMs = 0L
  private var lastReminderBucket = 0L
  private var pausedAtMs: Long? = null

  fun start(packageName: String, nowMs: Long) {
    if (appId == packageName) return
    appId = packageName
    startedAtMs = nowMs
    lastReminderBucket = 0L
    pausedAtMs = null
  }

  fun reset() {
    appId = null
    lastReminderBucket = 0L
    pausedAtMs = null
  }

  fun observeForeground(packageName: String?, transientSystemWindow: Boolean, nowMs: Long): Boolean {
    if (appId == null) return false
    if (packageName == appId) {
      pausedAtMs?.let { startedAtMs += (nowMs - it).coerceAtLeast(0L) }
      pausedAtMs = null
      return true
    }
    if (packageName == null && transientSystemWindow) {
      if (pausedAtMs == null) pausedAtMs = nowMs
      return true
    }
    reset()
    return false
  }

  fun reminderMinutes(nowMs: Long, intervalMinutes: Long): Long? {
    if (appId == null || pausedAtMs != null || intervalMinutes < 1L) return null
    val elapsedMinutes = (nowMs - startedAtMs).coerceAtLeast(0L) / 60_000L
    val bucket = elapsedMinutes / intervalMinutes
    if (bucket == 0L || bucket <= lastReminderBucket) return null
    lastReminderBucket = bucket
    return elapsedMinutes
  }
}
