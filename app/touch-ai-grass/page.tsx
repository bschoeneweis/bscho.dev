import { TouchGrassSlideShow } from '@/components/TouchGrassSlideshow';
import { getTouchGrassImageList } from '@/lib/images';

export default async function TouchAiGrass() {
  const { images, dirPath } = getTouchGrassImageList();
  return (
    <main>
      <TouchGrassSlideShow imageList={images} dirPath={dirPath} />
    </main>
  );
}
