import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];

export function getMediaType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  return 'unknown';
}

export async function extractFrames(mediaPath, outputDir) {
  const mediaType = getMediaType(mediaPath);

  if (mediaType === 'image') {
    // For images, just return the image itself as the only "frame"
    const destPath = path.join(outputDir, 'frame_001.jpg');
    if (path.extname(mediaPath).toLowerCase() === '.jpg' || path.extname(mediaPath).toLowerCase() === '.jpeg') {
      fs.copyFileSync(mediaPath, destPath);
    } else {
      // Use ffmpeg to convert to jpg
      await new Promise((resolve, reject) => {
        ffmpeg(mediaPath)
          .outputOptions(['-vframes 1', '-q:v 2'])
          .output(destPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    }
    return [destPath];
  }

  if (mediaType === 'video') {
    // Extract 1 frame every 2 seconds
    const duration = await getVideoDuration(mediaPath);
    const timestamps = [];
    for (let t = 0; t < duration; t += 2) {
      timestamps.push(Math.floor(t));
    }

    const frames = [];
    for (let i = 0; i < timestamps.length; i++) {
      const outPath = path.join(outputDir, `frame_${String(i + 1).padStart(3, '0')}.jpg`);
      await extractSingleFrame(mediaPath, timestamps[i], outPath);
      if (fs.existsSync(outPath)) frames.push(outPath);
    }
    return frames;
  }

  return [];
}

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 30);
    });
  });
}

function extractSingleFrame(filePath, timestamp, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .seekInput(timestamp)
      .outputOptions(['-vframes 1', '-q:v 2'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => {
        console.warn(`[mediaIngestor] Frame extraction warning at ${timestamp}s:`, err.message);
        resolve(); // Don't reject — just skip this frame
      })
      .run();
  });
}
