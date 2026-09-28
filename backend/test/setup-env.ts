// Runs before any test file: deterministic config, no real SMTP / DB / log files.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.ADMIN_EMAIL = "admin@test.dev";
process.env.ADMIN_PASSWORD = "Admin@12345";
process.env.ADMIN_NAME = "Test Admin";
process.env.SMTP_HOST = "";
