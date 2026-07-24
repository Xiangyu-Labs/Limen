// Bootstrap loaded before test modules to set up the test environment.
// Does not override a caller-provided DATABASE_URL.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/limen_test';
}
