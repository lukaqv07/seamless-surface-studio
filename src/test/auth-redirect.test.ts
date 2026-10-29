import { describe, expect, it } from "vitest";

import { fallbackName, targetPath } from "@/lib/auth";

// Where a sign-in may send the visitor, and what name a member is shown by.
// Both rules came from the user's request: posting needs an account, and the
// account's own name is shown instead of an e-mail address.
describe("sign-in helpers", () => {
  it("sends a visitor who came from the writing page to that page", () => {
    expect(targetPath("/nova")).toBe("/nova");
  });

  it("never honours a foreign or unexpected redirect target", () => {
    expect(targetPath("https://evil.example/x")).toBe("/");
    expect(targetPath("/objava/123")).toBe("/");
    expect(targetPath(undefined)).toBe("/");
  });

  it("shows a member by the name before the @ in their e-mail", () => {
    expect(fallbackName("luka.test@biljeznica.app")).toBe("luka.test");
  });

  it("falls back to a neutral name when there is no e-mail to read", () => {
    expect(fallbackName("")).toBe("Netko");
    expect(fallbackName("@biljeznica.app")).toBe("Netko");
  });
});
