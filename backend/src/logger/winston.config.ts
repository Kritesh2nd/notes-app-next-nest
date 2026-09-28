import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";

// Ensure the logs directory exists before winston's File transports try to write to it.
const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable line for the console: "2026-09-27T12:00:00.000Z INFO  [AuthService] Login successful — user=abc@x.com"
const consoleFormat = printf(({ level, message, timestamp: ts, context, event, ...meta }) => {
  const ctx = context ? `[${context}]` : "";
  const ev = event ? `(${event}) ` : "";
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} ${level.toUpperCase().padEnd(5)} ${ctx} ${ev}${message}${rest}`;
});

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), errors({ stack: true })),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
    // All INFO+ events, one JSON object per line — easy to ship to a log aggregator.
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // WARN + ERROR only, kept separate so incidents are easy to find.
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "warn",
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
};
