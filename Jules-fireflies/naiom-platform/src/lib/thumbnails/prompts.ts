/**
 * Logique de prompts pour les miniatures YouTube de MIA (le Designer).
 *
 * Principe : on NE rend JAMAIS le texte du titre dans l'image générée (les
 * modèles d'image hallucinent le texte, surtout en français). Nano Banana
 * produit uniquement le VISUEL — le vrai visage (photo de référence) composé
 * dans une scène, avec un espace négatif réservé d'un côté. Le titre est ensuite
 * incrusté par-dessus en HTML→PNG (texte 100 % net). Voir compose.ts.
 *
 * Chaque composition coordonne `textSide` avec le prompt : si le texte ira à
 * gauche, on demande au modèle de poser le sujet à droite et de laisser la
 * gauche dégagée.
 */

export type TextSide = "left" | "right";

export interface ThumbnailPromptSpec {
  /** Libellé court montré dans l'UI. */
  label: string;
  /** Prompt Nano Banana (anglais, sans texte à rendre). */
  prompt: string;
  /** Côté où le titre sera incrusté en post-prod. */
  textSide: TextSide;
}

/** Nettoie un input libre pour l'injecter sans risque dans un prompt anglais. */
function sanitizeContext(s: string): string {
  return s
    .replace(/["“”']/g, "")
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

/**
 * Contrainte commune à tous les prompts — identité du sujet + interdiction de
 * texte. Répétée dans chaque prompt pour maximiser le respect par le modèle.
 */
function baseConstraints(textSide: TextSide): string {
  const clearSide = textSide === "left" ? "left" : "right";
  const subjectSide = textSide === "left" ? "right" : "left";
  return [
    "Use the provided photo as the exact reference for the person's face and identity — keep the same face, same features, photorealistic.",
    `Position the person on the ${subjectSide} side of the frame and keep the ${clearSide} third visually clean and uncluttered as negative space for a text overlay added later.`,
    "16:9 widescreen YouTube thumbnail composition, high contrast, sharp focus on the face, punchy and scroll-stopping.",
    "Absolutely NO text, NO letters, NO words, NO captions, NO numbers, NO logos and NO watermark anywhere in the image.",
  ].join(" ");
}

/**
 * Construit jusqu'à `count` prompts de miniature, chacun une composition
 * distincte, modulés par le sujet de la vidéo et l'émotion souhaitée.
 */
export function buildThumbnailPrompts(opts: {
  title: string;
  angle?: string;
  count?: number;
}): ThumbnailPromptSpec[] {
  const topic = sanitizeContext(opts.title) || "a marketing and AI automation video";
  const emotion = sanitizeContext(opts.angle || "");
  const emotionClause = emotion
    ? `Facial expression and mood: ${emotion}.`
    : "Facial expression: confident, engaging, direct eye contact with the camera.";

  const compositions: ThumbnailPromptSpec[] = [
    {
      label: "Réaction — gros plan",
      textSide: "left",
      prompt: [
        `Extreme close-up portrait reaction shot for a YouTube video about ${topic}.`,
        emotionClause,
        "Dramatic studio lighting with a warm rim light, slightly desaturated cinematic color grade, shallow depth of field with a softly blurred deep teal-green and warm cream background.",
        baseConstraints("left"),
      ].join(" "),
    },
    {
      label: "Présentation — plan moyen",
      textSide: "right",
      prompt: [
        `Medium shot of the person presenting and gesturing with one open hand toward empty space, in a modern minimalist studio set evoking ${topic}.`,
        emotionClause,
        "Clean editorial lighting, soft shadows, a warm terracotta accent light, subtle out-of-focus tech and marketing ambience in the background.",
        baseConstraints("right"),
      ].join(" "),
    },
    {
      label: "Impact — fond coloré",
      textSide: "left",
      prompt: [
        `Bold high-energy thumbnail of the person, upper body, against a vivid solid colored backdrop with subtle abstract motion graphics hinting at ${topic}.`,
        emotionClause,
        "Strong directional key light, glossy magazine-cover finish, vibrant saturated colors, crisp edges, strong subject-background separation.",
        baseConstraints("left"),
      ].join(" "),
    },
  ];

  const n = Math.min(Math.max(opts.count ?? 3, 1), compositions.length);
  return compositions.slice(0, n);
}
