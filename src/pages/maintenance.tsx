import Head from "next/head";

export default function Maintenance() {
  return (
    <>
      <Head>
        <title>Maintenance Mode - ImprovDB</title>
      </Head>
      <div className="min-h-full">
        <main>
          <div className="relative mx-auto max-w-7xl p-6 text-center lg:pt-12">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Under Maintenance
            </h1>
            <p className="mt-6 leading-7">
              The website is undergoing scheduled maintenance. Please try
              reloading the page in a few minutes.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
