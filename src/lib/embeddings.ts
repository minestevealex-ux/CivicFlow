import { withDbRole } from "@/lib/db";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      input: text,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.embeddings?.[0];

  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw new Error("Invalid embedding dimensions returned by Ollama");
  }

  return embedding;
}

export async function saveIssueEmbedding(
  issueId: number,
  embedding: number[]
): Promise<void> {
  const vector = `[${embedding.join(",")}]`;

  await withDbRole("civicflow_embedding", {}, async (client) => {
    await client.query(
      `INSERT INTO issue_embeddings
         (issue_id, embedding, embedding_model)
       VALUES ($1, $2::vector, 'nomic-embed-text')
       ON CONFLICT (issue_id)
       DO UPDATE SET
         embedding = EXCLUDED.embedding,
         embedding_model = EXCLUDED.embedding_model,
         created_at = CURRENT_TIMESTAMP`,
      [issueId, vector]
    );
  });
}
