import { ArrowLink } from '@/components/ArrowLink';
import { InlineLink } from '@/components/InlineLink';

import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <h1 className={styles.nameIntro}>Bradley Schoeneweis</h1>
      <p className={styles.bioParagraph}>I&apos;m a senior engineer at <InlineLink href='https://radar.com'>Radar</InlineLink> working remotely in <InlineLink href='https://radar.com/demo/maps#13.45/-97.33066148935688/32.75466640633965'>Fort Worth, TX</InlineLink>.</p>
      <p className={styles.bioParagraph}>This is my stomping ground for occasional writing and references to interesting things i&apos;ve worked on.</p>
      <div className={styles.linkSection}>
        <ArrowLink href='https://www.linkedin.com/in/bradley-schoeneweis' isExternalLink>linkedin</ArrowLink>
        <ArrowLink href='https://github.com/bschoeneweis' isExternalLink>github</ArrowLink>
        <ArrowLink href='mailto:bradley.schoeneweis@gmail.com' isExternalLink>contact</ArrowLink>
        <ArrowLink href='/surprise'>surprise</ArrowLink>
      </div>
    </>
  );
}
