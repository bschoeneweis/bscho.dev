import { parseISO, format } from 'date-fns'
import { Metadata } from "next";
import Link from "next/link";

import { getAllPostsMetadata } from "@/lib/posts";

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Writing'
};

const getDateString = (rawDate: string) => {
  const parsedDate = parseISO(rawDate);
  return format(parsedDate, 'LLLL d, yyyy');
}

export default function WritingIndex() {
  const posts = getAllPostsMetadata();

  return (
    <div className={styles.postList}>
      {posts.map(({ slug, date, title, tags }) => (
        <Link key={slug} href={`/writing/${slug}`}>
          <div className={styles.postListItem}>
              <div className={styles.titleWrapper}>
                <p className={styles.dateLabel}>{getDateString(date)}</p>
                <p>{title}</p>
              </div>
          </div>
        </Link>
      ))}
    </div>
  );
}