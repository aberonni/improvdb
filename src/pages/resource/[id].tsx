import Head from "next/head";
import { api } from "~/utils/api";

import ReactMarkdown from "react-markdown";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import Link from "next/link";
import { LoadingPage } from "~/components/Loading";

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

          <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Description</h2>
          <ReactMarkdown
            children={resource.description}
            components={{
              a: ({ href, ref, ...props }) => {
                if (!href || !href.startsWith("resource/")) {
                  return <a href={href} ref={ref} {...props} />;
                }

                return <Link href={"/" + href} {...props} />;
              },
            }}
          />

          {resource.showIntroduction && (
            <>
              <h2 className="mb-1 mt-0 lg:mb-2 lg:mt-0">Show Introduction</h2>
              <blockquote>{resource.showIntroduction}</blockquote>
            </>
          )}

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
