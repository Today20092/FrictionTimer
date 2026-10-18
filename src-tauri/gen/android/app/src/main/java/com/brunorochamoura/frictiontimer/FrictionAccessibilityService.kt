package com.brunorochamoura.frictiontimer

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import android.util.Log
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityWindowInfo

class FrictionAccessibilityService : AccessibilityService() {
  private val mainHandler = Handler(Looper.getMainLooper())

  private lateinit var configRepository: FrictionAppConfigRepository
  private lateinit var runtimeState: FrictionRuntimeStateStore
  private lateinit var overlayController: FrictionOverlayController
  private val foregroundSessionState = FrictionForegroundSessionStateMachine()
  private val reminderSession = FrictionReminderSession()
  private lateinit var reminderNotifications: FrictionReminderNotifications
  private val screenOffReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      mainHandler.removeCallbacks(processForegroundRunnable)
      stopReminder()
      foregroundSessionState.onScreenOff()
      dismissOverlay("screen_off")
    }
  }
  private val reminderTick = object : Runnable {
    override fun run() {
      val appId = reminderSession.appId ?: return
      val config = configRepository.findByAppId(appId)
      val screenOn = getSystemService(PowerManager::class.java).isInteractive
      val foreground = resolveForegroundPackage(null)
      val nowMs = SystemClock.elapsedRealtime()
      if (!screenOn || config?.reminderEnabled != true ||
        !reminderSession.observeForeground(foreground, hasTransientSystemWindow(), nowMs)
      ) {
        stopReminder()
        return
      }
      reminderSession.reminderMinutes(nowMs, config.reminderIntervalMinutes)
        ?.let { reminderNotifications.show(config.name, it) }
      mainHandler.postDelayed(this, 1_000L)
    }
  }

  private var launcherPackages: Set<String> = emptySet()
  private var pendingForegroundPackageHint: String? = null
  private val processForegroundRunnable = Runnable {
    processForegroundPackage(pendingForegroundPackageHint)
  }

  override fun onServiceConnected() {
    super.onServiceConnected()

    configRepository = FrictionAppConfigRepository(applicationContext)
    runtimeState = FrictionRuntimeStateStore(applicationContext)
    reminderNotifications = FrictionReminderNotifications(applicationContext)
    registerReceiver(screenOffReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
    overlayController = FrictionOverlayController(
      context = applicationContext,
      windowManager = getSystemService(WINDOW_SERVICE) as WindowManager,
      onProceed = ::handleProceed,
      onCancel = ::handleCancel,
    )
    launcherPackages = resolveLauncherPackages()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val eventType = event?.eventType ?: return
    if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
      eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED
    ) {
      return
    }

    val packageName = event.packageName?.toString()?.trim().orEmpty()
    if (!::overlayController.isInitialized) {
      return
    }

    if (!Settings.canDrawOverlays(this)) {
      stopReminder()
      dismissOverlay("overlay_permission_revoked")
      return
    }

    debugLog {
      "Accessibility event=${eventTypeName(eventType)} packageHint=${packageName.ifBlank { "<none>" }} activeOverlay=${foregroundSessionState.activeOverlayPackage}"
    }
    scheduleForegroundProcessing(packageName)
  }

  override fun onInterrupt() {
    stopReminder()
    if (::overlayController.isInitialized) {
      dismissOverlay("service_interrupted")
    }
  }

  override fun onDestroy() {
    stopReminder()
    if (::reminderNotifications.isInitialized) unregisterReceiver(screenOffReceiver)
    mainHandler.removeCallbacks(processForegroundRunnable)
    if (::overlayController.isInitialized) {
      dismissOverlay("service_destroyed")
    }
    super.onDestroy()
  }

  private fun handleProceed(config: FrictionAppConfig) {
    if (config.durationSeconds == 0L) {
      runtimeState.setCooldownUntil(config.appId, 0L)
      foregroundSessionState.onUnlimitedSessionStarted(config.appId)
    } else {
      runtimeState.setCooldownUntil(
        config.appId,
        FrictionOverlayLogic.cooldownExpiry(System.currentTimeMillis(), config.durationSeconds),
      )
    }
    dismissOverlay("user_proceeded:${config.appId}")
    startReminder(config)
  }

  private fun handleCancel(config: FrictionAppConfig) {
    stopReminder()
    dismissOverlay("user_cancelled:${config.appId}")
    performGlobalAction(GLOBAL_ACTION_HOME)
  }

  private fun scheduleForegroundProcessing(packageHint: String?) {
    pendingForegroundPackageHint = packageHint?.trim()?.ifBlank { null }
    mainHandler.removeCallbacks(processForegroundRunnable)
    mainHandler.postDelayed(processForegroundRunnable, FOREGROUND_SETTLE_DELAY_MS)
  }

  private fun processForegroundPackage(packageHint: String?) {
    if (!getSystemService(PowerManager::class.java).isInteractive) return
    val resolvedPackage = resolveForegroundPackage(packageHint)
    if (reminderSession.appId != null && !reminderSession.observeForeground(
        resolvedPackage, hasTransientSystemWindow(), SystemClock.elapsedRealtime(),
      )) {
      stopReminder()
    }
    debugLog {
      "Processing foreground packageHint=${normalizePackageLabel(packageHint)} resolved=${normalizePackageLabel(resolvedPackage)} root=${normalizePackageLabel(rootInActiveWindow?.packageName?.toString())} state=${foregroundSessionState.debugState()}"
    }

    val transition = foregroundSessionState.onForegroundObserved(resolvedPackage)
    if (transition.dismissActiveOverlay) {
      dismissOverlay("confirmed_foreground_exit:${resolvedPackage ?: "<none>"}")
    }

    if (transition.shouldRecheckForeground) {
      debugLog { "Holding overlay until foreground exit is confirmed" }
      scheduleForegroundProcessing(null)
    }

    maybeShowOverlayFor(transition.packageToEvaluateForOverlay ?: resolvedPackage?.takeIf {
      it == foregroundSessionState.unlimitedSessionPackage
    })
  }

  private fun maybeShowOverlayFor(packageName: String?) {
    if (packageName == null || isIgnoredPackage(packageName)) {
      return
    }

    if (overlayController.isShowingFor(packageName)) {
      return
    }

    val config = configRepository.findByAppId(packageName) ?: return
    val nowMs = System.currentTimeMillis()
    val unlocked = if (config.durationSeconds == 0L) {
      foregroundSessionState.unlimitedSessionPackage == packageName
    } else {
      runtimeState.isInCooldown(packageName, nowMs)
    }
    if (unlocked) {
      startReminder(config)
      return
    }

    val message = runtimeState.nextMessage(
      appId = packageName,
      messages = config.messages,
      fallback = getString(R.string.friction_overlay_fallback_message),
    )

    if (overlayController.show(config, message)) {
      stopReminder()
      foregroundSessionState.onOverlayShown(config.appId)
      debugLog { "Overlay shown for ${config.appId}" }
    }
  }

  private fun resolveForegroundPackage(packageHint: String?): String? {
    resolveForegroundPackageFromWindows()?.let { return it }

    val rootPackage = normalizePackageCandidate(rootInActiveWindow?.packageName?.toString())
    if (rootPackage != null) {
      return rootPackage
    }

    return normalizePackageCandidate(packageHint)
  }

  private fun startReminder(config: FrictionAppConfig) {
    if (!config.reminderEnabled) return
    if (reminderSession.appId == config.appId) return
    stopReminder()
    reminderSession.start(config.appId, SystemClock.elapsedRealtime())
    mainHandler.postDelayed(reminderTick, 1_000L)
  }

  private fun stopReminder() {
    mainHandler.removeCallbacks(reminderTick)
    reminderSession.reset()
    if (::reminderNotifications.isInitialized) reminderNotifications.clear()
  }

  private fun resolveForegroundPackageFromWindows(): String? {
    var bestPackage: String? = null
    var bestScore = Int.MIN_VALUE

    for (window in windows) {
      val packageName = normalizePackageCandidate(window.root?.packageName?.toString()) ?: continue
      val score = foregroundWindowScore(window)
      if (score > bestScore) {
        bestScore = score
        bestPackage = packageName
      }
    }

    return bestPackage
  }

  private fun resolveLauncherPackages(): Set<String> {
    val homeIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
    }

    return packageManager
      .queryIntentActivities(homeIntent, 0)
      .mapNotNull { it.activityInfo?.packageName }
      .toSet()
  }

  private fun isIgnoredPackage(packageName: String): Boolean {
    return packageName == applicationContext.packageName ||
      isTransientSystemPackage(packageName) ||
      launcherPackages.contains(packageName)
  }

  private fun normalizePackageCandidate(packageName: String?): String? {
    val normalized = packageName?.trim().orEmpty()
    return normalized
      .ifBlank { null }
      ?.takeUnless { it == applicationContext.packageName && foregroundSessionState.activeOverlayPackage != null }
      ?.takeUnless(::isTransientSystemPackage)
  }

  private fun isTransientSystemPackage(packageName: String): Boolean {
    return packageName == "android" || packageName == "com.android.systemui"
  }

  private fun hasTransientSystemWindow(): Boolean {
    if (isTransientSystemPackage(rootInActiveWindow?.packageName?.toString().orEmpty())) return true
    return windows.any { window ->
      (window.isActive || window.isFocused) &&
        isTransientSystemPackage(window.root?.packageName?.toString().orEmpty())
    }
  }

  private fun dismissOverlay(reason: String) {
    debugLog { "Dismissing overlay reason=$reason activeOverlay=${foregroundSessionState.activeOverlayPackage}" }
    overlayController.dismiss()
    foregroundSessionState.onOverlayDismissed()
  }

  private fun foregroundWindowScore(window: AccessibilityWindowInfo): Int {
    var score = when (window.type) {
      AccessibilityWindowInfo.TYPE_APPLICATION -> 100
      AccessibilityWindowInfo.TYPE_INPUT_METHOD -> 50
      AccessibilityWindowInfo.TYPE_SYSTEM -> 25
      AccessibilityWindowInfo.TYPE_ACCESSIBILITY_OVERLAY -> 0
      else -> 10
    }

    if (window.isActive) {
      score += 10
    }
    if (window.isFocused) {
      score += 5
    }

    return score
  }

  private fun normalizePackageLabel(packageName: String?): String =
    packageName?.trim().orEmpty().ifBlank { "<none>" }

  private fun eventTypeName(eventType: Int): String = when (eventType) {
    AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> "TYPE_WINDOW_STATE_CHANGED"
    AccessibilityEvent.TYPE_WINDOWS_CHANGED -> "TYPE_WINDOWS_CHANGED"
    else -> eventType.toString()
  }

  private inline fun debugLog(message: () -> String) {
    if (BuildConfig.DEBUG) {
      Log.d(TAG, message())
    }
  }

  companion object {
    private const val FOREGROUND_SETTLE_DELAY_MS = 180L
    private const val TAG = "FrictionAccessSvc"
  }
}
