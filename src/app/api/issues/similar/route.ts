import { NextRequest, NextResponse } from "next/server";
import { withDbRole } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const description = String(body.description || "").trim();

    if (description.length < 10 || description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be between 10 and 5000 characters." },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(description);
    const vector = `[${embedding.join(",")}]`;

    const result = await withDbRole(
      "civicflow_search",
      {},
      (client) =>
        client.query(
          `SELECT
             i.issue_id,
             i.description,
             i.status,
             i.priority,
             c.name AS category,
             w.name AS ward,
             ROUND((1 - (e.embedding <=> $1::vector))::numeric, 4) AS similarity
           FROM issue_embeddings e
           JOIN issue i ON i.issue_id = e.issue_id
           JOIN category c ON c.category_id = i.category_id
           JOIN location l ON l.location_id = i.location_id
           JOIN ward w ON w.ward_id = l.ward_id
           WHERE 1 - (e.embedding <=> $1::vector) >= 0.35
           ORDER BY e.embedding <=> $1::vector
           LIMIT 5`,
          [vector]
        )
    );

    return NextResponse.json({
      success: true,
      matches: result.rows,
    });
  } catch (error) {
    console.error("Semantic issue search failed:", error);
    return NextResponse.json({
      success: true,
      matches: [],
      warning:
        "Semantic search is temporarily unavailable. You can still submit your complaint.",
    });
  }
}
