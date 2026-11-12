import { describe, expect, it } from "vitest";
import { JobRegistry } from "../src/jobs";

describe("JobRegistry", () => {
  it("dispatches a registered job and refuses a duplicate name", async () => {
    const registry = new JobRegistry();
    const seen: number[] = [];
    registry.register<{ n: number }>({
      name: "ping",
      async handle(data) {
        seen.push(data.n);
      },
    });

    await registry.dispatch("ping", { n: 1 });

    expect(seen).toEqual([1]);
    expect(registry.names()).toEqual(["ping"]);
    expect(() => registry.register({ name: "ping", async handle() {} })).toThrow(/already registered/);
    await expect(registry.dispatch("missing", {})).rejects.toThrow(/Unknown job/);
  });
});
