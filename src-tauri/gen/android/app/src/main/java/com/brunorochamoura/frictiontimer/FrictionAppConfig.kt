package com.brunorochamoura.frictiontimer

data class FrictionAppConfig(
  val appId: String,
  val name: String,
  val waitSeconds: Long,
  val durationSeconds: Long,
  val messages: List<String>,
  val returnGraceSeconds: Long = 30L,
  val reminderEnabled: Boolean = false,
  val reminderIntervalMinutes: Long = 10L,
)
