import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const description = process.argv.slice(2).join(" ");

  if (!description) {
    throw new Error('Provide a complaint, e.g. "Water is leaking from the road"');
  }

  const response = await fetch("http://localhost:11434/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      input: description,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  const vector = `[${data.embeddings[0].join(",")}]`;

  const result = await pool.query(
    `SELECT
       i.issue_id,
       i.description,
       i.status,
       i.priority,
       ROUND((1 - (e.embedding <=> $1::vector))::numeric, 4) AS similarity
     FROM issue_embeddings e
     JOIN issue i ON i.issue_id = e.issue_id
     ORDER BY e.embedding <=> $1::vector
     LIMIT 5`,
    [vector]
  );

  console.log("\nSimilar civic issues:\n");

  for (const row of result.rows) {
    console.log(`Issue #${row.issue_id}`);
    console.log(`Description: ${row.description}`);
    console.log(`Status: ${row.status}`);
    console.log(`Priority: ${row.priority}`);
    console.log(`Similarity: ${row.similarity}`);
    console.log("-----------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => pool.end());
