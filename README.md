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

- A Postgres database URL (you can get one for free at [Planet Scale](https://planetscale.com/) or use the docker compose file to run Postgres locally)
- Google authentication credentials - [Read more](https://next-auth.js.org/providers/google)
- (Optional) A free [Upstash](https://upstash.com/) redis URL

### Setup

```bash
cp .env.example .env
# edit the `.env` file with your configuration details, and then
npm install
```

### Local Postgres database

You must have docker installed for this to work. You can use a local Postgres database with the following commands

```bash
docker-compose -f docker-compose.postgres.yml up
# Wait for postgres server to be ready, then run
npx prisma db push
npx prisma db seed
```

Then you can just update your `.env` file with `DATABASE_URL=postgres://improvdb_user:secret@127.0.0.1:5432/improvdb_db`.

If you ever need to reset the database, you have two options:

#### 1. Soft reset

```bash
npx prisma db push --force-reset
npx prisma db seed
```

#### 2. Hard reset

Run the following command to destroy the volumes associated with the postgres database, and then start again from scratch.

```bash
docker-compose -f docker-compose.postgres.yml down -v
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

## Running E2E tests locally

To be able to run all tests properly, you must have docker installed. That's because we want to use the same docker container that is used in CI, ensuring that there aren't differences when doing screenshot / visual regression testing.

You must also make sure that you are using a freshly seeded [local Postgres database](#local-postgres-database).

### Build the image

```bash
docker build -t playwright-docker -f tests/Dockerfile-playwright .
docker image ls # Should output "playwright-docker"
```

### Run the tests

```bash
docker run -p 9323:9323 --rm --name playwright-runner -it playwright-docker:latest /bin/bash
# From inside the container now you can run
npx playwright test
```

More detailed instructions on the [Docker | Playwright](https://playwright.dev/docs/docker) documentation. Loosely based on [this guide](https://www.digitalocean.com/community/tutorials/how-to-run-end-to-end-tests-using-playwright-and-docker#step-3-mdash-executing-the-tests).

#### Updating screenshots

If you need to update the screenshots, then you can run this command instead:

```bash
npx playwright test --update-snapshots
```

And then, once you've run tests, you can update the snapshots in the git repository by running the following (while the docker container is still running, in a separate terminal):

```bash
docker cp playwright-runner:/app/tests .
```

## Run E2E tests without docker

You can alternatively run a test directly without docker, skipping the screenshot comparison functionality altogether.

You can do this with the command:

```bash
SKIP_SCREENSHOT_COMPARISON=1 npx playwright test
```

## Updating seed data

While connected to a production/staging database, run the following:

```bash
npx tsx prisma/updateSeedData.ts
```

This will pull all resources and all public lesson plans into the `seedData.json` file in the git repository.

## Learn More about T3

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app)

## Contributing

Contributions are welcome! The best place to start is by [opening an issue](https://github.com/aberonni/improvdb/issues).
