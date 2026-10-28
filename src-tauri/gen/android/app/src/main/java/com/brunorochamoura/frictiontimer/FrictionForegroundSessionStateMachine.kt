package com.brunorochamoura.frictiontimer

data class FrictionForegroundTransition(
  val dismissActiveOverlay: Boolean = false,
  val packageToEvaluateForOverlay: String? = null,
  val shouldRecheckForeground: Boolean = false,
)

class FrictionForegroundSessionStateMachine(
  private val exitConfirmationObservations: Int = DEFAULT_EXIT_CONFIRMATION_OBSERVATIONS,
) {
  var activeOverlayPackage: String? = null
    private set

  var unlimitedSessionPackage: String? = null
    private set

  private data class ReturningSession(val expiresAtMs: Long, val graceMs: Long)
  private val returningSessions = mutableMapOf<String, ReturningSession>()
  private var returnGraceMs = 0L

  fun onUnlimitedSessionStarted(packageName: String, returnGraceSeconds: Long = 30L) {
    unlimitedSessionPackage = packageName
    returnGraceMs = returnGraceSeconds.coerceIn(0L, Int.MAX_VALUE.toLong()) * 1_000L
    returningSessions.remove(packageName)
    clearPendingExit()
  }

  fun onScreenOff() {
    unlimitedSessionPackage = null
    returningSessions.clear()
    clearPendingExit()
  }

  private var pendingExitPackage: String? = null
  private var pendingExitObservations: Int = 0

  fun onOverlayShown(packageName: String) {
    activeOverlayPackage = packageName
    clearPendingExit()
  }

  fun onOverlayDismissed() {
    activeOverlayPackage = null
    clearPendingExit()
  }

  fun onForegroundObserved(packageName: String?, nowMs: Long): FrictionForegroundTransition {
    returningSessions.entries.removeAll { it.value.expiresAtMs <= nowMs }
    val activePackage = activeOverlayPackage ?: unlimitedSessionPackage
    if (activePackage == null) {
      clearPendingExit()
      restoreReturningSession(packageName)
      return FrictionForegroundTransition(packageToEvaluateForOverlay = packageName)
    }

    if (packageName == null || packageName == activePackage) {
      clearPendingExit()
      return FrictionForegroundTransition()
    }

    if (packageName == pendingExitPackage) {
      pendingExitObservations += 1
    } else {
      pendingExitPackage = packageName
      pendingExitObservations = 1
    }

    if (pendingExitObservations < exitConfirmationObservations) {
      return FrictionForegroundTransition(shouldRecheckForeground = true)
    }

    clearPendingExit()
    unlimitedSessionPackage?.let {
      if (returnGraceMs > 0L) returningSessions[it] = ReturningSession(nowMs + returnGraceMs, returnGraceMs)
    }
    unlimitedSessionPackage = null
    restoreReturningSession(packageName)
    return FrictionForegroundTransition(
      dismissActiveOverlay = activeOverlayPackage != null,
      packageToEvaluateForOverlay = packageName,
    )
  }

  fun debugState(): String =
    "activeOverlayPackage=$activeOverlayPackage, pendingExitPackage=$pendingExitPackage, pendingExitObservations=$pendingExitObservations"

  private fun restoreReturningSession(packageName: String?) {
    if (packageName != null) {
      returningSessions.remove(packageName)?.let {
        unlimitedSessionPackage = packageName
        returnGraceMs = it.graceMs
      }
    }
  }

  private fun clearPendingExit() {
    pendingExitPackage = null
    pendingExitObservations = 0
  }

  companion object {
    private const val DEFAULT_EXIT_CONFIRMATION_OBSERVATIONS = 2
  }
}
