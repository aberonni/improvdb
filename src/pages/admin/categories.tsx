import { UserRole } from "@prisma/client";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { categoryLandingPage } from "@/lib/landing-page";
import { type RouterOutputs, api } from "@/utils/api";

type Category = RouterOutputs["category"]["getAll"][0];

function CategoryDescriptionForm({ category }: { category: Category }) {
  const [description, setDescription] = useState(category.description ?? "");
  const utils = api.useUtils();
  const { toast } = useToast();
  const showError = useErrorToast();

  const { mutate, isPending } = api.category.update.useMutation({
    onSuccess: () => {
      void utils.category.invalidate();
      toast({ title: "Saved", description: `${category.name} updated.` });
    },
    onError: (e) => showError(e, "Please try again later."),
  });

  const id = `category-${category.id}`;
  const count = category._count.resources;
  const page = categoryLandingPage(category);
  const isDirty = description !== (category.description ?? "");

  return (
    <form
      className="space-y-2 border-b pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutate({ id: category.id, description });
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-base">
          {category.name}
        </Label>
        <span className="text-sm text-muted-foreground">
          {count} published
          {!page.indexable && " · not indexed"} ·{" "}
          <Link href={page.path} className="underline">
            View page
          </Link>
        </span>
      </div>
      <Textarea
        id={id}
        rows={4}
        value={description}
        placeholder="Introduction shown at the top of the category page. Separate paragraphs with a blank line."
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={!isDirty || isPending}>
        Save
      </Button>
    </form>
  );
}

export default function AdminCategories() {
  const { data: categories, isLoading } = api.category.getAll.useQuery();

  return (
    <>
      <Head>
        <title>Categories - ImprovDB</title>
      </Head>
      <PageLayout title="Categories" authenticatedOnly={[UserRole.ADMIN]}>
        {isLoading ? (
          <LoadingPage />
        ) : (
          <div className="max-w-3xl space-y-6">
            {categories?.map((category) => (
              <CategoryDescriptionForm key={category.id} category={category} />
            ))}
          </div>
        )}
      </PageLayout>
    </>
  );
}
