import React from 'react'
import Link from 'next/link';

import styles from './ArrowLink.module.css';

const arrowSvg = (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    style={{ color: 'currentcolor', marginRight: '5px' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.75001 2H5.00001V3.5H5.75001H11.4393L2.21968 12.7197L1.68935 13.25L2.75001 14.3107L3.28034 13.7803L12.4988 4.56182V10.25V11H13.9988V10.25V3C13.9988 2.44772 13.5511 2 12.9988 2H5.75001Z"
      fill="currentColor"
    ></path>
  </svg>
);

export const ArrowLink = ({
  children,
  href,
  isExternalLink,
}: {
  children: JSX.Element | string;
  href: string;
  isExternalLink?: boolean;
}) => (
  isExternalLink
    ? (
      <a
        className={styles.arrowLink}
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        {arrowSvg}
        {children}
      </a>
    ): (
      <Link
        className={styles.arrowLink}
        href={href}
      >
        {arrowSvg}
        {children}
      </Link>
    )
);