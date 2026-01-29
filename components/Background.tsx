'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'

export const Background = () => {
  const pathname = usePathname();
  const isWriting = pathname.startsWith('/writing/');
  const bgImage = isWriting ? 'background.svg' : 'rolling-hills.png';
  const src = `/images/${bgImage}`;

  return (
    <div className="background-root">
      <Image
        alt="Background"
        src={src}
        quality={100}
        fill
        sizes="100vw"
        priority
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
};
