import React, { type JSX } from 'react';

import styles from './InlineLink.module.css';

export const InlineLink = ({
  children,
  href
}: {
  children: JSX.Element | string;
  href: string;
}) => (
  <a
    className={styles.inlineLink}
    href={href}
    target="_blank"
    rel="nofollow noopener noreferrer"
  >
    {children}
  </a>
);
