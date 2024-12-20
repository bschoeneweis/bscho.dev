import fs from "fs";
import path from "path";

import { parseISO, format } from 'date-fns'
import matter from "gray-matter";
import html from "remark-html";
import { remark } from "remark";

interface PostMatterMetadata {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  description: string;
  hidden?: boolean;
}

interface Post extends PostMatterMetadata {
  htmlContent: string;
  markdownContent: string;
}

const postsPath = path.join(process.cwd(), 'posts');

const getSlug = (fileName: string) => fileName.replace(/\.mdx$/, '');

export const getAllPostsMetadata = (): PostMatterMetadata[] => {
  const files = fs.readdirSync(postsPath);

  const posts: PostMatterMetadata[] = files
    .map((fileName) => {
      const slug = getSlug(fileName);
      const filePath = path.join(postsPath, fileName);

      const contentString = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(contentString);

      return { slug, ...matterResult.data } as PostMatterMetadata;
    })
    .filter((postMetadata) => postMetadata.hidden !== true)
    .sort(({ date: a }, { date: b }) => {
      if (a < b) {
        return 1;
      } else if (a > b) {
        return -1;
      } else {
        return 0;
      }
    });

  return posts;
}

export const getAllPostSlugs = (): { slug: string }[] => {
  const files = fs.readdirSync(postsPath);
  return files.map((fileName) => {
    const slug = getSlug(fileName);
    return { slug };
  });
}

export const getPost = async (slug: string): Promise<Post | undefined> => {
  const filePath = path.join(postsPath, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const contentString = fs.readFileSync(filePath, 'utf8');

  const matterResult = matter(contentString);
  const { data, content: markdownContent } = matterResult;
  const processedContent = await remark()
    .use(html)
    .process(markdownContent);
  const htmlContent = processedContent.toString();

  return {
    slug,
    htmlContent,
    markdownContent,
    ...data,
  } as Post;
}

export const getFormattedDateString = (rawDate: string) => {
  const parsedDate = parseISO(rawDate);
  return format(parsedDate, 'LLLL d, yyyy');
}
