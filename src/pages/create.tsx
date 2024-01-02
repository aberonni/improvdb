import Head from "next/head";
import { kebabCase, startCase } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import type * as z from "zod";
import toast from "react-hot-toast";

import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";
import { resourceCreateSchema } from "~/utils/zod";
import { useRouter } from "next/router";
import MultiSelectDropown from "~/components/MultiSelectDropdown";
import { ResourceType } from "@prisma/client";

type CreateSchemaType = z.infer<typeof resourceCreateSchema>;

const MarkdownField = ({
  register,
  errors,
  field,
  required = false,
}: {
  register: UseFormRegister<CreateSchemaType>;
  errors: FieldErrors<CreateSchemaType>;
  field: keyof CreateSchemaType;
  required?: boolean;
}) => {
  return (
    <div className="col-span-full">
      <label
        htmlFor={field}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {startCase(field)}
        {required && <span className="text-red-700">*</span>}
      </label>
      <div className="mt-2">
        <textarea
          id={field}
          {...register(field)}
          rows={3}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      {errors[field]?.message && (
        <p className="mt-1 text-sm leading-6 text-red-700">
          {errors[field]?.message}
        </p>
      )}
    </div>
  );
};

export default function Create() {
  const router = useRouter();

  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();
  const { data: resources, isLoading: isLoadingResources } =
    api.resource.getAllOnlyIdAndTitle.useQuery();

  const utils = api.useUtils();

  const { mutate: createResource, isLoading: isCreating } =
    api.resource.create.useMutation({
      onSuccess: ({ resource }) => {
        void router.push("/resource/" + resource.id);
        // incredible magic that makes the "getAll" automatically re-trigger
        void utils.resource.getAll.invalidate();
      },
      onError: (e) => {
        if (e.data?.code === "CONFLICT") {
          toast.error(
            "A resource already exists at this URL. Please choose a new URL.",
          );
          return;
        }

        const errorMessage =
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }
        toast.error("Failed to post! Please try again later.");
      },
    });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<CreateSchemaType>({
    resolver: zodResolver(resourceCreateSchema),
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof resourceCreateSchema>) {
    if (isCreating) {
      return;
    }
    createResource(values);
  }

  if (errors) {
    console.log("Form errors:");
    console.log(errors);
    console.log("Form values:");
    console.log(getValues());
  }

  return (
    <>
      <Head>
        <title>Create Resource - The Improvitory</title>
      </Head>
      <PageLayout>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                Create New Resource
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="col-span-full">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Title<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <div className="flex w-full rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                      <input
                        type="text"
                        {...register("title")}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="My favourite game"
                        onChange={(e) =>
                          setValue("id", kebabCase(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  {errors.title?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.title?.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    URL<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                      <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                        /resource/
                      </span>
                      <input
                        type="text"
                        {...register("id")}
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder="my-favourite-game"
                      />
                    </div>
                  </div>
                  {errors.id?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.id?.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Resource Type<span className="text-red-700">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register("type")}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      <option value={ResourceType.EXERCISE}>
                        Warm-up / Exercise
                      </option>
                      <option value={ResourceType.SHORT_FORM}>
                        Short Form Game
                      </option>
                      <option value={ResourceType.LONG_FORM}>
                        Long Form Format
                      </option>
                    </select>
                  </div>
                </div>

                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"description"}
                  required
                />

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Categories
                  </label>
                  <div className="mt-2">
                    <Controller
                      name="categories"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectDropown
                          {...field}
                          isLoading={isLoadingCategories}
                          loadingMessage={() => "Loading categories..."}
                          options={categories?.map(({ id, name }) => ({
                            label: name,
                            value: id,
                          }))}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="relatedResources"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Related Resources
                  </label>
                  <div className="mt-2">
                    <Controller
                      name="relatedResources"
                      control={control}
                      render={({ field }) => (
                        <MultiSelectDropown
                          {...field}
                          isLoading={isLoadingResources}
                          loadingMessage={() => "Loading resources..."}
                          options={resources?.map(({ id, title }) => ({
                            label: title,
                            value: id,
                          }))}
                        />
                      )}
                    />
                  </div>
                </div>

                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"examples"}
                />
                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"origin"}
                />
                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"learningObjectives"}
                />
                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"showIntroduction"}
                />
                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"tips"}
                />
                <MarkdownField
                  register={register}
                  errors={errors}
                  field={"variations"}
                />

                <div className="col-span-full">
                  <label
                    htmlFor="video"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    YouTube Video ID
                  </label>
                  <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                      <input
                        type="text"
                        {...register("video")}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="123456789AB"
                      />
                    </div>
                  </div>
                  {errors.video?.message && (
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {errors.video?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              disabled={isCreating}
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save
            </button>
          </div>
        </form>
      </PageLayout>
    </>
  );
}
