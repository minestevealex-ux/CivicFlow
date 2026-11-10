import { NextRequest, NextResponse } from "next/server";
import { withDbRole } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateEmbedding, saveIssueEmbedding } from "@/lib/embeddings";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    const description = String(body.description || "").trim();
    const address = String(body.address || "").trim();
    const categoryId = Number(body.categoryId);
    const wardId = Number(body.wardId);

    const latitude =
      body.latitude === null || body.latitude === ""
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === null || body.longitude === ""
        ? null
        : Number(body.longitude);

    const isAnonymous = body.isAnonymous === true;

    if (description.length < 10 || description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be between 10 and 5000 characters." },
        { status: 400 }
      );
    }

    if (!address || address.length > 500) {
      return NextResponse.json(
        { error: "Please provide a valid location address." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(categoryId) || !Number.isInteger(wardId)) {
      return NextResponse.json(
        { error: "Please select a category and ward." },
        { status: 400 }
      );
    }

    if (!isAnonymous && !session) {
      return NextResponse.json(
        { error: "Please sign in to submit a named report." },
        { status: 401 }
      );
    }

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      return NextResponse.json(
        { error: "Invalid GPS coordinates." },
        { status: 400 }
      );
    }

    if ((latitude === null) !== (longitude === null)) {
      return NextResponse.json(
        { error: "Both GPS coordinates must be provided together." },
        { status: 400 }
      );
    }

    const issue = await withDbRole(
      "civicflow_citizen",
      { userId: session?.id ?? null },
      async (client) => {
        const category = await client.query(
          "SELECT category_id FROM category WHERE category_id = $1",
          [categoryId]
        );

        const ward = await client.query(
          "SELECT ward_id FROM ward WHERE ward_id = $1",
          [wardId]
        );

        if (category.rowCount === 0 || ward.rowCount === 0) {
          return null;
        }

        const location = await client.query(
          `INSERT INTO location (ward_id, address, latitude, longitude)
           VALUES ($1, $2, $3, $4)
           RETURNING location_id`,
          [wardId, address, latitude, longitude]
        );

        const citizenId = isAnonymous ? null : session!.id;

        const result = await client.query(
          `INSERT INTO issue
             (citizen_id, category_id, location_id, description, priority, status, is_anonymous)
           VALUES ($1, $2, $3, $4, 'medium', 'submitted', $5)
           RETURNING issue_id, reported_at, status`,
          [
            citizenId,
            categoryId,
            location.rows[0].location_id,
            description,
            isAnonymous,
          ]
        );

        return result.rows[0];
      }
    );

    if (!issue) {
      return NextResponse.json(
        { error: "Invalid category or ward." },
        { status: 400 }
      );
    }

    let embeddingSaved = false;

    try {
      const embedding = await generateEmbedding(description);
      await saveIssueEmbedding(issue.issue_id, embedding);
      embeddingSaved = true;
    } catch (error) {
      console.error("Could not save issue embedding:", error);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your complaint has been submitted.",
        embeddingSaved,
        issue: {
          id: issue.issue_id,
          status: issue.status,
          reportedAt: issue.reported_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Issue submission failed:", error);
    return NextResponse.json(
      { error: "Could not submit your complaint. Please try again." },
      { status: 500 }
    );
  }
}
