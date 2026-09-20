import dns from "node:dns";
import fs from "node:fs";
import postgres from "postgres";

dns.setDefaultResultOrder("ipv4first");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const sql = postgres(env.DATABASE_URL, { connect_timeout: 10, prepare: false, ssl: "require" });

const columns = await sql`
  select table_name, column_name
  from information_schema.columns
  where table_schema = ${"public"}
    and table_name in (${"service_items"}, ${"service_categories"}, ${"destinations"})
  order by table_name, ordinal_position
`;
const categories = await sql`select * from service_categories order by id`;
const destinations = await sql`select * from destinations order by id`;
const items = await sql`
  select id, slug, city, name_zh, category, category_id, status, destination_id
  from service_items
  order by id
`;

console.log(JSON.stringify({ columns, destinations, categories, items }, null, 2));
await sql.end();
