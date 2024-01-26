import Head from "next/head";
import { PageLayout } from "~/components/page-layout";

export default function About() {
  return (
    <>
      <Head>
        <title>About - ImprovDB</title>
      </Head>
      <PageLayout
        title="About"
        className="space-y-6 [&>p>a]:underline [&>p]:leading-7"
      >
        <p>
          ImprovDB was developed by{" "}
          <a href="https://domenicogemoli.com" target="_blank">
            Dom Gemoli
          </a>
          , an improv teacher and web developer.
        </p>

        <p>
          The main purpose of ImprovDB is to solve the problem of sharing
          knowledge amongst improv teachers, especially with regards to lesson
          planning. The desire to solve this problem was born as a reaction to
          encountering this problem as a novice teacher.
        </p>

        <p className="text-xl text-muted-foreground">
          Many teachers could share lesson plans - but these lesson plans were
          often just a list of things that were only comprehensible to the
          people who had written them.
        </p>

        <p>
          ImprovDB aims to solve this problem by providing a platform for improv
          teachers to share lesson plans, and to provide a structure for lesson
          plans that makes them easier to understand. The main advantage of
          ImprovDB is that it allows teachers to share lesson plans in a
          structured way, and to build on each other's work, without having to
          constantly rewrite the same things over and over again.
        </p>

        <p>
          Do you have feedback? Feature requests? Have you found a bug? I would
          love to hear about it. The best way is to open an issue on the{" "}
          <a href="https://github.com/aberonni/improvdb/issues" target="_blank">
            GitHub repository
          </a>
          .
        </p>
      </PageLayout>
    </>
  );
}
