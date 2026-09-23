import { getValidAccessToken } from "./google";

/**
 * Client Google Drive natif.
 * Doc : https://developers.google.com/drive/api/reference/rest/v3/files/list
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconUrl?: string;
  webViewLink?: string;
  modifiedTime: string;
  createdTime?: string;
  size?: number;
  owner?: string;
  shared?: boolean;
  starred?: boolean;
  parents?: string[];
}

export interface DriveSnapshot {
  files: DriveFile[];
  totalFetched: number;
  fetchedAt: string;
}

async function driveGet<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API ${res.status} (${path}) : ${body.slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRecentDriveFiles(maxResults = 30): Promise<DriveSnapshot> {
  type Resp = {
    files?: {
      id: string;
      name: string;
      mimeType: string;
      iconLink?: string;
      webViewLink?: string;
      modifiedTime: string;
      createdTime?: string;
      size?: string;
      owners?: { displayName?: string; emailAddress?: string }[];
      shared?: boolean;
      starred?: boolean;
      parents?: string[];
      trashed?: boolean;
    }[];
  };

  const fields = encodeURIComponent(
    "files(id,name,mimeType,iconLink,webViewLink,modifiedTime,createdTime,size,owners,shared,starred,parents,trashed)"
  );
  const q = encodeURIComponent("trashed=false");

  const data = await driveGet<Resp>(
    `/files?pageSize=${maxResults}&orderBy=modifiedTime desc&fields=${fields}&q=${q}`
  );

  const files: DriveFile[] = (data.files ?? [])
    .filter((f) => !f.trashed)
    .map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      iconUrl: f.iconLink,
      webViewLink: f.webViewLink,
      modifiedTime: f.modifiedTime,
      createdTime: f.createdTime,
      size: f.size ? parseInt(f.size, 10) : undefined,
      owner: f.owners?.[0]?.displayName ?? f.owners?.[0]?.emailAddress,
      shared: f.shared,
      starred: f.starred,
      parents: f.parents,
    }));

  return {
    files,
    totalFetched: files.length,
    fetchedAt: new Date().toISOString(),
  };
}

/** Catégorise un mimeType vers une étiquette lisible */
export function labelForMime(mime: string): string {
  if (mime.includes("folder")) return "Dossier";
  if (mime.includes("document")) return "Doc";
  if (mime.includes("spreadsheet")) return "Sheet";
  if (mime.includes("presentation")) return "Slides";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("image")) return "Image";
  if (mime.includes("video")) return "Vidéo";
  if (mime.includes("audio")) return "Audio";
  if (mime.includes("zip") || mime.includes("tar")) return "Archive";
  return "Fichier";
}

/** Rendu markdown compact pour injecter dans le contexte des agents */
export function renderDriveForPrompt(snap: DriveSnapshot): string {
  const top = snap.files.slice(0, 20);
  return `## Google Drive — ${snap.files.length} fichiers récents

${top
  .map(
    (f, i) =>
      `${i + 1}. **${f.name}** (${labelForMime(f.mimeType)}) — modifié ${new Date(f.modifiedTime).toLocaleDateString("fr-FR")}${f.webViewLink ? ` · ${f.webViewLink}` : ""}`
  )
  .join("\n")}`;
}
