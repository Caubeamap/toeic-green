import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(
  new URL(
    "../src/app/practice/[testId]/start/page.tsx",
    import.meta.url
  ),
  "utf8"
);
const authSource = await readFile(
  new URL("../src/features/auth/services/auth-server.ts", import.meta.url),
  "utf8"
);

test("keeps the auth-aware practice start route out of static generation", () => {
  assert.match(authSource, /await cookies\(\)/);
  assert.doesNotMatch(
    routeSource,
    /export\s+(?:async\s+)?function\s+generateStaticParams\s*\(/,
    "generateStaticParams conflicts with request cookies and can publish a cached /500 page on Vercel"
  );
});
