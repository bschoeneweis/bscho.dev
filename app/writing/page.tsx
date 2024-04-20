import { parseISO, format } from 'date-fns'
import { Metadata } from "next";
import Link from "next/link";

import { getAllPostsMetadata } from "@/lib/posts";

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Writing'
};


const DateLabel = ({ dateRaw }: { dateRaw: string }) => {
  const date = parseISO(dateRaw);
  return <time dateTime={dateRaw}>{format(date, 'LLLL d, yyyy')}</time>
};

export default function WritingIndex() {
  const posts = getAllPostsMetadata();

  return (
    <ul className={styles.postList}>
      {posts.map(({ slug, date, title, tags }) => (
        <li key={slug} className={styles.postListItem}>
          <Link href={`/writing/${slug}`} className={styles.title}>
            {title}
          </Link>
          <br />
          <small className={styles.subtitle}>
            <DateLabel dateRaw={date} /> &bull; {tags.join(', ')}
          </small>
        </li>
      ))}
    </ul>
  );
}