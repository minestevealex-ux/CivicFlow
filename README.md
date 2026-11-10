# CivicFlow
### Smart Civic Issue Reporting & Municipal Resource Management System

CivicFlow is a full-stack civic issue reporting and municipal resource management platform designed to connect citizens with municipal authorities.

Citizens can report civic problems, provide location information, track complaints and discover related reports. Administrators can monitor reported issues, prioritize complaints, assign municipal workers and track resolution progress.

The project combines relational database management, vector similarity search, authentication and role-based access control.

## Features

### Citizen Portal
- Submit civic complaints through a web interface.
- Select complaint categories and municipal wards.
- Provide an address and optional GPS coordinates.
- Submit anonymous or authenticated complaints.
- View personal complaint information.
- Detect potentially similar complaints using semantic search.

### Admin Dashboard
- View overall complaint statistics.
- Monitor complaint statuses and priorities.
- View ward-wise complaint distribution.
- Monitor department workloads and worker assignments.
- Update complaint status and priority.
- Assign available municipal workers to complaints.
- Track complaint resolution.

### Authentication and Security
- Citizen registration and login.
- Password hashing using bcrypt.
- JWT-based sessions stored in HTTP-only cookies.
- Citizen and administrator roles.
- Server-side role verification.
- PostgreSQL roles and Row-Level Security policies.

### Semantic Search
- Generate text embeddings using Ollama.
- Store 768-dimensional embeddings using PostgreSQL pgvector.
- Perform cosine-similarity searches to identify related complaints.
- Use an HNSW index to support vector similarity queries.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Relational Database | PostgreSQL |
| Vector Database | PostgreSQL with pgvector |
| Database Driver | node-postgres (`pg`) |
| Authentication | bcryptjs, jose |
| Embedding Model | nomic-embed-text |
| Embedding Runtime | Ollama |
| Database Environment | Docker Compose |
| Version Control | Git and GitHub |

## Architecture

```text
                 CITIZEN
                    |
                    v
             Next.js Web App
                    |
                    v
             Next.js API Routes
                    |
          +---------+---------+
          |                   |
          v                   v
   PostgreSQL Database    Ollama
          |                   |
          v                   v
   Relational Tables     Text Embeddings
          |                   |
          +---------+---------+
                    |
                    v
               pgvector
                    |
                    v
           Similarity Search
                    |
                    v
          Related Complaints

              ADMIN PORTAL
                    |
                    v
           Dashboard and APIs
                    |
                    v
        Issue Management and Worker
                 Assignment
```

## Database Design

The relational database contains the following primary entities:

| Table | Purpose |
|---|---|
| `ward` | Municipal wards |
| `citizen` | Citizen and administrator accounts |
| `category` | Civic complaint categories |
| `department` | Municipal departments |
| `location` | Complaint locations and ward mapping |
| `worker` | Municipal workers |
| `issue` | Reported civic complaints |
| `assignment` | Worker-to-issue assignments |
| `issue_embeddings` | Vector representations of complaint descriptions |

### Main Relationships

- One citizen can report multiple issues.
- One category can classify multiple issues.
- One ward can contain multiple locations.
- One location can be associated with multiple issues.
- One department can employ multiple workers.
- Issues and workers have a many-to-many relationship resolved through assignments.

### Database Features

- Primary keys and foreign keys.
- Unique, NOT NULL, CHECK and DEFAULT constraints.
- Transactions for complaint submission and worker assignment.
- Indexes for frequently queried fields.
- Triggers for complaint resolution timestamps.
- Row-Level Security and role-specific PostgreSQL permissions.
- Vector similarity search using pgvector.

## Project Structure

```text
CivicFlow/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── queries.sql
│   └── migrations/
├── scripts/
│   ├── create-admin.mjs
│   └── generate-issue-embeddings.mjs
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   └── page.tsx
│   ├── components/
│   └── lib/
│       ├── admin.ts
│       ├── auth.ts
│       ├── db.ts
│       └── embeddings.ts
├── docker-compose.yml
├── package.json
├── README.md
└── tsconfig.json
```

## Prerequisites

Install the following before running CivicFlow:

- Node.js and npm
- Docker Desktop
- Git
- Ollama

The embedding model used by the project is `nomic-embed-text`.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/minestevealex-ux/CivicFlow.git
cd CivicFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root.

```env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@127.0.0.1:5433/civicflow"
AUTH_SECRET="YOUR_LONG_RANDOM_SECRET"
```

Use your own local database credentials and a securely generated authentication secret.

Never commit `.env.local` or publish real credentials.

### 4. Start PostgreSQL

Start Docker Desktop, then run:

```bash
docker compose up -d
```

The provided Docker Compose configuration runs PostgreSQL with pgvector.

Default database configuration:

| Setting | Value |
|---|---|
| Database | `civicflow` |
| User | `civicflow` |
| Host port | `5433` |
| Container port | `5432` |
| Container | `civicflow-db` |

The local development password is defined in `docker-compose.yml`. Change it before using this configuration outside local development.

### 5. Initialize the database

For a fresh database, execute the schema and seed scripts:

```bash
docker exec -i civicflow-db psql -U civicflow -d civicflow < database/schema.sql

docker exec -i civicflow-db psql -U civicflow -d civicflow < database/seed.sql
```

Apply the SQL migrations in `database/migrations/` in numerical order if they have not already been included in the schema.

The database must have the pgvector extension enabled.

### 6. Install the embedding model

Install Ollama, then run:

```bash
ollama pull nomic-embed-text
```

Ensure the Ollama service is running before using semantic search or generating embeddings.

### 7. Generate embeddings for existing issues

```bash
node scripts/generate-issue-embeddings.mjs
```

This generates vector representations for existing complaint descriptions.

### 8. Create an administrator account

Use the following command, replacing the example values:

```bash
ADMIN_NAME="CivicFlow Admin" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="YOUR_SECURE_PASSWORD" node scripts/create-admin.mjs
```

Use a password meeting the script's minimum length requirement. Do not publish administrator credentials.

### 9. Start the application

```bash
npm run dev
```

Open:

http://localhost:3000

The administrator dashboard is available at:

http://localhost:3000/admin

## Useful Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the development server |
| `npx tsc --noEmit` | Check TypeScript types |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose ps` | Check database containers |
| `docker exec -it civicflow-db psql -U civicflow -d civicflow` | Open PostgreSQL shell |

## Semantic Search Workflow

1. A citizen submits a complaint.
2. The complaint is stored in PostgreSQL.
3. Ollama generates an embedding from the complaint description.
4. The embedding is stored in `issue_embeddings`.
5. When a new complaint is entered, its embedding is compared with existing complaint embeddings.
6. The most similar complaints are returned using cosine similarity.
7. Citizens can review potentially related complaints before submitting.

## Security Notes

- Passwords are hashed using bcrypt.
- Authentication uses signed sessions stored in HTTP-only cookies.
- Administrator privileges are checked on the server.
- PostgreSQL roles separate citizen, administrator, authentication, search and embedding operations.
- Row-Level Security policies restrict access to protected records.
- Environment files and credentials must remain private.

The database role configuration and application database connection must be completed and verified together before relying on restricted database permissions.

## Academic Project

CivicFlow demonstrates the application of DBMS concepts through a practical municipal issue-management use case.

It combines relational database design, SQL constraints, transaction management, indexing, triggers, role-based access control and vector database functionality in a full-stack application.

