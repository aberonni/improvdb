import Head from "next/head";
import Image from "next/image";
import { PageLayout } from "@/components/page-layout";
import { Separator } from "@/components/ui/separator";

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
          <a href="https://domenicogemoli.com" target="_blank" rel="noreferrer">
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
          Many teachers share lesson plans - but these lesson plans are often
          just a list of things that are only comprehensible to the people who
          had written them.
        </p>

        <p>
          ImprovDB aims to solve this problem by providing a platform for improv
          teachers to share lesson plans, and to provide a structure for lesson
          plans that makes them easier to understand. The main advantage of
          ImprovDB is that it allows teachers to share lesson plans in a
          structured way, and to build on each other's work, without having to
          constantly rewrite the same things over and over again.
        </p>

        <Separator />

        <p>
          This website is open source and free to use. You can find the source
          code on{" "}
          <a
            href="https://github.com/aberonni/improvdb"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
        <p>
          Do you have feedback? Feature requests? Have you found a bug? I would
          love to hear about it. The best way is to open an issue on the{" "}
          <a
            href="https://github.com/aberonni/improvdb/issues"
            target="_blank"
            rel="noreferrer"
          >
            GitHub repository
          </a>{" "}
          but you can also just{" "}
          <a
            href="mailto:domenicogemoli@gmail.com"
            target="_blank"
            rel="noreferrer"
          >
            send me an email
          </a>
          .
        </p>

        <p>
          <a
            href="https://ko-fi.com/domgemoli"
            target="_blank"
            rel="noreferrer"
          >
            <Image
              src="/images/kofi_button_stroke.png"
              alt="Support me on Ko-fi"
              width={192}
              height={30}
            />
          </a>
        </p>
      </PageLayout>
    </>
  );
}
