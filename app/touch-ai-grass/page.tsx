import { TouchGrassSlideShow } from '@/components/TouchGrassSlideshow';
import { getTouchGrassImageList } from '@/lib/images';

function shuffleArray(array: string[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default async function TouchAiGrass() {
  const { images, dirPath } = getTouchGrassImageList();
  const shuffledImages = shuffleArray(images);

  return (
    <TouchGrassSlideShow images={shuffledImages} dirPath={dirPath} />
  );
}
