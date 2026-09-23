import { readStore } from "@/lib/creative/store";
import { isHiggsfieldConfigured } from "@/lib/integrations/higgsfield";

export const runtime = "nodejs";

export async function GET() {
  const s = await readStore();
  return Response.json({ configured: isHiggsfieldConfigured(), brandKit: s.brandKit, creatives: s.creatives });
}
