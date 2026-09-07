import { execFileSync } from 'child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

const ffmpegPath = ffmpeg.path;
const publicImagesDir = path.resolve('..', 'frontend', 'public', 'images');

console.log('Using ffmpeg at:', ffmpegPath);
console.log('Target directory:', publicImagesDir);

function safeReplace(tempPath, destPath) {
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
  }
  fs.copyFileSync(tempPath, destPath);
  fs.unlinkSync(tempPath);
}

// 1. Compress Video: WhatsApp Video 2026-07-29 at 3.56.51 PM.mp4
const videoFile = path.join(publicImagesDir, 'WhatsApp Video 2026-07-29 at 3.56.51 PM.mp4');
if (fs.existsSync(videoFile)) {
  const statBefore = fs.statSync(videoFile).size;
  console.log(`Compressing Video (${(statBefore / (1024 * 1024)).toFixed(2)} MB)...`);
  const tempOut = path.join(publicImagesDir, 'temp_video_compressed.mp4');
  
  // CRF 31, 540p max width, AAC 48k mono audio for maximum compression
  execFileSync(ffmpegPath, [
    '-y',
    '-i', videoFile,
    '-vf', "scale='min(540,iw)':-2",
    '-c:v', 'libx264',
    '-crf', '30',
    '-preset', 'slow',
    '-c:a', 'aac',
    '-b:a', '48k',
    '-ac', '1',
    '-movflags', '+faststart',
    tempOut
  ]);

  const statAfter = fs.statSync(tempOut).size;
  console.log(`Video compressed: ${(statBefore / 1024 / 1024).toFixed(2)} MB -> ${(statAfter / 1024 / 1024).toFixed(2)} MB`);
  safeReplace(tempOut, videoFile);
}

// 2. Compress Audio in MP4: WhatsApp Audio 2026-07-29 at 3.56.51 PM.mp4
const audioMp4File = path.join(publicImagesDir, 'WhatsApp Audio 2026-07-29 at 3.56.51 PM.mp4');
if (fs.existsSync(audioMp4File)) {
  const statBefore = fs.statSync(audioMp4File).size;
  console.log(`Compressing Audio MP4 (${(statBefore / (1024 * 1024)).toFixed(2)} MB)...`);
  const tempOut = path.join(publicImagesDir, 'temp_audio_compressed.mp4');
  
  execFileSync(ffmpegPath, [
    '-y',
    '-i', audioMp4File,
    '-c:a', 'aac',
    '-b:a', '32k',
    '-ac', '1',
    '-vn',
    tempOut
  ]);

  const statAfter = fs.statSync(tempOut).size;
  console.log(`Audio MP4 compressed: ${(statBefore / 1024 / 1024).toFixed(2)} MB -> ${(statAfter / 1024 / 1024).toFixed(2)} MB`);
  safeReplace(tempOut, audioMp4File);
}

// 3. Compress enquiry-audio.mp3
const enquiryAudio = path.join(publicImagesDir, 'enquiry-audio.mp3');
if (fs.existsSync(enquiryAudio)) {
  const statBefore = fs.statSync(enquiryAudio).size;
  console.log(`Compressing enquiry-audio.mp3 (${(statBefore / (1024 * 1024)).toFixed(2)} MB)...`);
  const tempOut = path.join(publicImagesDir, 'temp_enquiry_compressed.mp3');
  
  execFileSync(ffmpegPath, [
    '-y',
    '-i', enquiryAudio,
    '-c:a', 'libmp3lame',
    '-b:a', '32k',
    '-ac', '1',
    tempOut
  ]);

  const statAfter = fs.statSync(tempOut).size;
  console.log(`enquiry-audio.mp3 compressed: ${(statBefore / 1024 / 1024).toFixed(2)} MB -> ${(statAfter / 1024 / 1024).toFixed(2)} MB`);
  safeReplace(tempOut, enquiryAudio);
}

// 4. Compress all customer*.mp3 files
const files = fs.readdirSync(publicImagesDir);
for (const file of files) {
  if (file.startsWith('customer') && file.endsWith('.mp3')) {
    const fullPath = path.join(publicImagesDir, file);
    const statBefore = fs.statSync(fullPath).size;
    const tempOut = path.join(publicImagesDir, `temp_${file}`);

    execFileSync(ffmpegPath, [
      '-y',
      '-i', fullPath,
      '-c:a', 'libmp3lame',
      '-b:a', '32k',
      '-ac', '1',
      tempOut
    ]);

    const statAfter = fs.statSync(tempOut).size;
    console.log(`${file}: ${(statBefore / 1024).toFixed(1)} KB -> ${(statAfter / 1024).toFixed(1)} KB`);
    safeReplace(tempOut, fullPath);
  }
}

console.log('All media compression completed successfully!');
