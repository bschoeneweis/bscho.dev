'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import styles from './TouchGrassSlideshow.module.css'
import { useRouter } from 'next/navigation'

interface TouchGrassSlideShowProps {
  imageList: string[];
  dirPath: string;
}

const homeSvg = (
  <svg
    height="16"
    strokeLinejoin="round"
    style={{ color: 'currentColor' }}
    viewBox="0 0 16 16"
    width="16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.5 6.56062L8.00001 2.06062L3.50001 6.56062V13.5L6.00001 13.5V11C6.00001 9.89539 6.89544 8.99996 8.00001 8.99996C9.10458 8.99996 10 9.89539 10 11V13.5L12.5 13.5V6.56062ZM13.78 5.71933L8.70711 0.646409C8.31659 0.255886 7.68342 0.255883 7.2929 0.646409L2.21987 5.71944C2.21974 5.71957 2.21961 5.7197 2.21949 5.71982L0.469676 7.46963L-0.0606537 7.99996L1.00001 9.06062L1.53034 8.53029L2.00001 8.06062V14.25V15H2.75001L6.00001 15H7.50001H8.50001H10L13.25 15H14V14.25V8.06062L14.4697 8.53029L15 9.06062L16.0607 7.99996L15.5303 7.46963L13.7806 5.71993C13.7804 5.71973 13.7802 5.71953 13.78 5.71933ZM8.50001 11V13.5H7.50001V11C7.50001 10.7238 7.72386 10.5 8.00001 10.5C8.27615 10.5 8.50001 10.7238 8.50001 11Z"
      fill="currentColor"
    ></path>
  </svg>
);

export const TouchGrassSlideShow = ({ imageList, dirPath }: TouchGrassSlideShowProps) => {
  const router = useRouter();

  const [shuffledImages, setShuffledImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timerKey, setTimerKey] = useState<number>(0);

  const shuffleArray = useCallback((array: string[]): string[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  useEffect(() => {
    if (imageList.length > 0) {
      setShuffledImages(shuffleArray(imageList));
    }
  }, [imageList, shuffleArray]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 >= shuffledImages.length ? 0 : prev + 1));
    setTimerKey((prev) => prev + 1); // reset the timer
  }, [shuffledImages.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 < 0 ? shuffledImages.length - 1 : prev - 1));
    setTimerKey((prev) => prev + 1); // reset the timer
  }, [shuffledImages.length]);

  useEffect(() => {
    if (shuffledImages.length === 0) return;

    const interval = setInterval(() => {
      goToNext();
    }, 10000);

    return () => clearInterval(interval);
  }, [shuffledImages, goToNext, timerKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          router.push('/');
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, goToNext, goToPrevious]);

  const currentImage = shuffledImages[currentIndex];

  return (
    <div className={styles.container}>
      <Image
        src={`/${dirPath}/${currentImage}`}
        alt="Slideshow image"
        fill
        className={styles.image}
        priority
      />

      <div className={styles.overlay}>
        <div className={styles.controlsRow}>
          <button onClick={goToPrevious} className={styles.navButton} aria-label="Previous">
            ❮
          </button>

          <div className={styles.progressContainer}>
            <div
              key={`${currentIndex}-${timerKey}`}
              className={styles.progressBar}
            />
          </div>

          <button onClick={goToNext} className={styles.navButton} aria-label="Next">
            ❯
          </button>
        </div>

        <Link
          href="/"
          className={styles.backButton}
        >
          {homeSvg}
        </Link>
      </div>
    </div>
  );
}