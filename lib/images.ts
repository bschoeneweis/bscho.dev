import fs from "fs";
import path from "path";

const touchGrassPath = 'public/images/touch-ai-grass';
const postsPath = path.join(process.cwd(), touchGrassPath);

export const getTouchGrassImageList = () => {
    const images = fs.readdirSync(postsPath);
    return { images, dirPath: touchGrassPath.replace('public/', '')};
}
