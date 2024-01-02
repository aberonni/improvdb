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
            <h1 className="mb-0 grow">{resource.title}</h1>
            <Link href="/" className="hover:underline">
              Back to Home
            </Link>
          </header>

          <p className="mb-4">{resource.type}</p>

          {resource.categories.length > 0 && (
            <>
              <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Categories</h2>
              <ul>
                {resource.categories.map(({ category }) => (
                  <li>{category.name}</li>
                ))}
              </ul>
            </>
          )}

          <MarkdownBlock resource={resource} section={"description"} />
          <MarkdownBlock resource={resource} section={"learningObjectives"} />
          <MarkdownBlock resource={resource} section={"examples"} />
          <MarkdownBlock resource={resource} section={"variations"} />
          <MarkdownBlock
            resource={resource}
            section={"showIntroduction"}
            prefix="> "
          />
          <MarkdownBlock resource={resource} section={"tips"} />
          <MarkdownBlock resource={resource} section={"origin"} />

          {resource.video && (
            <>
              <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Example Video</h2>
              <iframe
                className="video aspect-video w-full"
                title="Youtube player"
                sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
                src={`https://youtube.com/embed/${resource.video}?autoplay=0`}
              ></iframe>
            </>
          )}

          {resource.relatedResources.length > 0 && (
            <>
              <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Related Resources</h2>
              <ul>
                {resource.relatedResources.map(({ id, title }) => (
                  <li>
                    <Link href={`/resource/${id}`}>{title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
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
