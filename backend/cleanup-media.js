const fs = require('fs');
const path = require('path');

const cleanedExercisesFile = path.join(__dirname, 'cleaned-exercises.json');
const imagesDir = path.join(__dirname, '../frontend/public/images');
const videosDir = path.join(__dirname, '../frontend/public/videos');

// 1. Read all needed images/videos from cleaned-exercises.json
const rawData = fs.readFileSync(cleanedExercisesFile, 'utf-8');
const exercises = JSON.parse(rawData);

const neededImages = new Set();
const neededVideos = new Set();

exercises.forEach(ex => {
  if (ex.imageUrl) {
    const filename = ex.imageUrl.replace('images/', '');
    neededImages.add(filename);
  }
  if (ex.videoUrl && ex.videoUrl.startsWith('videos/')) {
    const filename = ex.videoUrl.replace('videos/', '');
    neededVideos.add(filename);
  }
});

// 2. Scan frontend/public/images and delete unused
let deletedImages = 0;
if (fs.existsSync(imagesDir)) {
  const allImages = fs.readdirSync(imagesDir);
  allImages.forEach(file => {
    if (!neededImages.has(file)) {
      fs.unlinkSync(path.join(imagesDir, file));
      deletedImages++;
    }
  });
}

// 3. Scan frontend/public/videos and delete unused
let deletedVideos = 0;
if (fs.existsSync(videosDir)) {
  const allVideos = fs.readdirSync(videosDir);
  allVideos.forEach(file => {
    if (!neededVideos.has(file)) {
      fs.unlinkSync(path.join(videosDir, file));
      deletedVideos++;
    }
  });
}

console.log(`Cleanup Complete!`);
console.log(`- Kept ${neededImages.size} required images.`);
console.log(`- Deleted ${deletedImages} unused images.`);
console.log(`- Deleted ${deletedVideos} unused videos.`);
