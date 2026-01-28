'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { Avatar } from './Avatar'

import styles from './Header.module.css'

const getClass = (activePath: string, headerPath: string) =>
  activePath === headerPath
    ? 'active'
    : 'linkHover';

export const Header = () => {
  const pathname = usePathname();

  if (pathname === '/touch-ai-grass') {
    return <></>;
  }

  return (
    <header className={ styles.header }>
      <nav className={ styles.nav }>
        <div className={ styles.linkContainer }>
          <Link
            href={`/`}
            className={ styles[getClass(pathname, '/')] }
          >
            about
          </Link>
          <Link
            href={`/writing`}
            className={ styles[getClass(pathname, '/writing')] }
          >
            writing
          </Link>
          <Link
            href={`/works`}
            className={ styles[getClass(pathname, '/works')] }
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