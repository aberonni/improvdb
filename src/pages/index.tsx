import Head from "next/head";
import { useState } from "react";
import { LoadingPage } from "~/components/Loading";
import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";

const ResourceList = ({ filter }: { filter?: string }) => {
  const { data, isLoading } = api.resource.getAll.useQuery();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return <div>Something went wrong</div>;
  }

  const filterString = filter?.toLowerCase();

  const resources =
    !filterString || filterString === ""
      ? data
      : data.filter((resource) => {
          return resource.title.toLowerCase().includes(filterString);
        });

  return (
    <div className="flex flex-col gap-1">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="flex w-full flex-col gap-0 rounded-sm border border-slate-200  p-4"
        >
          <div className="font-bold">{resource.title}</div>
          {resource.categories.length > 0 && (
            <span className="mt-1 inline-block font-light text-slate-700">{`Categories: ${resource.categories.join(
              ", ",
            )}`}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  // start fetching asap - will used cached data later
  api.resource.getAll.useQuery();

  const [filter, setFilter] = useState("");

  return (
    <>
      <Head>
        <title>The Improvitory</title>
        <meta
          name="description"
          content="The ultimate repository for improv games & exercises."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout title="The Improvitory">
        <input
          type="text"
          value={filter}
          placeholder="Filter resources..."
          onChange={(e) => {
            setFilter(e.currentTarget.value);
          }}
          className="mb-4 w-full rounded-sm  border border-slate-300 px-4 py-3"
        />
        <ResourceList filter={filter} />
      </PageLayout>
    </>
  );
}
