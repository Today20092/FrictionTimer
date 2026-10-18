package com.brunorochamoura.frictiontimer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

class FrictionReminderNotifications(private val context: Context) {
  private val manager = context.getSystemService(NotificationManager::class.java)

  init {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, context.getString(R.string.reminder_channel_name), NotificationManager.IMPORTANCE_LOW).apply {
        setSound(null, null)
        enableVibration(false)
      })
    }
    clear()
  }

  fun show(name: String, minutes: Long) {
    if (!areEnabled(context)) return
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      Notification.Builder(context).setPriority(Notification.PRIORITY_LOW)
    }
    try {
      manager.notify(NOTIFICATION_ID, builder
        .setSmallIcon(android.R.drawable.ic_popup_reminder)
        .setContentTitle(context.getString(R.string.reminder_title))
        .setContentText(context.getString(R.string.reminder_message, name, minutes))
        .setOnlyAlertOnce(true)
        .setShowWhen(false)
        .build())
    } catch (_: SecurityException) {
      // Permission can be revoked between the check and notification delivery.
    }
  }

  fun clear() = manager.cancel(NOTIFICATION_ID)

  companion object {
    private const val CHANNEL_ID = "session_reminders"
    private const val NOTIFICATION_ID = 1001

    fun areEnabled(context: Context): Boolean {
      val manager = context.getSystemService(NotificationManager::class.java)
      if (!manager.areNotificationsEnabled()) return false
      return Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
        manager.getNotificationChannel(CHANNEL_ID)?.importance != NotificationManager.IMPORTANCE_NONE
    }
  }
}
