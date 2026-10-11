import "server-only";

import snapshot from "./mip-index-snapshot.json";

// Index of every proposal in monad-crypto/MIPs, read from each file's front
// matter so statuses never have to be copied by hand. Refreshed at most once a
// day; if GitHub is unreachable the committed snapshot is served instead.

const REPO = "monad-crypto/MIPs";
const BRANCH = "main";
const SITE = "https://mips.monad.xyz";
export const REVALIDATE_SECONDS = 86_400;

const FILE_PATTERN = /^(MIPs\/MIP|MRCs\/MRC)-(\d+)\.md$/;

export interface MipIndexEntry {
  kind: "MIP" | "MRC";
  number: number;
  title: string;
  status: string;
  /** Canonical page on mips.monad.xyz. */
  specUrl: string;
}

export interface MipIndex {
  entries: MipIndexEntry[];
  source: "github" | "snapshot";
}

/** Reads `key: value` pairs from a leading `---` front matter block. */
export function parseFrontMatter(markdown: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (pair) fields[pair[1].toLowerCase()] = pair[2].trim();
  }
  return fields;
}

export function entryFromFile(path: string, markdown: string): MipIndexEntry | null {
  const file = FILE_PATTERN.exec(path);
  if (!file) return null;
  const kind = file[1].endsWith("MRC") ? "MRC" : "MIP";
  const number = Number(file[2]);
  const { title, status } = parseFrontMatter(markdown);
  if (!title || !status) return null;
  return {
    kind,
    number,
    title,
    status,
    specUrl: `${SITE}/${kind}s/${kind}-${number}`,
  };
}

export function sortEntries(entries: MipIndexEntry[]): MipIndexEntry[] {
  return [...entries].sort((a, b) => a.number - b.number);
}

async function fetchOk(url: string, headers: HeadersInit = {}): Promise<Response> {
  const res = await fetch(url, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
  return res;
}

async function fetchFromGitHub(): Promise<MipIndexEntry[]> {
  const token = process.env.GITHUB_TOKEN;
  // One API call lists the files; contents come from raw.githubusercontent.com,
  // which does not count against the API rate limit.
  const tree = (await (
    await fetchOk(
      `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
      {
        Accept: "application/vnd.github+json",
        "User-Agent": "mipland-index",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    )
  ).json()) as { tree?: { path: string; type: string }[] };

  const paths = (tree.tree ?? [])
    .filter((node) => node.type === "blob" && FILE_PATTERN.test(node.path))
    .map((node) => node.path);
  if (paths.length === 0) throw new Error("No MIP files found in the tree");

  const entries = await Promise.all(
    paths.map(async (path) => {
      const body = await (
        await fetchOk(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`)
      ).text();
      const entry = entryFromFile(path, body);
      if (!entry) throw new Error(`Missing title or status in ${path}`);
      return entry;
    }),
  );
  return sortEntries(entries);
}

export async function getMipIndex(): Promise<MipIndex> {
  try {
    return { entries: await fetchFromGitHub(), source: "github" };
  } catch (error) {
    console.warn("MIP index: serving snapshot,", error);
    return {
      entries: sortEntries(snapshot.entries as MipIndexEntry[]),
      source: "snapshot",
    };
  }
}
