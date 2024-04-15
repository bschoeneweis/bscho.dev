import Image from 'next/image'
import React from 'react'

import background from '../public/background.svg'

export const Background = () => (
  <Image
    alt="Background scribbles"
    src={background}
    quality={100}
    fill
    sizes="100vw"
    style={{ objectFit: 'cover', zIndex: -1 }}
  />
);
