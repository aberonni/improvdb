import { infer as zodInfer } from 'zod';
import { ResourceConfiguration, ResourceType,ResourcePublicationStatus } from "@prisma/client";

import { resourceUpdateSchema } from "@/utils/zod";

export type CreateSchemaType = zodInfer<typeof resourceUpdateSchema>;

export const createFormDefaults: Partial<CreateSchemaType> = {
  id: "",
  title: "",
  alternativeNames: [],
  categories: [],
  publicationStatus: ResourcePublicationStatus.DRAFT,
  relatedResources: [],
  type: ResourceType.EXERCISE,
  configuration: ResourceConfiguration.SCENE,
  description: `Write a description of the warm-up/exercise/game etc. Include any and all details that you think are important. This is the first thing people will see when looking at your resource.

  You can use markdown to format your text. For example **bold text**, *italic text*, and [links](https://your.url). Click on the "Preview" button to see what your text will look like.

  Here are some sections that you might want to include in your description:

  ## Setup

  How do you set up the activity? What are the rules? How do you explain them to the participants? How do you get the participants to start?

  ## Learning Objectives

  What are the learning objectives of the activity? What skills does it help the participants develop?

  ## Examples

  You could consider writing a sample dialogue between you and the participants, a sample playthrough of the activity, or anything else that you think is relevant.

  ## Tips

  Any tips that you have for the participants? Any common mistakes that you want to warn them about? Any advice that you want to give them?

  ## Variations

  Are there any variations of this activity that you want to share? For example, you could change the rules, add/remove some constraints, change the goal of the activity, or anything else that you think is relevant.`,
};
