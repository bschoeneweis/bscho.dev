import Image from 'next/image'
import React from 'react'

const AVATAR_SIZE = 50;

export const Avatar = () => (
  <div style={{
    borderRadius: '50%',
    overflow: 'hidden',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
    flexShrink: 0,
  }}>
    <Image
      alt="Profile"
      src="/images/profile.jpg"
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
    />
  </div>
);