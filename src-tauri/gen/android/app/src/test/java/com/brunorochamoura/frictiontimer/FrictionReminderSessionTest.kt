package com.brunorochamoura.frictiontimer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class FrictionReminderSessionTest {
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
    assertEquals("app", foreground.onForegroundObserved("app").packageToEvaluateForOverlay)
  }
}
