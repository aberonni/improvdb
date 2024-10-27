import Head from "next/head";
import Image from "next/image";

import { PageLayout } from "@/components/page-layout";
import { Separator } from "@/components/ui/separator";

export default function About() {
  return (
    <>
      <Head>
        <title>
          About ImprovDB - Find improv games, exercises, and formats on ImprovDB
          - Improv games and lesson plans for teachers and students
        </title>
      </Head>
      <PageLayout
        className="space-y-6 [&>p>a]:underline [&>p]:leading-7"
        title={
          <>
            About ImprovDB
            <span className="mt-1 block text-sm font-normal tracking-normal">
              The open-source database for improv games and lesson plans
            </span>
          </>
        }
      >
        <p>
          ImprovDB is the open-source database for improv games and lesson
          plans. Whether you're a teacher or a student, you'll find everything
          you need here: from warm-up exercises to short form games to long form
          formats, we've got you covered.
        </p>

        <p>
          ImprovDB was developed by{" "}
          <a href="https://domenicogemoli.com" target="_blank" rel="noreferrer">
            Dom Gemoli
          </a>
          , an improv teacher and web developer, and its main purpose is to
          solve the problem of sharing knowledge amongst improv teachers,
          especially with regards to lesson planning. The desire to solve this
          problem was born as a reaction to encountering this problem as a
          novice teacher.
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
