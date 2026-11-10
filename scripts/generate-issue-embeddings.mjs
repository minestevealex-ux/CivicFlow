import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query(
    "SELECT issue_id, description FROM issue ORDER BY issue_id"
  );

  for (const issue of result.rows) {
    const response = await fetch("http://localhost:11434/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        input: issue.description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error for issue ${issue.issue_id}: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.embeddings[0];
    const vector = `[${embedding.join(",")}]`;

    await pool.query(
      `INSERT INTO issue_embeddings (issue_id, embedding, embedding_model)
       VALUES ($1, $2::vector, $3)
       ON CONFLICT (issue_id)
       DO UPDATE SET
         embedding = EXCLUDED.embedding,
         embedding_model = EXCLUDED.embedding_model,
         created_at = CURRENT_TIMESTAMP`,
      [issue.issue_id, vector, "nomic-embed-text"]
    );

    console.log(`Embedded issue ${issue.issue_id}`);
  }

  console.log(`Finished: ${result.rowCount} issues processed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
