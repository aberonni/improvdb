![ImprovDB](logo.png)

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`. The project is deployed at [improvdb.vercel.app](https://improvdb.vercel.app/).

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

- A MySQL database URL (you can get one for free at [Planet Scale](https://planetscale.com/))
- Google authentication credentials - [Read more](https://next-auth.js.org/providers/google)
- (Optional) A free [Upstash](https://upstash.com/) redis URL

Once you have these three things, you can run

```bash
cp .env.example .env
# edit the `.env` file with your configuration details, and then
npm install
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

## Learn More about T3

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app)

## Contributing

Contributions are welcome! The best place to start is by [opening an issue](https://github.com/aberonni/improvdb/issues).
