import { NextResponse } from "next/server";
import { readPosts, deletePost, clearHashtag } from "@/lib/veille/store";

/** GET /api/veille/posts — liste des reels enregistrés (triés par vues). */
export async function GET() {
  const posts = await readPosts();
  return NextResponse.json({ posts });
}

/** DELETE /api/veille/posts?id=… ou ?hashtag=… */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const hashtag = searchParams.get("hashtag");

  if (id) {
    const ok = await deletePost(id);
    return NextResponse.json({ ok });
  }
  if (hashtag) {
    const removed = await clearHashtag(hashtag);
    return NextResponse.json({ ok: true, removed });
  }
  return NextResponse.json({ error: "id ou hashtag requis" }, { status: 400 });
}
