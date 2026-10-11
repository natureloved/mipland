import { afterEach, describe, expect, it, vi } from "vitest";

import { entryFromFile, getMipIndex, parseFrontMatter } from "@/lib/mip-index";
import snapshot from "@/lib/mip-index-snapshot.json";

const MIP_8 = `---
mip: 8
title: Page-ified Storage State
description: Something
author: Category Labs
discussions-to:
status: Final
type: Standards Track
---

## Abstract
status: not front matter
`;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseFrontMatter", () => {
  it("reads fields from the front matter only, including after an empty value", () => {
    const fields = parseFrontMatter(MIP_8);
    expect(fields.title).toBe("Page-ified Storage State");
    expect(fields.status).toBe("Final");
    expect(fields["discussions-to"]).toBe("");
  });

  it("returns nothing without a front matter block", () => {
    expect(parseFrontMatter("# MIP-8\nstatus: Final")).toEqual({});
  });
});

describe("entryFromFile", () => {
  it("builds MIP and MRC entries with canonical mips.monad.xyz links", () => {
    expect(entryFromFile("MIPs/MIP-8.md", MIP_8)).toEqual({
      kind: "MIP",
      number: 8,
      title: "Page-ified Storage State",
      status: "Final",
      specUrl: "https://mips.monad.xyz/MIPs/MIP-8",
    });
    expect(entryFromFile("MRCs/MRC-13.md", MIP_8)?.specUrl).toBe(
      "https://mips.monad.xyz/MRCs/MRC-13",
    );
  });

  it("ignores templates and other files", () => {
    expect(entryFromFile("mip-template.md", MIP_8)).toBeNull();
    expect(entryFromFile("MIPs/README.md", MIP_8)).toBeNull();
  });
});

describe("getMipIndex", () => {
  it("reads the tree, then each file, sorted by number", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/git/trees/")) {
          return Response.json({
            tree: [
              { path: "MIPs/MIP-8.md", type: "blob" },
              { path: "MRCs/MRC-13.md", type: "blob" },
              { path: "mip-template.md", type: "blob" },
            ],
          });
        }
        return new Response(url.endsWith("MRC-13.md") ? MIP_8.replace("mip: 8", "mip: 13") : MIP_8);
      }),
    );
    const index = await getMipIndex();
    expect(index.source).toBe("github");
    expect(index.entries.map((e) => `${e.kind}-${e.number}`)).toEqual(["MIP-8", "MRC-13"]);
  });

  it("falls back to the snapshot when GitHub fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    const index = await getMipIndex();
    expect(index.source).toBe("snapshot");
    expect(index.entries).toHaveLength(snapshot.entries.length);
  });
});
