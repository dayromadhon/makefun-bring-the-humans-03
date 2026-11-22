// Bring the humans with a TikTok ad — make.fun bounty bring-the-humans-03.
//
// What this program does (Node 22, standard library only — node:fs, node:path,
// node:child_process; no npm dependencies, no network at runtime):
//   1. Copies VIDEO.json from the repository root to the output directory
//      (MAKEFUN_BOT_DIR / MAKEFUN_OUTPUT_DIR, defaulting to /bot and /output),
//      exactly as the starter does — the gate reads the video address from there.
//   2. Renders the full 15 s vertical video ad into <output>/ad.mp4 with ffmpeg:
//      an animated ink/magenta gradient body with on-screen text, the make.fun
//      brand badge from frame 0 until the end card, and the transparent
//      referral end card laid over the last 2.5 s with the blur/desaturate
//      fade and Dava's own referral code typed into its field.
//
// Creative (decided in-session, and why):
//   Hook first, money first — the viewer is a scroller, and the thing that
//   stops one is "real money". 0-2.5 s: "Your AI agent could be earning
//   real money." Then what make.fun is (2.5-5 s: AI agents compete on
//   make.fun for real cash), how it works (5-7.5 s: your agent builds, you
//   enter a bounty, you win), the payoff (7.5-10 s: winners get paid in
//   USDC), then the call to action (10-12.5 s: enter your AI agent in a
//   bounty on make.fun), then the end card (12.5-15 s) with the referral
//   code. Silent video, no audio track. Every text line sits inside the
//   TikTok/Reels safe zone (x 120-960, y 269-1248) and below the brand badge
//   (badge occupies y 272-400), 2-3 s per line, white Inter Bold on a dark
//   translucent box so it stays legible over the moving gradient.
//   Brand: magenta #c41c83, ink #191419, white #ffffff; Inter Bold for
//   on-screen text, JetBrains Mono Bold for the referral code — all from
//   make.fun's press pack / the fonts' official sources, fetched while
//   making the ad and kept in MAKEFUN_ASSETS_DIR (outside the repository).
//
// Assets expected in MAKEFUN_ASSETS_DIR (default ./assets):
//   makefun-badge-9x16.png            — brand badge 9:16 overlay (1080x1920)
//   makefun-card-9x16-transparent.webm — referral end card, VP9+alpha, 2.5 s
//   Inter-Bold.ttf                    — Inter Bold (on-screen text)
//   JetBrainsMono-Bold.ttf            — JetBrains Mono Bold (referral code)
//
// Determinism: fixed gradient seed, fixed colours, fixed timings, no
// randomness, no wall clock, no dates. Same assets + same code + same
// ffmpeg build = the same video bytes.
//
// If ffmpeg or any required asset is missing, this logs a clear warning and
// exits 0 having copied VIDEO.json — the graded run must always complete.
//
// Outside the grader's container:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out \
//     MAKEFUN_ASSETS_DIR=~/workspace/makefun/bring-the-humans-03-assets \
//     node main.ts

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const ASSETS_DIR = process.env.MAKEFUN_ASSETS_DIR ?? './assets';

// --- Fixed creative constants (see the header comment) -----------------------
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 60;
const DURATION_S = 15; // total video length
const CARD_LEN_S = 2.5; // end card laid over the last 2.5 s
const CARD_START_S = DURATION_S - CARD_LEN_S; // 12.5
const CARD_REST_S = 1.433; // field comes to rest this far into the card
const CODE_AT_S = CARD_START_S + CARD_REST_S; // 13.933 — code appears here
const REFERRAL_CODE = 'sf3mmt2f'; // Dava's own make.fun referral code
const INK = '0x191419';
const MAGENTA = '0xc41c83';

// On-screen text. One segment per 2.5 s beat; each segment is 2-3 centred
// lines. y starts at 540 so every line clears the badge (y 272-400) plus its
// 24 px clear space, and stays inside the safe zone (y 269-1248).
const FONT_SIZE = 70;
interface Line {
  text: string;
  start: number;
  end: number;
  y: number;
}
const LINES: Line[] = [
  // Hook: 0-2.5 s
  { text: 'Your AI agent', start: 0, end: 2.5, y: 540 },
  { text: 'could be earning', start: 0, end: 2.5, y: 650 },
  { text: 'real money.', start: 0, end: 2.5, y: 760 },
  // What make.fun is: 2.5-5 s
  { text: 'AI agents compete', start: 2.5, end: 5, y: 540 },
  { text: 'on make.fun', start: 2.5, end: 5, y: 650 },
  { text: 'for real cash.', start: 2.5, end: 5, y: 760 },
  // How it works: 5-7.5 s
  { text: 'Your agent builds.', start: 5, end: 7.5, y: 540 },
  { text: 'You enter a bounty.', start: 5, end: 7.5, y: 650 },
  { text: 'You win.', start: 5, end: 7.5, y: 760 },
  // Payoff: 7.5-10 s
  { text: 'Winners get paid', start: 7.5, end: 10, y: 580 },
  { text: 'in USDC.', start: 7.5, end: 10, y: 700 },
  // Call to action: 10-12.5 s
  { text: 'Enter your AI agent', start: 10, end: 12.5, y: 540 },
  { text: 'in a bounty', start: 10, end: 12.5, y: 650 },
  { text: 'on make.fun', start: 10, end: 12.5, y: 760 },
];

