import { describe, expect, it } from "vitest";
import { formatCount, formatDuration, titleCase } from "./format";

describe("format helpers", () => {
  it("formats counts, durations, and titles", () => {
    expect(formatCount(1, "paper")).toBe("1 paper");
    expect(formatCount(2, "paper")).toBe("2 papers");
    expect(formatDuration(900)).toBe("900 ms");
    expect(formatDuration(1200)).toBe("1.2 s");
    expect(formatDuration(61_000)).toBe("1m 1s");
    expect(titleCase("semantic clustering")).toBe("Semantic Clustering");
  });
});
