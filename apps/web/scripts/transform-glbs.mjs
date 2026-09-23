import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function transformGlb({ inputPath, backupPath, rotation, scale, nodeName }) {
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
  }

  const raw = fs.readFileSync(backupPath);
  const magic = raw.readUInt32LE(0);
  const version = raw.readUInt32LE(4);
  const totalLength = raw.readUInt32LE(8);

  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error(`Invalid GLB file: ${inputPath}`);
  }

  const jsonLen = raw.readUInt32LE(12);
  const jsonType = raw.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) {
    throw new Error(`Chunk 0 is not JSON in: ${inputPath}`);
  }

  const jsonStr = raw.toString('utf8', 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);

  const binChunkOffset = 20 + jsonLen;
  const binChunk = raw.subarray(binChunkOffset);

  // Get current root nodes of active scene
  const activeSceneIdx = gltf.scene ?? 0;
  const scene = gltf.scenes[activeSceneIdx];
  const oldRootNodes = [...scene.nodes];

  // Create new root node wrapping the existing roots
  const newRootIdx = gltf.nodes.length;
  const newRootNode = {
    name: nodeName,
    children: oldRootNodes,
    rotation: rotation,
    scale: scale
  };

  gltf.nodes.push(newRootNode);
  scene.nodes = [newRootIdx];

  // Serialize JSON with 4-byte padding
  const newJsonStr = JSON.stringify(gltf);
  const newJsonBuffer = Buffer.from(newJsonStr, 'utf8');
  const padLength = (4 - (newJsonBuffer.length % 4)) % 4;
  const paddedJsonBuffer = padLength > 0
    ? Buffer.concat([newJsonBuffer, Buffer.alloc(padLength, 0x20)])
    : newJsonBuffer;

  // Build new GLB buffer
  const newTotalLength = 12 + 8 + paddedJsonBuffer.length + binChunk.length;
  const headerBuf = Buffer.alloc(12);
  headerBuf.writeUInt32LE(0x46546c67, 0); // "glTF"
  headerBuf.writeUInt32LE(2, 4); // version 2
  headerBuf.writeUInt32LE(newTotalLength, 8);

  const chunk0Header = Buffer.alloc(8);
  chunk0Header.writeUInt32LE(paddedJsonBuffer.length, 0);
  chunk0Header.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const outBuf = Buffer.concat([
    headerBuf,
    chunk0Header,
    paddedJsonBuffer,
    binChunk
  ]);

  fs.writeFileSync(inputPath, outBuf);
  console.log(`Successfully transformed: ${inputPath} (New size: ${outBuf.length} bytes, Root: node ${newRootIdx})`);
}

// 1. Car: identity rotation ([0, 0, 0, 1]), scale 120.0x (front is natively +Z, bringing 0.039m up to 4.68m real-world sports car length)
transformGlb({
  inputPath: path.join(__dirname, '../public/models/car.glb'),
  backupPath: path.join(__dirname, '../public/models/car.glb.orig'),
  rotation: [0, 0, 0, 1],
  scale: [120.0, 120.0, 120.0],
  nodeName: 'Root_Scale_120_0'
});

// 2. Airplane: identity rotation ([0, 0, 0, 1]), scale 2.5x
transformGlb({
  inputPath: path.join(__dirname, '../public/models/airplane.glb'),
  backupPath: path.join(__dirname, '../public/models/airplane.glb.orig'),
  rotation: [0, 0, 0, 1],
  scale: [2.5, 2.5, 2.5],
  nodeName: 'Root_Scale_2_5'
});
