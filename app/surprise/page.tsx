import Image from 'next/image'
import React from 'react'

import waffle1 from '@/public/images/waffle1.jpg'
import waffle2 from '@/public/images/waffle2.jpg'
import waffle3 from '@/public/images/waffle3.jpg'
import waffle4 from '@/public/images/waffle4.jpg'

import styles from './page.module.css'

export default function Surprise() {
  return (
    <>
      <div className={styles.gallery}>
        <Image
          alt="Golden retriever playing tug"
          src={waffle1}
        />
        <Image
          alt="Golden retriever with banana"
          src={waffle2}
        />
        <Image
          alt="Golden retriever sitting"
          src={waffle3}
        />
        <Image
          alt="Golden retriever laying down"
          src={waffle4}
        />
      </div>
      <p className={styles.caption}>This is my golden retriever, Waffle</p>
    </>
  );
}
