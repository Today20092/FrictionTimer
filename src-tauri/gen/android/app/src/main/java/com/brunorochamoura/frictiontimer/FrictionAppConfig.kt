package com.brunorochamoura.frictiontimer

data class FrictionAppConfig(
  val appId: String,
  val name: String,
  val waitSeconds: Long,
  val durationSeconds: Long,
  val messages: List<String>,
  val reminderEnabled: Boolean = false,
  val reminderIntervalMinutes: Long = 10L,
)
