import { notFound } from 'next/navigation';

import { getFormattedDateString, getPost } from '@/lib/posts';

import styles from './page.module.css';
import { CustomMDX } from '@/components/CustomMDX';

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
      <CustomMDX source={markdownContent} />
    </article>
  );
}