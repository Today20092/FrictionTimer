package com.brunorochamoura.frictiontimer

import android.content.Context
import android.content.res.Configuration
import android.view.ContextThemeWrapper
import com.google.android.material.color.DynamicColors
import com.google.android.material.color.MaterialColors
import com.google.android.material.R as MaterialR

data class SystemThemeResponse(
  val dark: Boolean,
  val colors: Map<String, String>,
)

object FrictionTheme {
  fun dynamicContext(context: Context): Context? {
    if (!DynamicColors.isDynamicColorAvailable()) return null
    return DynamicColors.wrapContextIfAvailable(
      ContextThemeWrapper(context, MaterialR.style.Theme_Material3_DayNight_NoActionBar),
      MaterialR.style.ThemeOverlay_Material3_DynamicColors_DayNight,
    )
  }

  fun read(context: Context): SystemThemeResponse? {
    val themed = dynamicContext(context) ?: return null
    val attributes = mapOf(
      "background" to android.R.attr.colorBackground,
      "foreground" to MaterialR.attr.colorOnBackground,
      "card" to MaterialR.attr.colorSurface,
      "card-foreground" to MaterialR.attr.colorOnSurface,
      "popover" to MaterialR.attr.colorSurface,
      "popover-foreground" to MaterialR.attr.colorOnSurface,
      "primary" to MaterialR.attr.colorPrimary,
      "primary-foreground" to MaterialR.attr.colorOnPrimary,
      "secondary" to MaterialR.attr.colorSecondaryContainer,
      "secondary-foreground" to MaterialR.attr.colorOnSecondaryContainer,
      "muted" to MaterialR.attr.colorSurfaceVariant,
      "muted-foreground" to MaterialR.attr.colorOnSurfaceVariant,
      "accent" to MaterialR.attr.colorTertiaryContainer,
      "accent-foreground" to MaterialR.attr.colorOnTertiaryContainer,
      "destructive" to MaterialR.attr.colorError,
      "destructive-foreground" to MaterialR.attr.colorOnError,
      "border" to MaterialR.attr.colorOutlineVariant,
      "input" to MaterialR.attr.colorOutline,
      "ring" to MaterialR.attr.colorPrimary,
      "aqua" to MaterialR.attr.colorTertiary,
      "orange" to MaterialR.attr.colorSecondary,
    )
    return SystemThemeResponse(
      dark = context.resources.configuration.uiMode and
        Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES,
      colors = attributes.mapValues { (_, attr) ->
        val color = MaterialColors.getColor(themed, attr, "FrictionTheme")
        String.format(java.util.Locale.ROOT, "#%06X", color and 0xFFFFFF)
      },
    )
  }
}
