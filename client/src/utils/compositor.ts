// Remove crossOrigin to avoid CORS on same-origin assets
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // img.crossOrigin = "anonymous"; // <-- delete this line
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Given 68-point landmarks, compute a reasonable placement for a headband
function faceAngleDeg(landmarks: {x:number;y:number}[]) {
  // 0 = left jaw, 16 = right jaw, 27 = nose bridge, 30 = nose tip
  const L = landmarks[0], R = landmarks[16], N = landmarks[27];
  if (!L || !R || !N) return 0;
  const dx = R.x - L.x, dy = R.y - L.y;
  const angle = Math.atan2(dy, dx); // radians
  return (angle * 180) / Math.PI;
}

export function drawWrappedBandana(
  ctx: CanvasRenderingContext2D,
  bandanaImg: HTMLImageElement,
  landmarks: {x:number;y:number}[]
) {
  const L = landmarks[0], R = landmarks[16], B = landmarks[27]; // top of nose bridge
  if (!L || !R || !B) return;

  const centerX = (L.x + R.x) / 2;
  const jawWidth = Math.hypot(R.x - L.x, R.y - L.y);
  const angle = Math.atan2(R.y - L.y, R.x - L.x);

  // Place the bandana slightly above the eyebrows (relative to nose bridge)
  const offsetY = -0.35 * jawWidth; // tune as needed
  const drawWidth = jawWidth * 1.15;
  const aspect = bandanaImg.width / bandanaImg.height;
  const drawHeight = drawWidth / aspect;

  ctx.save();
  ctx.translate(centerX, B.y + offsetY);
  ctx.rotate(angle);
  ctx.drawImage(
    bandanaImg,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();
}

export async function compositeImage(opts: {
  canvas: HTMLCanvasElement;
  selfieFrame?: HTMLVideoElement | HTMLImageElement;
  background?: HTMLImageElement;
  bandana?: HTMLImageElement;
  landmarks?: {x:number;y:number}[];
  logo?: HTMLImageElement;
}) {
  const { canvas, selfieFrame, background, bandana, landmarks, logo } = opts;
  const ctx = canvas.getContext("2d")!;
  
  console.log("🎨 compositeImage called with:", {
    canvasSize: `${canvas.width}x${canvas.height}`,
    hasBackground: !!background,
    hasSelfie: !!selfieFrame,
    hasBandana: !!bandana,
    landmarkCount: landmarks?.length || 0,
    hasLogo: !!logo
  });
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1) Background first
  if (background) {
    console.log(`  📐 Drawing background: ${background.width}x${background.height}`);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    console.warn("  ⚠️ No background provided");
  }

  // 2) Selfie frame (optional)
  if (selfieFrame instanceof HTMLVideoElement) {
    console.log(`  📹 Drawing video frame: ${selfieFrame.videoWidth}x${selfieFrame.videoHeight}`);
    ctx.drawImage(selfieFrame, 0, 0, canvas.width, canvas.height);
  } else if (selfieFrame instanceof HTMLImageElement) {
    console.log(`  🖼️ Drawing image frame: ${selfieFrame.width}x${selfieFrame.height}`);
    ctx.drawImage(selfieFrame, 0, 0, canvas.width, canvas.height);
  } else {
    console.warn("  ⚠️ No selfie frame provided");
  }

  // 3) Bandana aligned to landmarks
  if (bandana && landmarks?.length) {
    console.log(`  🎀 Drawing bandana with ${landmarks.length} landmarks`);
    drawWrappedBandana(ctx, bandana, landmarks);
  } else {
    console.warn("  ⚠️ No bandana or landmarks:", { hasBandana: !!bandana, landmarkCount: landmarks?.length || 0 });
  }

  // 4) Optional logo overlay
  if (logo) {
    const w = canvas.width * 0.35;
    const h = (w * logo.height) / logo.width;
    const x = canvas.width * 0.5 - w / 2;
    const y = canvas.height * 0.06;
    console.log(`  🏆 Drawing logo at (${x.toFixed(0)}, ${y.toFixed(0)}) size ${w.toFixed(0)}x${h.toFixed(0)}`);
    ctx.drawImage(logo, x, y, w, h);
  } else {
    console.warn("  ⚠️ No logo provided");
  }
  
  console.log("✅ compositeImage complete");
}

// Download blob helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
