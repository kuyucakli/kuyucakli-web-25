import { glob, file } from "astro/loaders";
import { defineCollection, z } from "astro:content";



const posts = defineCollection({

    loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/posts" }),
    schema: ({ image }) => z.object({
        title: z.string(),
        excerpt: z.string(),
        poster: image(),
        posterFitCss: z.string().optional(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        published: z.boolean(),
        pinned: z.boolean(),
        category: z.enum(["blog", "work", "author", "home-intro"]),
        excerptTemplate: z.enum(["text-only-big-heading", "full-cover-only", "two-parts", "text-on-cover"]).optional(),
        tags: z.array(z.string()),
        link: z.string().url().optional(),
    }),
})

const drawingImages = defineCollection({
    loader: glob({ pattern: "**/*.(md|mdx)", base: "./src/data/drawing-images" }),
    schema: ({ image }) => z.object(
        {
            file: image(),
            altText: z.string().max(40),
            excerpt: z.string(),
            description: z.string().optional(),
            createdAt: z.coerce.date(),
            category: z.enum(["watercolor", "pen", "digital-illustration", "oil", "acrylic"]),
            link: z.string().url().optional(),
        }
    )
})

export const collections = { posts, drawingImages };