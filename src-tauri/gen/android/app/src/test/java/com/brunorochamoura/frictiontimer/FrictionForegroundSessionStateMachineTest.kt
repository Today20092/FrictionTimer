package com.brunorochamoura.frictiontimer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FrictionForegroundSessionStateMachineTest {
  @Test
  fun configuredReturnWindowCanBeShortenedExtendedOrDisabled() {
    for ((seconds, returnAtMs, shouldRestore) in listOf(
      Triple(20L, 19_999L, true),
      Triple(20L, 20_000L, false),
      Triple(60L, 45_000L, true),
      Triple(0L, 1L, false),
    )) {
      val stateMachine = FrictionForegroundSessionStateMachine()
      stateMachine.onUnlimitedSessionStarted("app", seconds)
      stateMachine.onForegroundObserved("launcher", 0L)
      stateMachine.onForegroundObserved("launcher", 0L)
      stateMachine.onForegroundObserved("app", returnAtMs)
      assertEquals("Return at $returnAtMs with a $seconds-second window", shouldRestore,
        stateMachine.unlimitedSessionPackage == "app")
    }
  }

  @Test
  fun restoredSessionsKeepTheirOwnConfiguredWindow() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onUnlimitedSessionStarted("first", 5L)
    stateMachine.onForegroundObserved("second", 0L)
    stateMachine.onForegroundObserved("second", 180L)
    stateMachine.onUnlimitedSessionStarted("second", 60L)
    stateMachine.onForegroundObserved("first", 1_000L)
    stateMachine.onForegroundObserved("first", 1_180L)
    assertEquals("first", stateMachine.unlimitedSessionPackage)
    stateMachine.onForegroundObserved("second", 2_000L)
    stateMachine.onForegroundObserved("second", 2_180L)
    assertEquals("second", stateMachine.unlimitedSessionPackage)
    stateMachine.onForegroundObserved("launcher", 3_000L)
    stateMachine.onForegroundObserved("launcher", 3_180L)
    stateMachine.onForegroundObserved("first", 7_180L)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
    stateMachine.onForegroundObserved("second", 50_000L)
    assertEquals("second", stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun unlimitedSessionEndsOnlyAfterConfirmedExitAndReentryIsEvaluated() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.example.app")
    stateMachine.onUnlimitedSessionStarted("com.example.app")
    stateMachine.onOverlayDismissed()

    assertEquals(null, stateMachine.onForegroundObserved("com.example.app", 0L).packageToEvaluateForOverlay)
    stateMachine.onForegroundObserved("com.android.launcher", 0L)
    stateMachine.onForegroundObserved(null, 0L)
    stateMachine.onForegroundObserved("com.example.app", 0L)
    assertEquals("com.example.app", stateMachine.unlimitedSessionPackage)

    assertTrue(stateMachine.onForegroundObserved("com.android.launcher", 0L).shouldRecheckForeground)
    val exit = stateMachine.onForegroundObserved("com.android.launcher", 0L)
    assertFalse(exit.dismissActiveOverlay)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
    assertEquals("com.example.app", stateMachine.onForegroundObserved("com.example.app", 30_000L).packageToEvaluateForOverlay)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun quickReturnRestoresSessionEvenAfterLongForegroundUse() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onUnlimitedSessionStarted("com.example.app")
    stateMachine.onForegroundObserved("com.android.launcher", 600_000L)
    stateMachine.onForegroundObserved("com.android.launcher", 600_180L)

    stateMachine.onForegroundObserved("com.example.app", 630_179L)

    assertEquals("com.example.app", stateMachine.unlimitedSessionPackage)
    assertEquals(null, stateMachine.onForegroundObserved("com.example.app", 700_000L).packageToEvaluateForOverlay)
  }

  @Test
  fun eachConfirmedDepartureStartsANewReturnWindow() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onUnlimitedSessionStarted("com.example.app")
    stateMachine.onForegroundObserved("com.android.launcher", 0L)
    stateMachine.onForegroundObserved("com.android.launcher", 0L)
    stateMachine.onForegroundObserved("com.example.app", 20_000L)
    stateMachine.onForegroundObserved("com.android.launcher", 40_000L)
    stateMachine.onForegroundObserved("com.android.launcher", 40_180L)
    stateMachine.onForegroundObserved("com.example.app", 60_000L)

    assertEquals("com.example.app", stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun switchingBetweenUnlockedAppsPreservesIndependentReturnWindows() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onUnlimitedSessionStarted("com.example.first")
    stateMachine.onForegroundObserved("com.example.second", 0L)
    stateMachine.onForegroundObserved("com.example.second", 180L)
    stateMachine.onOverlayShown("com.example.second")
    stateMachine.onUnlimitedSessionStarted("com.example.second")
    stateMachine.onOverlayDismissed()
    stateMachine.onForegroundObserved("com.example.first", 10_000L)
    stateMachine.onForegroundObserved("com.example.first", 10_180L)
    assertEquals("com.example.first", stateMachine.unlimitedSessionPackage)

    stateMachine.onForegroundObserved("com.example.second", 20_000L)
    stateMachine.onForegroundObserved("com.example.second", 20_180L)
    assertEquals("com.example.second", stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun screenOffClearsActiveSessionAndReturnWindows() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onUnlimitedSessionStarted("com.example.first")
    stateMachine.onForegroundObserved("com.example.second", 0L)
    stateMachine.onForegroundObserved("com.example.second", 180L)
    stateMachine.onUnlimitedSessionStarted("com.example.second")

    stateMachine.onScreenOff()

    stateMachine.onForegroundObserved("com.example.first", 1_000L)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
    stateMachine.onForegroundObserved("com.example.second", 1_000L)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun leavingUnfinishedCountdownDoesNotGrantReturnWindow() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.example.app")
    stateMachine.onForegroundObserved("com.android.launcher", 0L)
    assertTrue(stateMachine.onForegroundObserved("com.android.launcher", 180L).dismissActiveOverlay)
    stateMachine.onOverlayDismissed()

    assertEquals("com.example.app", stateMachine.onForegroundObserved("com.example.app", 1_000L).packageToEvaluateForOverlay)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
  }

  @Test
  fun differentForegroundNeedsConfirmationBeforeDismissal() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.instagram.android")

    val firstObservation = stateMachine.onForegroundObserved("com.android.launcher", 0L)
    val secondObservation = stateMachine.onForegroundObserved("com.android.launcher", 180L)

    assertFalse(firstObservation.dismissActiveOverlay)
    assertTrue(firstObservation.shouldRecheckForeground)
    assertTrue(secondObservation.dismissActiveOverlay)
    assertEquals("com.android.launcher", secondObservation.packageToEvaluateForOverlay)
  }

  @Test
  fun launchNoiseDoesNotDismissOverlayWhenTrackedAppRemainsForeground() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.instagram.android")

    val transientLauncherObservation = stateMachine.onForegroundObserved("com.android.launcher", 0L)
    val trackedAppObservation = stateMachine.onForegroundObserved("com.instagram.android", 180L)

    assertFalse(transientLauncherObservation.dismissActiveOverlay)
    assertTrue(transientLauncherObservation.shouldRecheckForeground)
    assertFalse(trackedAppObservation.dismissActiveOverlay)
    assertFalse(trackedAppObservation.shouldRecheckForeground)
    assertEquals("com.instagram.android", stateMachine.activeOverlayPackage)
  }

  @Test
  fun nullObservationClearsPendingExitConfirmation() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.instagram.android")

    stateMachine.onForegroundObserved("com.android.launcher", 0L)
    val nullObservation = stateMachine.onForegroundObserved(null, 180L)
    val nextLauncherObservation = stateMachine.onForegroundObserved("com.android.launcher", 360L)

    assertFalse(nullObservation.dismissActiveOverlay)
    assertFalse(nullObservation.shouldRecheckForeground)
    assertFalse(nextLauncherObservation.dismissActiveOverlay)
    assertTrue(nextLauncherObservation.shouldRecheckForeground)
  }
}
