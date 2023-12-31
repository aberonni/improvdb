import Head from "next/head";
import { startCase } from "lodash";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import ReactMarkdown from "react-markdown";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import Link from "next/link";
import { LoadingPage } from "~/components/Loading";

type Resource = RouterOutputs["resource"]["getById"];
const MarkdownBlock = (props: {
  resource: Resource;
  section: keyof Resource;
  prefix?: string;
}) => {
  const { resource, section, prefix = "" } = props;
  const content = resource[section] as string;

  if (!content) {
    return null;
  }

  return (
    <>
      <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">{startCase(section)}</h2>
      <ReactMarkdown
        children={prefix + content}
        components={{
          a: ({ href, ref, ...props }) => {
            if (!href || !href.startsWith("resource/")) {
              return <a href={href} ref={ref} {...props} />;
            }

            return <Link href={"/" + href} {...props} />;
          },
        }}
      />
    </>
  );
};

export const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading } = api.resource.getById.useQuery({
    id,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`${resource.title} - The Improvitory`}</title>
      </Head>
      <PageLayout>
        <article className="prose max-w-full lg:prose-lg">
          <header className="flex flex-row">
            <h1 className="mb-4 grow">{resource.title}</h1>
            <Link href="/" className="hover:underline">
              Back to Home
            </Link>
          </header>

          <MarkdownBlock resource={resource} section={"description"} />
          <MarkdownBlock resource={resource} section={"format"} />
          <MarkdownBlock resource={resource} section={"purpose"} />
          <MarkdownBlock resource={resource} section={"examples"} />
          <MarkdownBlock resource={resource} section={"variations"} />
          <MarkdownBlock
            resource={resource}
            section={"showIntroduction"}
            prefix="> "
          />
          <MarkdownBlock resource={resource} section={"tips"} />
          <MarkdownBlock resource={resource} section={"extra"} />

          <hr className="my-3 lg:my-4" />

          <small className="italic">
            {resource.href && (
              <>
                This resource was auto-generated from the content found at{" "}
                <a href={resource.href}>{resource.href}</a>.
                {resource.origin && (
                  <>
                    <br />
                    <span className="mb-0 inline-block">
                      Origin of the resource according to the website linked
                      above:
                    </span>
                    <blockquote className="my-0 font-light lg:my-0">
                      <ReactMarkdown children={resource.origin} />
                    </blockquote>
                  </>
                )}
              </>
            )}
          </small>
        </article>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string" || id === "") throw new Error("No id");

  await ssg.resource.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default SinglePostPage;
