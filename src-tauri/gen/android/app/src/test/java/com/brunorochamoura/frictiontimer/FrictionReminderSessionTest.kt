package com.brunorochamoura.frictiontimer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class FrictionReminderSessionTest {
  @Test
  fun unresolvedForegroundEndsVisitButSystemWindowsOnlyPauseIt() {
    val session = FrictionReminderSession()
    session.start("app", 0L)
    assertEquals(true, session.observeForeground(null, true, 300_000L))
    assertNull(session.reminderMinutes(900_000L, 10))
    assertEquals(true, session.observeForeground("app", false, 900_000L))
    assertNull(session.reminderMinutes(1_199_999L, 10))
    assertEquals(10L, session.reminderMinutes(1_200_000L, 10))
    assertEquals(false, session.observeForeground(null, false, 1_201_000L))
    assertNull(session.appId)
    assertNull(session.reminderMinutes(2_000_000L, 10))
    session.start("app", 2_000_000L)
    assertEquals(false, session.observeForeground("other", true, 2_001_000L))
    assertNull(session.appId)
  }

  @Test
  fun remindersRepeatAtIntervalBoundariesWithoutDuplicating() {
    val session = FrictionReminderSession()
    session.start("app", 5_000L)
    assertNull(session.reminderMinutes(604_999L, 10))
    assertEquals(10L, session.reminderMinutes(605_000L, 10))
    assertNull(session.reminderMinutes(605_001L, 10))
    assertEquals(20L, session.reminderMinutes(1_205_000L, 10))
  }

  @Test
  fun leavingOrScreenOffResetsVisitAndWaitingDoesNotCount() {
    val session = FrictionReminderSession()
    assertNull(session.reminderMinutes(600_000L, 10))
    session.start("first", 600_000L)
    session.start("first", 900_000L)
    assertEquals(10L, session.reminderMinutes(1_200_000L, 10))
    session.reset()
    assertNull(session.reminderMinutes(2_000_000L, 10))
    session.start("second", 2_000_000L)
    assertNull(session.reminderMinutes(2_599_999L, 10))
    assertEquals(10L, session.reminderMinutes(2_600_000L, 10))
  }

  @Test
  fun screenOffEndsAnUnlimitedForegroundVisit() {
    val foreground = FrictionForegroundSessionStateMachine()
    foreground.onUnlimitedSessionStarted("app")
    foreground.onScreenOff()
    assertNull(foreground.unlimitedSessionPackage)
    assertEquals("app", foreground.onForegroundObserved("app", 0L).packageToEvaluateForOverlay)
  }
}
