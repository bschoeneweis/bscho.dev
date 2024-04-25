import { Metadata } from "next";
import Link from "next/link";

import { getAllPostsMetadata, getFormattedDateString } from "@/lib/posts";

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Writing'
};

export default function WritingIndex() {
  const posts = getAllPostsMetadata();

  return (
    <div className={styles.postList}>
      {posts.map(({ slug, date, title, tags }) => (
        <Link key={slug} href={`/writing/${slug}`}>
          <div className={styles.postListItem}>
              <div className={styles.titleWrapper}>
                <p className={styles.dateLabel}>{getFormattedDateString(date)}</p>
                <p className={styles.articleTitle}>{title}</p>
              </div>
          </div>
        </Link>
      ))}
    </div>
  );
}