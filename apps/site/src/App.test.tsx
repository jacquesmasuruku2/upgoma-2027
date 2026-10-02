import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("public site configuration", () => {
  it("does not expose a standalone admin route on the public website", () => {
    const source = readFileSync(resolve(__dirname, "./App.tsx"), "utf8");

    expect(source).not.toContain('path="/admin"');
    expect(source).not.toContain('from "./pages/AdminPage"');
  });
});
