# Sanity Studio

Sanity Studio for content management. This is a local development interface that connects to your Sanity Cloud backend.

## Setup

1. **Create a Sanity project** (if you haven't already):
   ```bash
   npm create sanity@latest
   ```
   Follow the prompts to create a new project or link to an existing one.

2. **Configure environment variables**:
   - Copy `env/.env.example` to `.env`
   - Set `SANITY_PROJECT_ID` (get from https://sanity.io/manage)
   - Set `SANITY_DATASET` (usually `production` or `development`)
   - Create an API token at https://sanity.io/manage and set `SANITY_API_TOKEN`

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the Studio**:
   ```bash
   npm run dev
   ```
   Studio will be available at http://localhost:3333

## Deploy Studio

Deploy your Studio to Sanity Cloud:
```bash
npm run deploy
```

This makes your Studio accessible at `https://your-project.sanity.studio`

## Schema Definitions

Schemas are defined in the `schemas/` directory:
- `post.ts` - Blog post content type
- `author.ts` - Author content type
- `category.ts` - Category content type

Add new schemas by creating files in `schemas/` and exporting them in `schemas/index.ts`.

## GROQ Queries

Use the Vision tool (available in Studio) to test GROQ queries:

```groq
*[_type == "post" && defined(slug.current)] {
  _id,
  title,
  slug,
  publishedAt,
  "author": author->name
}
```

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Portable Text](https://www.sanity.io/docs/block-content)

