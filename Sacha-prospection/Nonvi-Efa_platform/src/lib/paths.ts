import path from "node:path";

// process.cwd() = Nonvi-Efa-platform/. On remonte d'un cran pour taper le repo racine.
export const REPO_ROOT = path.resolve(process.cwd(), "..");

export const PATHS = {
  agents: path.join(REPO_ROOT, ".claude", "agents"),
  briefs: path.join(REPO_ROOT, "briefs"),
  content: path.join(REPO_ROOT, "content"),
  promptsImages: path.join(REPO_ROOT, "prompts-images"),
  decks: path.join(REPO_ROOT, "decks"),
  analytics: path.join(REPO_ROOT, "analytics"),
  gmail: path.join(REPO_ROOT, "gmail"),
  meetings: path.join(REPO_ROOT, "meetings"),
  hiring: path.join(REPO_ROOT, "hiring"),
  propositions: path.join(REPO_ROOT, "propositions"),
  compta: path.join(REPO_ROOT, "compta"),
  clients: path.join(REPO_ROOT, "clients"),
  creatives: path.join(REPO_ROOT, "creatives"),
};

export const DELIVERABLE_FOLDERS: Record<string, { abs: string; rel: string }> = {
  strategiste: { abs: PATHS.briefs, rel: "briefs" },
  "createur-contenu": { abs: PATHS.content, rel: "content" },
  designer: { abs: PATHS.promptsImages, rel: "prompts-images" },
  presentateur: { abs: PATHS.decks, rel: "decks" },
  analyste: { abs: PATHS.analytics, rel: "analytics" },
  gmail: { abs: PATHS.gmail, rel: "gmail" },
  fireflies: { abs: PATHS.meetings, rel: "meetings" },
  proposition: { abs: PATHS.propositions, rel: "propositions" },
  cv: { abs: PATHS.hiring, rel: "hiring" },
  comptabilite: { abs: PATHS.compta, rel: "compta" },
};
