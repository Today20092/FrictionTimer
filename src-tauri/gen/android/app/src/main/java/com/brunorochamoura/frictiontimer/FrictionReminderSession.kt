package com.brunorochamoura.frictiontimer

class FrictionReminderSession {
  var appId: String? = null
    private set
  private var startedAtMs = 0L
  private var lastReminderBucket = 0L

  fun start(packageName: String, nowMs: Long) {
    if (appId == packageName) return
    appId = packageName
    startedAtMs = nowMs
    lastReminderBucket = 0L
  }

  fun reset() {
    appId = null
    lastReminderBucket = 0L
  }

  fun reminderMinutes(nowMs: Long, intervalMinutes: Long): Long? {
    if (appId == null || intervalMinutes < 1L) return null
    val elapsedMinutes = (nowMs - startedAtMs).coerceAtLeast(0L) / 60_000L
    val bucket = elapsedMinutes / intervalMinutes
    if (bucket == 0L || bucket <= lastReminderBucket) return null
    lastReminderBucket = bucket
    return elapsedMinutes
  }
}
