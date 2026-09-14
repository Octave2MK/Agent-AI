import { getAgentUsage } from "@/lib/analytics/usage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return Response.json({ error: "invalid slug" }, { status: 400 });
  }

  try {
    const [d7, d30] = await Promise.all([
      getAgentUsage(slug, { days: 7 }),
      getAgentUsage(slug, { days: 30 }),
    ]);
    return Response.json({ slug, d7, d30 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
