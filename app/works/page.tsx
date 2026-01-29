import { Metadata } from "next";

import styles from './page.module.css';
import { ArrowLink } from '@/components/ArrowLink';

export const metadata: Metadata = {
  title: 'Works'
};

export default function WorksIndex() {
  return (
    <>
    <p className={`${styles.worksTitle} fixedPage`}>A few interesting things I&apos;ve worked on:</p>
    <div className={styles.linkList}>
      <ArrowLink href='http://archive.today/ZyzEk' isExternalLink>
        <span className={styles.linkListItem}>How we replaced Elasticsearch and MongoDB with Rust and RocksDB</span>
      </ArrowLink>
      <ArrowLink href='http://archive.today/JpUFK' isExternalLink>
        <span className={styles.linkListItem}>Announcing our new address validation API</span>
      </ArrowLink>
      <ArrowLink href='http://archive.today/o98AA' isExternalLink>
        <span className={styles.linkListItem}>Place matching: A more accurate way to manage POI data</span>
      </ArrowLink>
    </div>
    </>
  );
}