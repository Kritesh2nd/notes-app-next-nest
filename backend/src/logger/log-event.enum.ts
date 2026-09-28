/**
 * Canonical event names. Keeping these as an enum (rather than free-text
 * strings scattered through services) means log queries/alerts can filter on
 * `event` reliably, and this file doubles as the single source of truth for
 * "which events does this app log".
 */
export enum LogEvent {
  APP_STARTED = "App started",
  DATABASE_CONNECTED = "Database connected",
  USER_REGISTERED = "User registered",
  LOGIN_SUCCESSFUL = "Login successful",
  LOGIN_FAILED = "Login failed",
  NOTE_CREATED = "Note created",
  NOTE_READ = "Note read",
  NOTE_UPDATED = "Note updated",
  NOTE_DELETED = "Note deleted",
  UNAUTHORIZED_ACCESS = "Unauthorized access",
  ADMIN_ACTION = "Admin action",
  DATABASE_FAILURE = "Database failure",
  UNEXPECTED_EXCEPTION = "Unexpected exception",
}
