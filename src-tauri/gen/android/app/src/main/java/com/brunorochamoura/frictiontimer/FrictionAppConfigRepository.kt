package com.brunorochamoura.frictiontimer

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.os.Build
import android.util.Log
import org.json.JSONArray
import java.io.File

class FrictionAppConfigRepository(private val context: Context) {
  fun findByAppId(appId: String): FrictionAppConfig? {
    val dbFile = resolveDatabaseFile()
    if (!dbFile.exists()) {
      return null
    }

    var db: SQLiteDatabase? = null
    return try {
      db = SQLiteDatabase.openDatabase(dbFile.path, null, SQLiteDatabase.OPEN_READONLY)
      db.rawQuery(
        """
        SELECT *
        FROM friction_apps
        WHERE app_id = ?
        LIMIT 1
        """.trimIndent(),
        arrayOf(appId),
      ).use { cursor ->
        if (!cursor.moveToFirst()) {
          return null
        }

        val waitSeconds = cursor.getLong(cursor.getColumnIndexOrThrow("wait_seconds"))
        val durationSeconds = cursor.getLong(cursor.getColumnIndexOrThrow("duration_seconds"))
        if (waitSeconds < 1L || durationSeconds < 0L) {
          return null
        }

        FrictionAppConfig(
          appId = cursor.getString(cursor.getColumnIndexOrThrow("app_id")),
          name = cursor.getString(cursor.getColumnIndexOrThrow("name")),
          waitSeconds = waitSeconds,
          durationSeconds = durationSeconds,
          returnGraceSeconds = cursor.getColumnIndex("return_grace_seconds")
            .let { if (it >= 0) cursor.getLong(it).coerceIn(0L, Int.MAX_VALUE.toLong()) else 30L },
          messages = parseMessages(cursor.getString(cursor.getColumnIndexOrThrow("messages_json"))),
          reminderEnabled = cursor.getColumnIndex("reminder_enabled").let { it >= 0 && cursor.getInt(it) != 0 },
          reminderIntervalMinutes = cursor.getColumnIndex("reminder_interval_minutes")
            .let { if (it >= 0) cursor.getLong(it).coerceAtLeast(1L) else 10L },
        )
      }
    } catch (ex: Exception) {
      Log.w(TAG, "Failed to read tracked app config for $appId", ex)
      null
    } finally {
      db?.close()
    }
  }

  private fun resolveDatabaseFile(): File {
    val dataDir = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      context.dataDir
    } else {
      File(context.applicationInfo.dataDir)
    }

    return File(dataDir, DB_NAME)
  }

  private fun parseMessages(messagesJson: String?): List<String> {
    if (messagesJson.isNullOrBlank()) {
      return emptyList()
    }

    return try {
      val array = JSONArray(messagesJson)
      val messages = buildList {
        for (index in 0 until array.length()) {
          add(array.optString(index))
        }
      }

      FrictionOverlayLogic.sanitizeMessages(messages)
    } catch (ex: Exception) {
      Log.w(TAG, "Failed to parse friction messages JSON", ex)
      emptyList()
    }
  }

  companion object {
    private const val TAG = "FrictionAppConfigRepo"
    private const val DB_NAME = "friction-timer.db"
  }
}
