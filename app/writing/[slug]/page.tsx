import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation';

import { getFormattedDateString, getPost } from "@/lib/posts";

import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import styles from './page.module.css';

type PageProps = { params: { slug: string }}

export default async function Post({ params }: PageProps) {
  const { slug } = params;
  const postData = await getPost(slug);

  if (!postData) {
    return notFound();
  }

  const { title, date, markdownContent } = postData;

  return (
    <article>
      <div className={styles.articleHeading}>
        <h1 className={styles.xlHeading}>{title}</h1>
        <small className={styles.dateSubtitle}>{getFormattedDateString(date)}</small>
      </div>
      <MDXRemote source={markdownContent} options={{
        mdxOptions: {
          rehypePlugins: [
            [rehypeSlug, {}],
            [rehypeAutolinkHeadings, {}],
            [rehypePrettyCode as any, { theme: 'github-dark' }],
          ]
        }
      }} />
    </article>
  );
}