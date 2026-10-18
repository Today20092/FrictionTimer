package com.brunorochamoura.frictiontimer.theme

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import com.brunorochamoura.frictiontimer.FrictionTheme

@TauriPlugin
class ThemePlugin(private val activity: Activity) : Plugin(activity) {
  @Command
  fun getTheme(invoke: Invoke) {
    try {
      val theme = FrictionTheme.read(activity)
      if (theme == null) invoke.resolve() else invoke.resolveObject(theme)
    } catch (ex: Exception) {
      invoke.reject(ex.message, ex)
    }
  }
}
