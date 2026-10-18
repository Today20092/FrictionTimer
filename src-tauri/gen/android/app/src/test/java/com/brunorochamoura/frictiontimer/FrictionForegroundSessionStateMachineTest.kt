package com.brunorochamoura.frictiontimer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FrictionForegroundSessionStateMachineTest {
  @Test
  fun unlimitedSessionEndsOnlyAfterConfirmedExitAndReentryIsEvaluated() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.example.app")
    stateMachine.onUnlimitedSessionStarted("com.example.app")
    stateMachine.onOverlayDismissed()

    assertEquals(null, stateMachine.onForegroundObserved("com.example.app").packageToEvaluateForOverlay)
    stateMachine.onForegroundObserved("com.android.launcher")
    stateMachine.onForegroundObserved(null)
    stateMachine.onForegroundObserved("com.example.app")
    assertEquals("com.example.app", stateMachine.unlimitedSessionPackage)

    assertTrue(stateMachine.onForegroundObserved("com.android.launcher").shouldRecheckForeground)
    val exit = stateMachine.onForegroundObserved("com.android.launcher")
    assertFalse(exit.dismissActiveOverlay)
    assertEquals(null, stateMachine.unlimitedSessionPackage)
    assertEquals("com.example.app", stateMachine.onForegroundObserved("com.example.app").packageToEvaluateForOverlay)
  }

  @Test
  fun differentForegroundNeedsConfirmationBeforeDismissal() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.instagram.android")

    val firstObservation = stateMachine.onForegroundObserved("com.android.launcher")
    val secondObservation = stateMachine.onForegroundObserved("com.android.launcher")

    assertFalse(firstObservation.dismissActiveOverlay)
    assertTrue(firstObservation.shouldRecheckForeground)
    assertTrue(secondObservation.dismissActiveOverlay)
    assertEquals("com.android.launcher", secondObservation.packageToEvaluateForOverlay)
  }

  @Test
  fun launchNoiseDoesNotDismissOverlayWhenTrackedAppRemainsForeground() {
    val stateMachine = FrictionForegroundSessionStateMachine()
    stateMachine.onOverlayShown("com.instagram.android")

    val transientLauncherObservation = stateMachine.onForegroundObserved("com.android.launcher")
    val trackedAppObservation = stateMachine.onForegroundObserved("com.instagram.android")

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

    stateMachine.onForegroundObserved("com.android.launcher")
    val nullObservation = stateMachine.onForegroundObserved(null)
    val nextLauncherObservation = stateMachine.onForegroundObserved("com.android.launcher")

    assertFalse(nullObservation.dismissActiveOverlay)
    assertFalse(nullObservation.shouldRecheckForeground)
    assertFalse(nextLauncherObservation.dismissActiveOverlay)
    assertTrue(nextLauncherObservation.shouldRecheckForeground)
  }
}
