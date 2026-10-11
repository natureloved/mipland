import { describe, expect, it } from "vitest";
import en from "./en";
import { callerN, type Frame } from "@/components/mip18/CallStackSection";

const frames: Frame[] = [
  { via: "tx", code: "Wallet", self: "Wallet", sender: "alice" },
  { via: "CALL", code: "Vault", self: "Vault", sender: "Wallet" },
  { via: "DELEGATECALL", code: "VaultLib", self: "Vault", sender: "Wallet" },
  { via: "CALL", code: "Token", self: "Token", sender: "Vault" },
];

describe("MIP-18 CALLERN", () => {
  it("matches CALLER at n = 0 and ORIGIN at n = depth", () => {
    expect(callerN(frames, 3, 0)).toBe("Vault");
    expect(callerN(frames, 3, 3)).toBe("alice");
    expect(callerN(frames, 0, 0)).toBe("alice");
  });

  it("repeats the caller across a DELEGATECALL frame", () => {
    expect(callerN(frames, 3, 1)).toBe("Wallet");
    expect(callerN(frames, 3, 2)).toBe("Wallet");
  });

  it("returns 0 (null) past the top of the stack", () => {
    expect(callerN(frames, 3, 4)).toBeNull();
    expect(callerN(frames, 0, 1)).toBeNull();
  });
});

describe("MIP-18 copy", () => {
  it("states Review status and no activation", () => {
    expect(en.mip18.hero.desc).toContain("in Review and is not active on any network");
    expect(en.footer.mip18Note).toContain("October 11, 2026");
  });

  it("MIP-7 no longer claims every selector is unassigned", () => {
    expect(en.mip7.takeaways.card3Desc).toContain("MIP-18");
    expect(en.footer.mip7Note).not.toContain("All ~220 selectors are currently unassigned");
  });
});
