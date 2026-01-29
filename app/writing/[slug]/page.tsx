import { notFound } from 'next/navigation';

import { getAllPostSlugs, getFormattedDateString, getPost } from '@/lib/posts';

import styles from './page.module.css';
import { CustomMDX } from '@/components/CustomMDX';

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getAllPostSlugs();
}

export default async function Post(props: { params: Params }) {
  const params = await props.params;
  const { slug } = params;
  const postData = await getPost(slug);

  if (!postData) {
    return notFound();
  }

  const { title, date, markdownContent } = postData;

  return (
    <article className="writingPostPage">
      <div className={styles.articleHeading}>
        <h1 className={styles.xlHeading}>{title}</h1>
        <small className={styles.dateSubtitle}>{getFormattedDateString(date)}</small>
      </div>
      <CustomMDX source={markdownContent} />
    </article>
  );
}