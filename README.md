![ImprovDB](logo.png)

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`. The project is deployed at [improvdb.com](https://improvdb.com/).

## Tech Stack

- [Typescript](https://www.typescriptlang.org/docs/)
- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [shadcn/ui](https://ui.shadcn.com/)

## Local development

### Prerequisites

- A MySQL database URL (you can get one for free at [Planet Scale](https://planetscale.com/) or use the docker compose file to run MySQL locally)
- Google authentication credentials - [Read more](https://next-auth.js.org/providers/google)
- (Optional) A free [Upstash](https://upstash.com/) redis URL

### Setup

```bash
cp .env.example .env
# edit the `.env` file with your configuration details, and then
npm install
```

### Local MySQL database

You can use a local MySQL database with the following commands

```bash
docker-compose up
npx prisma db push
npx prisma db seed
```

Then you can just update your `.env` file with `DATABASE_URL=mysql://root:secret@127.0.0.1:3306/testdb`.

If you ever need to reset the database, you can run the following command to destroy the volumes associated with the mysql database.

```bash
docker-compose down -v
```

### Running the project

As simple as

```bash
npm run dev
```

You can also run prisma studio with the following command:

```bash
npx prisma studio
```

## Updating seed data

```bash
npx tsx prisma/updateSeedData.ts
```

## Learn More about T3

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app)

## Contributing

Contributions are welcome! The best place to start is by [opening an issue](https://github.com/aberonni/improvdb/issues).