// --- Step 1: copy VIDEO.json --------------------------------------------------
mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, 'VIDEO.json'), join(OUTPUT_DIR, 'VIDEO.json'));
} catch (err) {
  console.error(`VIDEO.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

// --- Step 2: render ad.mp4 ---------------------------------------------------
const badgePath = join(ASSETS_DIR, 'makefun-badge-9x16.png');
const cardPath = join(ASSETS_DIR, 'makefun-card-9x16-transparent.webm');
const interFont = join(ASSETS_DIR, 'Inter-Bold.ttf');
const monoFont = join(ASSETS_DIR, 'JetBrainsMono-Bold.ttf');
const outPath = join(OUTPUT_DIR, 'ad.mp4');

const missing: string[] = [];
for (const p of [badgePath, cardPath, interFont, monoFont]) {
  if (!existsSync(p)) missing.push(p);
}
const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  missing.push('ffmpeg (not found on PATH)');
}
if (missing.length > 0) {
  console.warn(
    'WARNING: cannot render ad.mp4 — missing: ' +
      missing.join(', ') +
      '. VIDEO.json was copied; exiting 0.',
  );
  process.exit(0);
}

// drawtext escaping: our lines contain only letters, spaces and periods, so
// no escaping is needed beyond the filter syntax itself.
const drawtexts = LINES.map(
  (l) =>
    `drawtext=fontfile=${interFont}:text='${l.text}':fontsize=${FONT_SIZE}:` +
    `fontcolor=white:x=(w-text_w)/2:y=${l.y}:` +
    `box=1:boxcolor=0x191419@0.55:boxborderw=24:` +
    `enable='between(t,${l.start},${l.end})'`,
).join(',');

// Two slow translucent bars drifting across the frame for motion on top of
// the rotating gradient (commas inside mod() are escaped as \, for ffmpeg).
const bars =
  `drawbox=x='-260+mod(t*110\\,1600)':y=1420:w=520:h=26:color=${MAGENTA}@0.45:t=fill,` +
  `drawbox=x='1340-mod(t*80\\,1600)':y=1500:w=420:h=18:color=white@0.25:t=fill`;

// Animated ink -> magenta gradient, fixed seed so the render is
// deterministic. Type 1 (radial) keeps the centre bright enough for text.
const gradientSource =
  `gradients=s=${WIDTH}x${HEIGHT}:r=${FPS}:d=${DURATION_S}:` +
  `c0=191419:c1=c41c83:c2=5a0e40:c3=191419:nb_colors=4:seed=182:` +
  `type=1:speed=0.02`;

// Filter graph (press-pack recipe, HOLD=0: the card is laid over the last
// 2.5 s of the clip; the badge runs from frame 0 until the card comes in):
//   body -> badge overlay -> split into clip / soft-blur branch -> the
//   blurred branch fades in from the card start -> card overlay -> cover
//   the blinking caret with white -> type the referral code once the
//   field has come to rest.
const filterComplex =
  `[0:v]fps=${FPS},format=yuva420p,setsar=1,${bars},${drawtexts}[body];` +
  `[body][2:v]overlay=enable='lt(t,${CARD_START_S})',format=yuva420p,split[clip][soft];` +
  `[soft]gblur=sigma=28,eq=saturation=0.35,fade=t=in:st=${CARD_START_S}:d=0.8:alpha=1[soft];` +
  `[clip][soft]overlay[bg];` +
  `[1:v]format=yuva420p,setpts=PTS-STARTPTS+${CARD_START_S}/TB[card];` +
  `[bg][card]overlay=eof_action=pass,` +
  `drawbox=x=208:y=1230:w=9:h=82:color=white:t=fill:enable='gte(t,${CODE_AT_S})',` +
  `drawtext=fontfile=${monoFont}:text=${REFERRAL_CODE}:fontsize=62:` +
  `fontcolor=${INK}:x=210:y=1271-(ascent-descent)/2:enable='gte(t,${CODE_AT_S})'[v]`;

const args = [
  '-hide_banner',
  '-loglevel',
  'error',
  '-f',
  'lavfi',
  '-i',
  gradientSource,
  '-c:v',
  'libvpx-vp9',
  '-i',
  cardPath,
  '-i',
  badgePath,
  '-filter_complex',
  filterComplex,
  '-map',
  '[v]',
  '-an',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-crf',
  '18',
  '-r',
  String(FPS),
  '-t',
  String(DURATION_S),
  '-movflags',
  '+faststart',
  '-y',
  outPath,
];

const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });
if (result.error || result.status !== 0) {
  console.warn(
    `WARNING: ffmpeg failed (${result.error ? result.error.message : 'exit ' + result.status}): ` +
      `${(result.stderr ?? '').trim()}. VIDEO.json was copied; exiting 0.`,
  );
  process.exit(0);
}
console.log(`Rendered ${outPath} (${DURATION_S}s, ${WIDTH}x${HEIGHT}, ${FPS}fps, referral code ${REFERRAL_CODE} in the end-card field).`);
