import { ArrowLink } from '@/components/ArrowLink';
import { InlineLink } from '@/components/InlineLink';

import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <h1 className={`${styles.nameIntro} homePageHeader`}>Bradley Schoeneweis</h1>
      <p className={styles.bioParagraph}>I&apos;m a senior engineer at <InlineLink href='https://radar.com'>Radar</InlineLink> working remotely in <InlineLink href='https://radar.com/demo/maps#14/32.75544435227022/-97.33047972836872'>Fort Worth, TX</InlineLink>.</p>
      <p className={styles.bioParagraph}>This is my medium for occasional writing and references to things I find interesting.</p>
      <div className={styles.linkSection}>
        <ArrowLink href='https://www.linkedin.com/in/bradley-schoeneweis' isExternalLink>linkedin</ArrowLink>
        <ArrowLink href='https://github.com/bschoeneweis' isExternalLink>github</ArrowLink>
        <ArrowLink href='mailto:bradley.schoeneweis@gmail.com' isExternalLink>contact</ArrowLink>
        <ArrowLink href='/surprise'>surprise</ArrowLink>
      </div>
    </>
  );
}
