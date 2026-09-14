/**
 * Connecteur Fireflies natif — pas de n8n, appels API directs depuis le backend Next.js.
 *
 * Configuration :
 *   FIREFLIES_API_KEY=xxxxx  (dans .env.local)
 *
 * Documentation : https://docs.fireflies.ai/graphql-api/query/transcripts
 */

import type { MockMeeting } from "@/data/mockMeetings";

const FIREFLIES_ENDPOINT = "https://api.fireflies.ai/graphql";

interface FirefliesTranscript {
  id: string;
  title: string;
  date: number; // epoch ms
  duration: number; // seconds
  participants: string[];
  summary?: {
    overview?: string;
    action_items?: string;
    keywords?: string[];
    bullet_gist?: string;
  };
  sentences?: { text: string; speaker_name?: string }[];
}

interface FirefliesResponse {
  data?: {
    transcripts: FirefliesTranscript[];
  };
  errors?: { message: string }[];
}

export function isFirefliesConfigured(): boolean {
  return Boolean(process.env.FIREFLIES_API_KEY);
}

/**
 * Fetch les N derniers transcripts de Fireflies et les convertit au format MockMeeting
 * pour que l'Agent Fireflies les consomme sans distinction avec le mock.
 */
export async function fetchFirefliesMeetings(limit = 10): Promise<MockMeeting[]> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    throw new Error("FIREFLIES_API_KEY non configurée dans .env.local");
  }

  const query = `
    query GetTranscripts($limit: Int) {
      transcripts(limit: $limit) {
        id
        title
        date
        duration
        participants
        summary {
          overview
          action_items
          keywords
          bullet_gist
        }
      }
    }
  `;

  const res = await fetch(FIREFLIES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables: { limit } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fireflies API ${res.status} : ${text}`);
  }

  const payload: FirefliesResponse = await res.json();
  if (payload.errors?.length) {
    throw new Error(`Fireflies GraphQL errors : ${payload.errors.map((e) => e.message).join("; ")}`);
  }

  const transcripts = payload.data?.transcripts ?? [];

  // Mapping → MockMeeting (pour compat avec le reste de la plateforme)
  return transcripts.map((t): MockMeeting => {
    const keyPoints = (t.summary?.bullet_gist ?? "")
      .split(/\n|•/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const actionItems = (t.summary?.action_items ?? "")
      .split(/\n/)
      .map((s) => s.replace(/^[-•\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    return {
      id: t.id,
      title: t.title || "Call sans titre",
      date: new Date(t.date).toISOString(),
      durationMin: Math.round((t.duration ?? 0) / 60),
      participants: t.participants ?? [],
      type: "discovery", // Fireflies ne catégorise pas nativement
      sentiment: "neutral",
      summary: t.summary?.overview || "(pas de résumé disponible)",
      keyPoints,
      actionItems,
      transcript: "", // on n'embarque pas la full transcript ici (trop volumineuse)
    };
  });
}
