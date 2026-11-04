function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Builds the connection URL from the same DB_* variables the application
 * uses, so the connection settings live in exactly one place.
 */
export function databaseUrl(): string {
  const user = encodeURIComponent(required('DB_USER'));
  const password = encodeURIComponent(required('DB_PASSWORD'));
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = encodeURIComponent(required('DB_NAME'));

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
