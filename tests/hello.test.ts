import { describe, it, expect } from "vitest";
import { hello } from "../src/lib/utils/hello";

describe("hello", () => {
  it("returns a greeting with the given name", () => {
    expect(hello("World")).toBe("Hello, World!");
  });

  it("handles empty string", () => {
    expect(hello("")).toBe("Hello, !");
  });
});
