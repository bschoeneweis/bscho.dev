'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { Avatar } from './Avatar'

import styles from './Header.module.css'

const getOpacity = (activePath: string, headerPath: string) =>
  activePath === headerPath
    ? 1
    : 0.6;

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className={ styles.header }>
      <nav className={ styles.nav }>
        <div className={ styles.linkContainer }>
          <Link
            href={`/`}
            style={{ opacity: getOpacity(pathname, '/') }}
            className={ styles.linkHover }
          >
            about
          </Link>
          <Link
            href={`/writing`}
            style={{ opacity: getOpacity(pathname, '/writing') }}
            className={ styles.linkHover }
          >
            writing
          </Link>
          <Link
            href={`/works`}
            style={{ opacity: getOpacity(pathname, '/works') }}
            className={ styles.linkHover }
          >
            works
          </Link>
        </div>
        <div className={ styles.avatarContainer }>
          <Link href="/">
            <Avatar/>
          </Link>
        </div>
      </nav>
    </header>
  );
}