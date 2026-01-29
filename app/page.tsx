import { ArrowLink } from '@/components/ArrowLink';
import { InlineLink } from '@/components/InlineLink';

import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <h1 className={`${styles.nameIntro} homePageHeader`}>Bradley Schoeneweis</h1>
      <p className={styles.bioParagraph}>I&apos;m a staff engineer at <InlineLink colorOverride='#4D1979' href='https://radar.com'>Radar</InlineLink> working remotely in <InlineLink colorOverride='#4D1979' href='https://radar.com/demo/maps#13/32.75452076202389/-97.33281488861735'>Fort Worth, TX</InlineLink>.</p>
      <p className={styles.bioParagraph}>This is my medium for occasional writing and references to things I find interesting.</p>
      <div className={styles.linkSection}>
        <ArrowLink href='https://www.linkedin.com/in/bradley-schoeneweis' isExternalLink>linkedin</ArrowLink>
        <ArrowLink href='https://github.com/bschoeneweis' isExternalLink>github</ArrowLink>
        <ArrowLink href='mailto:bradley.schoeneweis@gmail.com' isExternalLink>contact</ArrowLink>
        <ArrowLink href='/surprise'>surprise</ArrowLink>
        <ArrowLink href='/touch-ai-grass'>touch (gen ai) grass</ArrowLink>
      </div>
    </>
  );
}
