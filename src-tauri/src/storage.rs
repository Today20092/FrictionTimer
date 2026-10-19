use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    db_path: PathBuf,
}

impl AppState {
    pub fn new(db_path: PathBuf) -> Self {
        Self { db_path }
    }

    pub fn db_path(&self) -> &Path {
        &self.db_path
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FrictionApp {
    pub id: String,
    pub app_id: String,
    pub name: String,
    pub wait_seconds: i64,
    pub duration_seconds: i64,
    pub messages: Vec<String>,
    pub reminder_enabled: bool,
    pub reminder_interval_minutes: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAppInput {
    pub app_id: String,
    pub name: String,
    pub wait_seconds: i64,
    pub duration_seconds: i64,
    pub messages: Vec<String>,
    #[serde(default)]
    pub reminder_enabled: bool,
    #[serde(default = "default_reminder_interval")]
    pub reminder_interval_minutes: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAppInput {
    pub app_id: Option<String>,
    pub name: Option<String>,
    pub wait_seconds: Option<i64>,
    pub duration_seconds: Option<i64>,
    pub messages: Option<Vec<String>>,
    pub reminder_enabled: Option<bool>,
    pub reminder_interval_minutes: Option<i64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SessionReminderDefaults {
    pub enabled: bool,
    pub interval_minutes: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FrictionAppDefaults {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wait_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_seconds: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub messages: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_reminders: Option<SessionReminderDefaults>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyAppDefaultsInput {
    pub app_ids: Vec<String>,
    pub defaults: FrictionAppDefaults,
}

#[derive(Debug)]
pub enum StorageError {
    Io(std::io::Error),
    Sql(rusqlite::Error),
    Json(serde_json::Error),
    Validation(String),
    NotFound(String),
}

impl std::fmt::Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(err) => write!(f, "{err}"),
            Self::Sql(err) => write!(f, "{err}"),
            Self::Json(err) => write!(f, "{err}"),
            Self::Validation(message) => write!(f, "{message}"),
            Self::NotFound(message) => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for StorageError {}

impl From<std::io::Error> for StorageError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}

impl From<rusqlite::Error> for StorageError {
    fn from(value: rusqlite::Error) -> Self {
        Self::Sql(value)
    }
}

impl From<serde_json::Error> for StorageError {
    fn from(value: serde_json::Error) -> Self {
        Self::Json(value)
    }
}

pub fn initialize_database(db_path: &Path) -> Result<(), StorageError> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut conn = Connection::open(db_path)?;
    let transaction = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
    transaction.execute_batch(
        "CREATE TABLE IF NOT EXISTS friction_apps (
            id TEXT PRIMARY KEY,
            app_id TEXT NOT NULL,
            name TEXT NOT NULL,
            wait_seconds INTEGER NOT NULL,
            duration_seconds INTEGER NOT NULL,
            messages_json TEXT NOT NULL,
            reminder_enabled INTEGER NOT NULL DEFAULT 0,
            reminder_interval_minutes INTEGER NOT NULL DEFAULT 10
        );
        CREATE TABLE IF NOT EXISTS friction_app_defaults (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            wait_seconds INTEGER,
            duration_seconds INTEGER,
            messages_json TEXT,
            reminder_enabled INTEGER,
            reminder_interval_minutes INTEGER,
            CHECK ((reminder_enabled IS NULL) = (reminder_interval_minutes IS NULL))
        );",
    )?;

    let columns = {
        let mut statement =
            transaction.prepare("SELECT name FROM pragma_table_info('friction_apps')")?;
        let rows = statement.query_map([], |row| row.get::<_, String>(0))?;
        rows.collect::<Result<Vec<_>, _>>()?
    };
    if !columns.iter().any(|column| column == "reminder_enabled") {
        transaction.execute_batch(
            "ALTER TABLE friction_apps ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0",
        )?;
    }
    if !columns
        .iter()
        .any(|column| column == "reminder_interval_minutes")
    {
        transaction.execute_batch("ALTER TABLE friction_apps ADD COLUMN reminder_interval_minutes INTEGER NOT NULL DEFAULT 10")?;
    }
    transaction.commit()?;

    Ok(())
}

pub fn list_apps(db_path: &Path) -> Result<Vec<FrictionApp>, StorageError> {
    let conn = open_connection(db_path)?;
    let mut stmt = conn.prepare(
        "SELECT id, app_id, name, wait_seconds, duration_seconds, messages_json, reminder_enabled, reminder_interval_minutes
         FROM friction_apps
         ORDER BY rowid ASC",
    )?;

    let rows = stmt.query_map([], map_row)?;
    let apps = rows.collect::<Result<Vec<_>, _>>()?;
    Ok(apps)
}

pub fn get_app(db_path: &Path, id: &str) -> Result<Option<FrictionApp>, StorageError> {
    let conn = open_connection(db_path)?;
    let app = conn
        .query_row(
            "SELECT id, app_id, name, wait_seconds, duration_seconds, messages_json, reminder_enabled, reminder_interval_minutes
             FROM friction_apps
             WHERE id = ?1",
            [id],
            map_row,
        )
        .optional()?;

    Ok(app)
}

pub fn create_app(db_path: &Path, input: CreateAppInput) -> Result<FrictionApp, StorageError> {
    let app = normalize_create_input(input)?;
    let conn = open_connection(db_path)?;

    conn.execute(
        "INSERT INTO friction_apps
            (id, app_id, name, wait_seconds, duration_seconds, messages_json, reminder_enabled, reminder_interval_minutes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            app.id,
            app.app_id,
            app.name,
            app.wait_seconds,
            app.duration_seconds,
            serde_json::to_string(&app.messages)?,
            app.reminder_enabled,
            app.reminder_interval_minutes,
        ],
    )?;

    Ok(app)
}

pub fn update_app(
    db_path: &Path,
    id: &str,
    patch: UpdateAppInput,
) -> Result<FrictionApp, StorageError> {
    let current = get_app(db_path, id)?
        .ok_or_else(|| StorageError::NotFound(format!("App not found: {id}")))?;
    let next = apply_patch(current, patch)?;
    let conn = open_connection(db_path)?;

    conn.execute(
        "UPDATE friction_apps
         SET app_id = ?2, name = ?3, wait_seconds = ?4, duration_seconds = ?5, messages_json = ?6,
             reminder_enabled = ?7, reminder_interval_minutes = ?8
         WHERE id = ?1",
        params![
            next.id,
            next.app_id,
            next.name,
            next.wait_seconds,
            next.duration_seconds,
            serde_json::to_string(&next.messages)?,
            next.reminder_enabled,
            next.reminder_interval_minutes,
        ],
    )?;

    Ok(next)
}

pub fn delete_app(db_path: &Path, id: &str) -> Result<(), StorageError> {
    let conn = open_connection(db_path)?;
    let rows = conn.execute("DELETE FROM friction_apps WHERE id = ?1", [id])?;
    if rows == 0 {
        return Err(StorageError::NotFound(format!("App not found: {id}")));
    }
    Ok(())
}

pub fn get_app_defaults(db_path: &Path) -> Result<FrictionAppDefaults, StorageError> {
    let conn = open_connection(db_path)?;
    conn.query_row(
        "SELECT wait_seconds, duration_seconds, messages_json, reminder_enabled, reminder_interval_minutes
         FROM friction_app_defaults WHERE id = 1",
        [],
        map_defaults_row,
    )
    .optional()
    .map(|defaults| defaults.unwrap_or_default())
    .map_err(StorageError::from)
}

pub fn set_app_defaults(
    db_path: &Path,
    defaults: FrictionAppDefaults,
) -> Result<FrictionAppDefaults, StorageError> {
    let defaults = normalize_defaults(defaults)?;
    let conn = open_connection(db_path)?;
    conn.execute(
        "INSERT INTO friction_app_defaults
            (id, wait_seconds, duration_seconds, messages_json, reminder_enabled, reminder_interval_minutes)
         VALUES (1, ?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
            wait_seconds = excluded.wait_seconds,
            duration_seconds = excluded.duration_seconds,
            messages_json = excluded.messages_json,
            reminder_enabled = excluded.reminder_enabled,
            reminder_interval_minutes = excluded.reminder_interval_minutes",
        params![
            defaults.wait_seconds,
            defaults.duration_seconds,
            defaults.messages.as_ref().map(serde_json::to_string).transpose()?,
            defaults.session_reminders.as_ref().map(|value| value.enabled),
            defaults.session_reminders.as_ref().map(|value| value.interval_minutes),
        ],
    )?;
    Ok(defaults)
}

pub fn apply_app_defaults(
    db_path: &Path,
    input: ApplyAppDefaultsInput,
) -> Result<usize, StorageError> {
    let defaults = normalize_defaults(input.defaults)?;
    if defaults == FrictionAppDefaults::default() {
        return Err(StorageError::Validation(
            "Select at least one setting to apply".into(),
        ));
    }
    let ids = input
        .app_ids
        .into_iter()
        .collect::<std::collections::HashSet<_>>();
    if ids.is_empty() {
        return Err(StorageError::Validation(
            "Select at least one app to update".into(),
        ));
    }

    let mut conn = open_connection(db_path)?;
    let transaction = conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
    for id in &ids {
        let rows = transaction.execute(
            "UPDATE friction_apps SET
                wait_seconds = COALESCE(?2, wait_seconds),
                duration_seconds = COALESCE(?3, duration_seconds),
                messages_json = COALESCE(?4, messages_json),
                reminder_enabled = COALESCE(?5, reminder_enabled),
                reminder_interval_minutes = COALESCE(?6, reminder_interval_minutes)
             WHERE id = ?1",
            params![
                id,
                defaults.wait_seconds,
                defaults.duration_seconds,
                defaults
                    .messages
                    .as_ref()
                    .map(serde_json::to_string)
                    .transpose()?,
                defaults
                    .session_reminders
                    .as_ref()
                    .map(|value| value.enabled),
                defaults
                    .session_reminders
                    .as_ref()
                    .map(|value| value.interval_minutes),
            ],
        )?;
        if rows == 0 {
            return Err(StorageError::NotFound(format!("App not found: {id}")));
        }
    }
    transaction.commit()?;
    Ok(ids.len())
}

fn open_connection(db_path: &Path) -> Result<Connection, StorageError> {
    initialize_database(db_path)?;
    Ok(Connection::open(db_path)?)
}

fn map_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FrictionApp> {
    let messages_json: String = row.get(5)?;
    let messages = serde_json::from_str(&messages_json).map_err(to_sql_error)?;

    Ok(FrictionApp {
        id: row.get(0)?,
        app_id: row.get(1)?,
        name: row.get(2)?,
        wait_seconds: row.get(3)?,
        duration_seconds: row.get(4)?,
        messages,
        reminder_enabled: row.get(6)?,
        reminder_interval_minutes: row.get(7)?,
    })
}

fn map_defaults_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<FrictionAppDefaults> {
    let messages_json: Option<String> = row.get(2)?;
    let reminder_enabled: Option<bool> = row.get(3)?;
    let reminder_interval_minutes: Option<i64> = row.get(4)?;
    let session_reminders = match (reminder_enabled, reminder_interval_minutes) {
        (Some(enabled), Some(interval_minutes)) => Some(SessionReminderDefaults {
            enabled,
            interval_minutes,
        }),
        _ => None,
    };

    Ok(FrictionAppDefaults {
        wait_seconds: row.get(0)?,
        duration_seconds: row.get(1)?,
        messages: messages_json
            .map(|json| serde_json::from_str(&json).map_err(to_sql_error))
            .transpose()?,
        session_reminders,
    })
}

fn normalize_defaults(
    mut defaults: FrictionAppDefaults,
) -> Result<FrictionAppDefaults, StorageError> {
    if let Some(value) = defaults.wait_seconds {
        defaults.wait_seconds = Some(validate_seconds("waitSeconds", value)?);
    }
    if let Some(value) = defaults.duration_seconds {
        defaults.duration_seconds = Some(validate_duration(value)?);
    }
    if let Some(messages) = defaults.messages.take() {
        defaults.messages = Some(normalize_messages(messages));
    }
    if let Some(reminders) = &defaults.session_reminders {
        validate_reminder_interval(reminders.interval_minutes)?;
    }
    Ok(defaults)
}

fn normalize_create_input(input: CreateAppInput) -> Result<FrictionApp, StorageError> {
    let id = uuid();
    let app_id = validate_required("appId", input.app_id)?;
    let name = validate_required("name", input.name)?;
    let wait_seconds = validate_seconds("waitSeconds", input.wait_seconds)?;
    let duration_seconds = validate_duration(input.duration_seconds)?;
    let messages = normalize_messages(input.messages);
    let reminder_interval_minutes = validate_reminder_interval(input.reminder_interval_minutes)?;

    Ok(FrictionApp {
        id,
        app_id,
        name,
        wait_seconds,
        duration_seconds,
        messages,
        reminder_enabled: input.reminder_enabled,
        reminder_interval_minutes,
    })
}

fn apply_patch(current: FrictionApp, patch: UpdateAppInput) -> Result<FrictionApp, StorageError> {
    let app_id = match patch.app_id {
        Some(value) => validate_required("appId", value)?,
        None => current.app_id,
    };
    let name = match patch.name {
        Some(value) => validate_required("name", value)?,
        None => current.name,
    };
    let wait_seconds = match patch.wait_seconds {
        Some(value) => validate_seconds("waitSeconds", value)?,
        None => current.wait_seconds,
    };
    let duration_seconds = match patch.duration_seconds {
        Some(value) => validate_duration(value)?,
        None => current.duration_seconds,
    };
    let messages = match patch.messages {
        Some(values) => normalize_messages(values),
        None => current.messages,
    };
    let reminder_interval_minutes = match patch.reminder_interval_minutes {
        Some(value) => validate_reminder_interval(value)?,
        None => current.reminder_interval_minutes,
    };

    Ok(FrictionApp {
        id: current.id,
        app_id,
        name,
        wait_seconds,
        duration_seconds,
        messages,
        reminder_enabled: patch.reminder_enabled.unwrap_or(current.reminder_enabled),
        reminder_interval_minutes,
    })
}

fn validate_required(field: &str, value: String) -> Result<String, StorageError> {
    let trimmed = value.trim().to_string();
    if trimmed.is_empty() {
        return Err(StorageError::Validation(format!(
            "{field} must not be empty"
        )));
    }
    Ok(trimmed)
}

fn default_reminder_interval() -> i64 {
    10
}

fn validate_reminder_interval(value: i64) -> Result<i64, StorageError> {
    if !(1..=i32::MAX as i64).contains(&value) {
        return Err(StorageError::Validation(
            "reminderIntervalMinutes must be a whole number between 1 and 2147483647".into(),
        ));
    }
    Ok(value)
}

fn validate_seconds(field: &str, value: i64) -> Result<i64, StorageError> {
    if value < 1 {
        return Err(StorageError::Validation(format!(
            "{field} must be at least 1"
        )));
    }
    Ok(value)
}

fn normalize_messages(messages: Vec<String>) -> Vec<String> {
    messages
        .into_iter()
        .map(|message| message.trim().to_string())
        .filter(|message| !message.is_empty())
        .collect()
}

// Zero means an unlimited foreground session, not a persistent unlock.
fn validate_duration(value: i64) -> Result<i64, StorageError> {
    if value == 0 {
        return Ok(0);
    }
    validate_seconds("durationSeconds", value)
}

fn to_sql_error(err: serde_json::Error) -> rusqlite::Error {
    rusqlite::Error::FromSqlConversionFailure(5, rusqlite::types::Type::Text, Box::new(err))
}

fn uuid() -> String {
    Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_db_path(name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or_default();
        std::env::temp_dir().join(format!("friction-timer-{name}-{unique}.db"))
    }

    fn sample_input() -> CreateAppInput {
        CreateAppInput {
            app_id: " com.instagram.android ".into(),
            name: " Instagram ".into(),
            wait_seconds: 30,
            duration_seconds: 300,
            reminder_enabled: false,
            reminder_interval_minutes: 10,
            messages: vec![
                " Take a breath. ".into(),
                "".into(),
                "Do you need this?".into(),
            ],
        }
    }

    #[test]
    fn reminder_preferences_survive_reopening_and_partial_updates() {
        let db_path = temp_db_path("reminders");
        let input = serde_json::from_value(serde_json::json!({
            "appId": "com.instagram.android", "name": "Instagram",
            "waitSeconds": 10, "durationSeconds": 0, "messages": [],
            "reminderEnabled": true, "reminderIntervalMinutes": 5
        }))
        .unwrap();
        let created = create_app(&db_path, input).unwrap();
        let fetched = get_app(&db_path, &created.id).unwrap().unwrap();
        let json = serde_json::to_value(&fetched).unwrap();
        assert_eq!(json["reminderEnabled"], true);
        assert_eq!(json["reminderIntervalMinutes"], 5);
        let patch = serde_json::from_value(serde_json::json!({"name": "New name"})).unwrap();
        let updated = update_app(&db_path, &created.id, patch).unwrap();
        let json = serde_json::to_value(&updated).unwrap();
        assert_eq!(json["reminderEnabled"], true);
        assert_eq!(json["reminderIntervalMinutes"], 5);
        let patch = serde_json::from_value(serde_json::json!({
            "reminderEnabled": false, "reminderIntervalMinutes": 7
        }))
        .unwrap();
        update_app(&db_path, &created.id, patch).unwrap();
        let fetched = get_app(&db_path, &created.id).unwrap().unwrap();
        assert!(!fetched.reminder_enabled);
        assert_eq!(fetched.reminder_interval_minutes, 7);
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn existing_configurations_migrate_with_reminders_off() {
        let db_path = temp_db_path("reminder-migration");
        let conn = Connection::open(&db_path).unwrap();
        conn.execute_batch("CREATE TABLE friction_apps (
            id TEXT PRIMARY KEY, app_id TEXT NOT NULL, name TEXT NOT NULL,
            wait_seconds INTEGER NOT NULL, duration_seconds INTEGER NOT NULL,
            messages_json TEXT NOT NULL);
            INSERT INTO friction_apps VALUES ('old', 'com.example', 'Example', 30, 300, '[\"Keep focused\"]');").unwrap();
        drop(conn);
        for _ in 0..2 {
            initialize_database(&db_path).unwrap();
            let app = get_app(&db_path, "old").unwrap().unwrap();
            assert!(!app.reminder_enabled);
            assert_eq!(app.reminder_interval_minutes, 10);
            assert_eq!(app.wait_seconds, 30);
            assert_eq!(app.messages, vec!["Keep focused"]);
        }
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn reminder_defaults_and_validation_apply_to_create_and_update() {
        let db_path = temp_db_path("reminder-validation");
        let input = serde_json::from_value(serde_json::json!({
            "appId": "com.example", "name": "Example", "waitSeconds": 1,
            "durationSeconds": 0, "messages": []
        }))
        .unwrap();
        let created = create_app(&db_path, input).unwrap();
        assert!(!created.reminder_enabled);
        assert_eq!(created.reminder_interval_minutes, 10);
        for value in [0, -1, i32::MAX as i64 + 1] {
            let error = create_app(
                &db_path,
                CreateAppInput {
                    reminder_interval_minutes: value,
                    ..sample_input()
                },
            )
            .unwrap_err();
            assert!(error.to_string().contains("reminderIntervalMinutes"));
            let patch = serde_json::from_value(serde_json::json!({
                "reminderIntervalMinutes": value
            }))
            .unwrap();
            assert!(update_app(&db_path, &created.id, patch).is_err());
            assert_eq!(get_app(&db_path, &created.id).unwrap().unwrap(), created);
        }
        assert!(serde_json::from_value::<UpdateAppInput>(serde_json::json!({
            "reminderIntervalMinutes": 1.5
        }))
        .is_err());
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn app_defaults_round_trip_and_apply_only_selected_fields_and_apps() {
        let db_path = temp_db_path("app-defaults");
        let first = create_app(&db_path, sample_input()).unwrap();
        let second = create_app(
            &db_path,
            CreateAppInput {
                app_id: "com.reddit.android".into(),
                name: "Reddit".into(),
                reminder_enabled: true,
                reminder_interval_minutes: 3,
                ..sample_input()
            },
        )
        .unwrap();
        let defaults = FrictionAppDefaults {
            wait_seconds: Some(12),
            session_reminders: Some(SessionReminderDefaults {
                enabled: true,
                interval_minutes: 7,
            }),
            ..FrictionAppDefaults::default()
        };

        set_app_defaults(&db_path, defaults.clone()).unwrap();
        assert_eq!(get_app_defaults(&db_path).unwrap(), defaults);
        assert_eq!(
            apply_app_defaults(
                &db_path,
                ApplyAppDefaultsInput {
                    app_ids: vec![first.id.clone()],
                    defaults,
                },
            )
            .unwrap(),
            1
        );

        let updated = get_app(&db_path, &first.id).unwrap().unwrap();
        assert_eq!(updated.wait_seconds, 12);
        assert_eq!(updated.duration_seconds, first.duration_seconds);
        assert_eq!(updated.messages, first.messages);
        assert!(updated.reminder_enabled);
        assert_eq!(updated.reminder_interval_minutes, 7);
        assert_eq!(get_app(&db_path, &second.id).unwrap().unwrap(), second);
        assert!(apply_app_defaults(
            &db_path,
            ApplyAppDefaultsInput {
                app_ids: vec!["missing".into()],
                defaults: FrictionAppDefaults {
                    wait_seconds: Some(1),
                    ..FrictionAppDefaults::default()
                },
            }
        )
        .is_err());
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn initializes_schema() {
        let db_path = temp_db_path("schema");
        initialize_database(&db_path).unwrap();
        let apps = list_apps(&db_path).unwrap();
        assert!(apps.is_empty());
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn create_list_and_get_round_trip() {
        let db_path = temp_db_path("round-trip");
        let created = create_app(&db_path, sample_input()).unwrap();

        let fetched = get_app(&db_path, &created.id).unwrap().unwrap();
        let listed = list_apps(&db_path).unwrap();

        assert_eq!(created, fetched);
        assert_eq!(listed, vec![created]);
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn partial_update_changes_only_requested_fields() {
        let db_path = temp_db_path("update");
        let created = create_app(&db_path, sample_input()).unwrap();

        let updated = update_app(
            &db_path,
            &created.id,
            UpdateAppInput {
                app_id: None,
                name: Some(" Reddit ".into()),
                wait_seconds: Some(15),
                duration_seconds: None,
                messages: Some(vec![" Stay focused ".into(), "".into()]),
                reminder_enabled: None,
                reminder_interval_minutes: None,
            },
        )
        .unwrap();

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.app_id, created.app_id);
        assert_eq!(updated.name, "Reddit");
        assert_eq!(updated.wait_seconds, 15);
        assert_eq!(updated.duration_seconds, created.duration_seconds);
        assert_eq!(updated.messages, vec!["Stay focused"]);
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn delete_removes_row() {
        let db_path = temp_db_path("delete");
        let created = create_app(&db_path, sample_input()).unwrap();

        delete_app(&db_path, &created.id).unwrap();

        assert!(get_app(&db_path, &created.id).unwrap().is_none());
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn rejects_blank_required_fields() {
        let db_path = temp_db_path("blank-fields");
        let app_id_error = create_app(
            &db_path,
            CreateAppInput {
                app_id: " ".into(),
                ..sample_input()
            },
        )
        .unwrap_err();
        let name_error = create_app(
            &db_path,
            CreateAppInput {
                name: " ".into(),
                ..sample_input()
            },
        )
        .unwrap_err();

        assert!(app_id_error.to_string().contains("appId"));
        assert!(name_error.to_string().contains("name"));
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn rejects_invalid_durations() {
        let db_path = temp_db_path("durations");
        let wait_error = create_app(
            &db_path,
            CreateAppInput {
                wait_seconds: 0,
                ..sample_input()
            },
        )
        .unwrap_err();
        let duration_error = create_app(
            &db_path,
            CreateAppInput {
                duration_seconds: -1,
                ..sample_input()
            },
        )
        .unwrap_err();

        assert!(wait_error.to_string().contains("waitSeconds"));
        assert!(duration_error.to_string().contains("durationSeconds"));
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn trims_and_filters_messages() {
        let db_path = temp_db_path("messages");
        let created = create_app(&db_path, sample_input()).unwrap();

        assert_eq!(
            created.messages,
            vec!["Take a breath.", "Do you need this?"]
        );
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn unlimited_duration_and_multiline_messages_round_trip() {
        let db_path = temp_db_path("unlimited");
        let created = create_app(
            &db_path,
            CreateAppInput {
                duration_seconds: 0,
                messages: vec![" First line\nSecond line ".into()],
                ..sample_input()
            },
        )
        .unwrap();
        let fetched = get_app(&db_path, &created.id).unwrap().unwrap();
        assert_eq!(fetched.duration_seconds, 0);
        assert_eq!(fetched.messages, vec!["First line\nSecond line"]);

        for duration in [300, 0] {
            let updated = update_app(
                &db_path,
                &created.id,
                UpdateAppInput {
                    app_id: None,
                    name: None,
                    wait_seconds: None,
                    duration_seconds: Some(duration),
                    messages: None,
                    reminder_enabled: None,
                    reminder_interval_minutes: None,
                },
            )
            .unwrap();
            assert_eq!(updated.duration_seconds, duration);
            assert_eq!(get_app(&db_path, &created.id).unwrap().unwrap(), updated);
        }
        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn list_preserves_insertion_order() {
        let db_path = temp_db_path("order");
        let first = create_app(
            &db_path,
            CreateAppInput {
                app_id: "com.first".into(),
                name: "First".into(),
                wait_seconds: 10,
                duration_seconds: 20,
                messages: vec![],
                reminder_enabled: false,
                reminder_interval_minutes: 10,
            },
        )
        .unwrap();
        let second = create_app(
            &db_path,
            CreateAppInput {
                app_id: "com.second".into(),
                name: "Second".into(),
                wait_seconds: 30,
                duration_seconds: 40,
                messages: vec![],
                reminder_enabled: false,
                reminder_interval_minutes: 10,
            },
        )
        .unwrap();

        let listed = list_apps(&db_path).unwrap();

        assert_eq!(
            listed.into_iter().map(|app| app.id).collect::<Vec<_>>(),
            vec![first.id, second.id]
        );
        let _ = fs::remove_file(db_path);
    }
}
