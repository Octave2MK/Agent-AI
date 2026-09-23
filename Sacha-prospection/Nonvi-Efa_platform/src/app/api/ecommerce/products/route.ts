import { arcadsConfigured, createProduct, listProducts, uploadImage } from "@/lib/integrations/arcads";
import {
  isArcadsMcpConnected,
  mcpListProducts,
  mcpRegisterImage,
  mcpUploadImage,
  bearerCreateProduct,
  bearerDeleteProduct,
} from "@/lib/integrations/arcadsMcp";
import { readStore, upsertProduct, savePhoto, deleteProduct } from "@/lib/ecommerce/store";

export const runtime = "nodejs";
export const maxDuration = 60;

function notConfigured() {
  return Response.json(
    {
      error: "Arcads n'est pas connecté.",
      needsConfig: true,
      authUrl: "/api/integrations/arcads/start",
    },
    { status: 412 }
  );
}

/**
 * GET /api/ecommerce/products
 * → { products } — produits du workspace Arcads (via MCP OAuth, ou API si clés)
 *   fusionnés avec le catalogue local (photos uploadées).
 */
export async function GET() {
  const mcp = await isArcadsMcpConnected();
  if (!mcp && !arcadsConfigured()) return notConfigured();
  try {
    const store = await readStore();
    const known = new Map(store.products.map((p) => [p.arcadsId, p]));

    let remote: { arcadsId: string; name: string; description?: string; photoUrl?: string }[] = [];
    if (mcp) {
      remote = (await mcpListProducts()).map((r) => ({
        arcadsId: r.id,
        name: r.name,
        description: r.description,
        photoUrl: r.imageUrl,
      }));
    } else {
      remote = (await listProducts()).map((r) => ({
        arcadsId: r.id,
        name: r.name,
        description: r.description,
      }));
    }

    // dédoublonnage : si un produit réel Arcads porte le même nom qu'un
    // produit local (créé avant la connexion), on garde la version Arcads
    const remoteNames = new Set(remote.map((r) => r.name.trim().toLowerCase()));
    const locals = store.products.filter(
      (p) => !(p.arcadsId.startsWith("local-") && remoteNames.has(p.name.trim().toLowerCase()))
    );
    const merged = [
      ...locals,
      ...remote.filter((r) => !known.has(r.arcadsId)).map((r) => ({ ...r, createdAt: "" })),
    ];
    return Response.json({ products: merged, backend: mcp ? "mcp" : "api" });
  } catch (err) {
    console.error("[ecommerce/products]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ecommerce/products — multipart/form-data
 * fields: name, description?, photo (File)
 * MCP : upload photo chez Arcads (S3) + produit enregistré en local.
 * API : crée aussi le produit dans le workspace Arcads.
 */
export async function POST(req: Request) {
  const mcp = await isArcadsMcpConnected();
  if (!mcp && !arcadsConfigured()) return notConfigured();
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim() || undefined;
    const photo = form.get("photo");
    if (!name) return Response.json({ error: "Le nom du produit est requis." }, { status: 400 });
    if (!(photo instanceof File) || photo.size === 0) {
      return Response.json({ error: "La photo du produit est requise." }, { status: 400 });
    }
    const mime = photo.type || "image/png";
    if (!mime.startsWith("image/")) {
      return Response.json({ error: "Le fichier doit être une image." }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const photoUrl = await savePhoto(buffer, mime.split("/")[1] ?? "png");

    let arcadsId: string;
    let arcadsImagePath: string;
    if (mcp) {
      // création RÉELLE dans le workspace Arcads (Bearer OAuth) + photo attachée
      const [created, uploaded] = await Promise.all([
        bearerCreateProduct(name, description),
        mcpUploadImage(buffer, mime),
      ]);
      arcadsId = created.id;
      arcadsImagePath = uploaded.filePath;
      await mcpRegisterImage(arcadsImagePath, arcadsId);
    } else {
      const [product, uploaded] = await Promise.all([
        createProduct(name, description),
        uploadImage(buffer, mime),
      ]);
      arcadsId = product.id;
      arcadsImagePath = uploaded.filePath;
    }

    const record = {
      arcadsId,
      name,
      description,
      photoUrl,
      arcadsImagePath,
      createdAt: new Date().toISOString(),
    };
    await upsertProduct(record);
    return Response.json({ success: true, product: record });
  } catch (err) {
    console.error("[ecommerce/products POST]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ecommerce/products — body: { arcadsId }
 * Supprime le produit du catalogue local ET du workspace Arcads
 * (sauf produits "local-…" qui n'existent que sur la plateforme).
 */
export async function DELETE(req: Request) {
  try {
    const { arcadsId } = await req.json();
    if (!arcadsId) return Response.json({ error: "arcadsId requis" }, { status: 400 });

    if (!arcadsId.startsWith("local-") && (await isArcadsMcpConnected())) {
      await bearerDeleteProduct(arcadsId);
    }
    await deleteProduct(arcadsId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[ecommerce/products DELETE]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
