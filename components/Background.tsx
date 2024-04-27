import Image from 'next/image'
import React from 'react'

export const Background = () => (
  <Image
    alt="Background scribbles"
    src="/images/background.svg"
    quality={100}
    fill
    sizes="100vw"
    style={{ objectFit: 'cover', zIndex: -1 }}
  />
);
