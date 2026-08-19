interface Fetcher {
  fetch(input: Request): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
}
