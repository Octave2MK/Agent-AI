import fs from "node:fs/promises";
import { LIVE_FILES } from "@/lib/dataSources";

export const runtime = "nodejs";

type Source = keyof typeof LIVE_FILES; // "inbox" | "meetings" | "candidates"

function isValidSource(s: string): s is Source {
  return s === "inbox" || s === "meetings" || s === "candidates";
}

/**
 * POST /api/sync/inbox      → payload attendu : MockEmail[]
 * POST /api/sync/meetings   → payload attendu : MockMeeting[]
 * POST /api/sync/candidates → payload attendu : { candidates: MockCandidate[], jobs: MockJobPosting[] }
 *
 * Le payload est écrit tel quel dans src/data/live-<source>.json.
 * Appelez ce endpoint depuis un workflow n8n à intervalle régulier.
 *
 * Auth basique via header x-sync-secret (env var SYNC_SECRET).
 * Si SYNC_SECRET n'est pas défini : endpoint ouvert (mode dev uniquement — à sécuriser en prod).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  if (!isValidSource(source)) {
    return Response.json(
      { error: `Source invalide. Utilisez inbox, meetings ou candidates.` },
      { status: 400 }
    );
  }

  const expectedSecret = process.env.SYNC_SECRET;
  if (expectedSecret) {
    const provided = req.headers.get("x-sync-secret");
    if (provided !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  // Validation basique (structure par source)
  if (source === "inbox" || source === "meetings") {
    if (!Array.isArray(payload)) {
      return Response.json(
        { error: `Pour ${source}, le payload doit être un array` },
        { status: 400 }
      );
    }
  } else if (source === "candidates") {
    const p = payload as { candidates?: unknown; jobs?: unknown };
    if (!p || typeof p !== "object" || !Array.isArray(p.candidates) || !Array.isArray(p.jobs)) {
      return Response.json(
        { error: `Pour candidates, le payload doit avoir { candidates: [], jobs: [] }` },
        { status: 400 }
      );
    }
  }

  try {
    await fs.writeFile(LIVE_FILES[source], JSON.stringify(payload, null, 2), "utf-8");
    return Response.json({
      success: true,
      source,
      wroteTo: LIVE_FILES[source],
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/sync]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur écriture" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/<source> : supprime le fichier live, retour au mock.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  if (!isValidSource(source)) {
    return Response.json({ error: "Source invalide" }, { status: 400 });
  }

  const expectedSecret = process.env.SYNC_SECRET;
  if (expectedSecret) {
    const provided = req.headers.get("x-sync-secret");
    if (provided !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await fs.unlink(LIVE_FILES[source]);
    return Response.json({ success: true, source, reset: "mock" });
  } catch {
    return Response.json({ success: true, source, reset: "already mock" });
  }
}

/**
 * GET /api/sync/<source> : retourne le statut de la source (live ou mock, dernière mise à jour).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  if (!isValidSource(source)) {
    return Response.json({ error: "Source invalide" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(LIVE_FILES[source]);
    return Response.json({
      source,
      live: true,
      lastUpdated: stat.mtime.toISOString(),
      size: stat.size,
    });
  } catch {
    return Response.json({ source, live: false });
  }
}
