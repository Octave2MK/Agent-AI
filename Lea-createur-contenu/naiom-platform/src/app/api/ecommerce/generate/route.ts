import {
  arcadsConfigured,
  actorSituations,
  generateProductShowcase,
  generateTalkingActor,
  listActors,
} from "@/lib/integrations/arcads";
import {
  isArcadsMcpConnected,
  mcpAudioDriven,
  mcpListSituations,
  mcpProductShowcase,
  mcpRegisterImage,
  mcpUnboxingPov,
  mcpUploadImage,
  bearerCreateProduct,
} from "@/lib/integrations/arcadsMcp";
import { addVideo, readStore, upsertProduct, replaceProductId, readPhoto } from "@/lib/ecommerce/store";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/ecommerce/generate
 * body avatar   : { mode:"avatar", productArcadsId, title, script, actorId, actorName?, actorImageUrl? }
 * body showcase : { mode:"showcase", productArcadsId, title, prompt, situationId, aspectRatio? }
 * → { success, video } (statut "processing", suivi via /api/ecommerce/history)
 *
 * Backend : MCP OAuth prioritaire (connexion depuis l'appli Arcads),
 * API externe en secours si des clés sont présentes.
 */
export async function POST(req: Request) {
  const mcp = await isArcadsMcpConnected();
  if (!mcp && !arcadsConfigured()) {
    return Response.json(
      { error: "Arcads non connecté.", needsConfig: true, authUrl: "/api/integrations/arcads/start" },
      { status: 412 }
    );
  }
  try {
    const body = await req.json();
    const { mode, productArcadsId, title } = body as {
      mode: "avatar" | "showcase" | "unboxing";
      productArcadsId: string;
      title: string;
    };
    if (!productArcadsId) return Response.json({ error: "Produit requis." }, { status: 400 });

    const store = await readStore();
    let product = store.products.find((p) => p.arcadsId === productArcadsId);
    // Produit du workspace Arcads (pas dans le catalogue local) : on récupère
    // son nom + son image pour pouvoir générer avec.
    if (!product && mcp && !productArcadsId.startsWith("local-")) {
      const { mcpListProducts } = await import("@/lib/integrations/arcadsMcp");
      const remote = (await mcpListProducts().catch(() => [])).find((r) => r.id === productArcadsId);
      if (remote) {
        product = {
          arcadsId: remote.id,
          name: remote.name,
          description: remote.description,
          photoUrl: remote.imageUrl,
          createdAt: new Date().toISOString(),
        };
      }
    }
    const productName = product?.name ?? "Produit";

    // Produit "local-…" (créé avant que la création réelle soit possible) :
    // on le rattache à un produit Arcads réel — existant de même nom, sinon créé.
    let effectiveProductId = productArcadsId;
    if (mcp && productArcadsId.startsWith("local-") && product) {
      const { mcpListProducts } = await import("@/lib/integrations/arcadsMcp");
      const remote = await mcpListProducts().catch(() => []);
      const sameName = remote.find(
        (r) => r.name.trim().toLowerCase() === product.name.trim().toLowerCase()
      );
      let realId: string;
      if (sameName) {
        realId = sameName.id;
      } else {
        const created = await bearerCreateProduct(product.name, product.description);
        realId = created.id;
      }
      if (product.arcadsImagePath) {
        await mcpRegisterImage(product.arcadsImagePath, realId);
      }
      await replaceProductId(productArcadsId, realId);
      effectiveProductId = realId;
      product.arcadsId = realId;
    }
    const realProductId = effectiveProductId.startsWith("local-") ? undefined : effectiveProductId;

    if (mode === "avatar") {
      // On n'exige plus de choisir un avatar précis : l'utilisateur envoie ses
      // critères (genre / âge), et Arcads sélectionne l'acteur lui-même.
      const { script, gender, age, voiceId } = body as {
        script: string;
        gender?: string; // "Female" | "Male" | ""
        age?: string; // "Young Adult" | "Adult" | "Senior" | ""
        voiceId?: string; // voix du workspace (ex. clone français) — sinon défaut Arcads
      };
      if (!script || script.trim().length < 10) {
        return Response.json({ error: "Script requis (≥ 10 caractères)." }, { status: 400 });
      }

      let genId: string;
      let chosenName: string | undefined;
      let chosenImage: string | undefined;

      if (mcp) {
        const situations = await mcpListSituations({
          contentType: "talking_actor",
          actorGender: gender ? (gender.toLowerCase() as "male" | "female") : undefined,
          actorAge: age ? (age.toLowerCase() as "adult" | "senior" | "young adult") : undefined,
        });
        if (!situations.length) {
          return Response.json(
            { error: "Aucun avatar Arcads ne correspond à ces critères — élargissez les filtres." },
            { status: 422 }
          );
        }
        // un peu de variété : on pioche parmi les meilleurs résultats
        const pick = situations[Math.floor(Math.random() * Math.min(situations.length, 12))];
        chosenName = pick.actor?.name;
        chosenImage = pick.imageUrl ?? pick.actor?.imageUrl ?? pick.previewUrl;
        const gen = await mcpAudioDriven({
          productId: realProductId,
          situationId: pick.id,
          script: script.trim(),
          voiceId: voiceId || undefined,
        });
        genId = gen.id;
      } else {
        const actors = await listActors({ gender: gender || undefined, age: age || undefined });
        if (!actors.length) {
          return Response.json(
            { error: "Aucun avatar ne correspond à ces critères — élargissez les filtres." },
            { status: 422 }
          );
        }
        const actor = actors[Math.floor(Math.random() * Math.min(actors.length, 12))];
        chosenName = actor.name;
        chosenImage = actor.imageUrl;
        const situations = await actorSituations(actor.id);
        if (!situations.length) {
          return Response.json(
            { error: "L'avatar sélectionné n'a pas de décor disponible — réessayez." },
            { status: 422 }
          );
        }
        const gen = await generateTalkingActor({
          productId: productArcadsId,
          script: script.trim(),
          situationId: situations[0].id,
        });
        genId = gen.id;
      }

      const video = {
        id: `ecom-${Date.now()}`,
        kind: "avatar" as const,
        backend: (mcp ? "mcp" : "api") as "mcp" | "api",
        arcadsId: genId,
        title: title?.trim() || `${productName} — vidéo avatar`,
        productArcadsId,
        productName,
        script: script.trim(),
        actorName: chosenName,
        actorImageUrl: chosenImage,
        aspectRatio: "9:16",
        status: "processing" as const,
        createdAt: new Date().toISOString(),
      };
      await addVideo(video);
      return Response.json({ success: true, video });
    }

    // Photo produit (requise pour showcase & unboxing).
    // ⚠ Les uploads Arcads sont TEMPORAIRES (external-api-temp-uploads/…) :
    // un filePath stocké la veille est périmé (REFERENCE_FILE_NOT_FOUND).
    // → on ré-uploade la photo fraîchement à CHAQUE génération.
    async function resolveImagePath(): Promise<string | null> {
      if (!product || !mcp) return product?.arcadsImagePath ?? null;

      // 1. photo locale sur disque → upload frais
      if (product.photoUrl?.startsWith("/api/ecommerce/photo/")) {
        const name = product.photoUrl.split("/").pop()!;
        const buf = await readPhoto(name);
        if (buf) {
          const ext = name.split(".").pop()?.toLowerCase() ?? "png";
          const mime =
            ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
          const up = await mcpUploadImage(buf, mime);
          await upsertProduct({ ...product, arcadsImagePath: up.filePath });
          return up.filePath;
        }
      }
      // 2. image distante (produit du workspace Arcads) → download + upload frais
      if (product.photoUrl?.startsWith("http")) {
        const img = await fetch(product.photoUrl);
        if (img.ok) {
          const mime = (img.headers.get("content-type") ?? "image/jpeg").split(";")[0];
          const buf = Buffer.from(await img.arrayBuffer());
          const up = await mcpUploadImage(buf, mime);
          return up.filePath;
        }
      }
      // 3. dernier recours : le path stocké (peut être périmé)
      return product.arcadsImagePath ?? null;
    }

    if (mode === "unboxing") {
      if (!mcp) {
        return Response.json(
          { error: "L'unboxing nécessite la connexion Arcads (bouton Connecter Arcads)." },
          { status: 412 }
        );
      }
      const { situationId } = body as { situationId: string };
      if (!situationId) return Response.json({ error: "Choisissez une ambiance d'unboxing." }, { status: 400 });
      const imagePath = await resolveImagePath();
      if (!imagePath) {
        return Response.json(
          { error: "Ce produit n'a pas de photo exploitable — ajoutez-le avec sa photo d'abord." },
          { status: 422 }
        );
      }
      const gen = await mcpUnboxingPov({ productId: realProductId, situationId, imagePath });
      const video = {
        id: `ecom-${Date.now()}`,
        kind: "showcase" as const,
        backend: "mcp" as const,
        arcadsId: gen.id,
        title: title?.trim() || `${productName} — unboxing`,
        productArcadsId: effectiveProductId,
        productName,
        prompt: "Unboxing POV",
        aspectRatio: "9:16",
        status: "processing" as const,
        createdAt: new Date().toISOString(),
      };
      await addVideo(video);
      return Response.json({ success: true, video });
    }

    if (mode === "showcase") {
      const { prompt, situationId, aspectRatio } = body as {
        prompt: string;
        situationId: string;
        aspectRatio?: "9:16" | "1:1" | "16:9";
      };
      if (!prompt || prompt.trim().length < 10) {
        return Response.json({ error: "Description du produit requise (≥ 10 caractères)." }, { status: 400 });
      }
      if (!situationId) return Response.json({ error: "Choisissez une ambiance." }, { status: 400 });

      const imagePath = await resolveImagePath();
      if (!imagePath) {
        return Response.json(
          { error: "Ce produit n'a pas de photo exploitable — ajoutez-le avec sa photo d'abord." },
          { status: 422 }
        );
      }

      let genId: string;
      if (mcp) {
        const gen = await mcpProductShowcase({
          productId: realProductId,
          situationId,
          imagePath,
          // langue explicite pour éviter les accents non désirés
          prompt: `${prompt.trim()}\n\nLangue de la vidéo : français (France), ton naturel et réaliste.`,
          aspectRatio: aspectRatio === "16:9" ? "16:9" : "9:16",
        });
        genId = gen.id;
      } else {
        const gen = await generateProductShowcase({
          productId: productArcadsId,
          situationId,
          referenceImagePath: imagePath,
          prompt: prompt.trim(),
          aspectRatio: aspectRatio ?? "9:16",
        });
        genId = gen.id;
      }

      const video = {
        id: `ecom-${Date.now()}`,
        kind: "showcase" as const,
        backend: (mcp ? "mcp" : "api") as "mcp" | "api",
        arcadsId: genId,
        title: title?.trim() || `${productName} — showcase`,
        productArcadsId,
        productName,
        prompt: prompt.trim(),
        aspectRatio: aspectRatio ?? "9:16",
        status: "processing" as const,
        createdAt: new Date().toISOString(),
      };
      await addVideo(video);
      return Response.json({ success: true, video });
    }

    return Response.json({ error: "mode invalide (avatar | showcase)" }, { status: 400 });
  } catch (err) {
    console.error("[ecommerce/generate]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
