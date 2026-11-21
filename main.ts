// The World Today — front page for Friday 20 November 2026.
// Draws a procedural newspaper front page and writes /output/entry.png.
// Node 22, standard library only, no network, fully deterministic.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- font ----
// Hand-drawn 5x7 bitmap font. Each glyph is 7 rows of 5 cells; '#' is ink.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "#...."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["##..#", "##.#.", "..#..", ".#...", "#..##", "#..##", "....."],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

// ------------------------------------------------------------- canvas ----
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [247, 242, 230];
const INK: [number, number, number] = [24, 24, 24];
const RED: [number, number, number] = [158, 27, 27];
const SLATE: [number, number, number] = [74, 74, 82];

const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  img[i * 3] = PAPER[0];
  img[i * 3 + 1] = PAPER[1];
  img[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  img[o] = c[0];
  img[o + 1] = c[1];
  img[o + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}

function drawChar(ch: string, x: number, y: number, s: number, c: [number, number, number]): void {
  const g = FONT[ch] ?? FONT[" "];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") rect(x + col * s, y + r * s, s, s, c);
    }
  }
}

function textWidth(t: string, s: number): number {
  if (t.length === 0) return 0;
  return t.length * 6 * s - s;
}

function drawText(t: string, x: number, y: number, s: number, c: [number, number, number]): void {
  for (let i = 0; i < t.length; i++) drawChar(t[i], x + i * 6 * s, y, s, c);
}

function drawCentered(t: string, y: number, s: number, c: [number, number, number]): void {
  drawText(t, Math.round((W - textWidth(t, s)) / 2), y, s, c);
}

function wrap(t: string, maxW: number, s: number): string[] {
  const words = t.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, s) <= maxW) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// Draw wrapped text; returns the y just below the last line.
function drawWrapped(t: string, x: number, y: number, maxW: number, s: number, c: [number, number, number], gap: number): number {
  const lines = wrap(t, maxW, s);
  for (const ln of lines) {
    drawText(ln, x, y, s, c);
    y += 7 * s + gap;
  }
  return y;
}

// ------------------------------------------------------------ PNG out ----
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ content ----
const MARGIN = 36;
const INNER = W - 2 * MARGIN;

const LEAD_HEAD = "RUSSIA'S BIGGEST STRIKE OF THE YEAR HITS UKRAINE - AND SPILLS INTO POLAND";
const LEAD_BODY =
  "MORE THAN 400 DRONES AND 110 MISSILES, INCLUDING 27 BALLISTIC MISSILES, RAINED ON UKRAINE OVERNIGHT. " +
  "EIGHT PEOPLE WERE KILLED AND THREE BRIDGES ACROSS THE DNIPRO IN KYIV WERE HIT. " +
  "TWO RUSSIAN MISSILES AND A DRONE CRASHED IN NATO MEMBER POLAND, SCRAMBLING POLISH AND NATO JETS.";

const STORIES: { head: string; body: string }[] = [
  {
    head: "WALL STREET ROUT: S&P 500 FALLS 3.7% INTO CORRECTION AS AI SELLOFF DEEPENS",
    body: "THE NASDAQ LOST 5.3% AND WIPED OUT ITS 2026 GAINS. ANTHROPIC FELL 8.5% ON ITS SECOND DAY OF TRADING AFTER THE RECORD IPO, AND NVIDIA TUMBLED 13.8%."},
  {
    head: "GULF UNDER FIRE: HOUTHIS TARGET RIYADH AS TANKER BURNS IN HORMUZ",
    body: "THE SAUDI-LED COALITION INTERCEPTED HOUTHI MISSILES AIMED AT RIYADH ON FRIDAY. A TANKER STRUCK IN THE STRAIT OF HORMUZ CAUGHT FIRE. OIL FELL ANYWAY."},
  {
    head: "MAGNITUDE 6.7 QUAKE SHAKES CENTRAL PERU",
    body: "THE TREMOR STRUCK AT 7:09 P.M. NEAR JUNIN, DEEP IN THE ANDES, AND WAS FELT ACROSS LIMA. NO CASUALTIES OR MAJOR DAMAGE WERE IMMEDIATELY REPORTED."},
  {
    head: "CYCLONE AKVAN MAKES LANDFALL IN ODISHA",
    body: "THE STORM CROSSED THE COAST NEAR GOPALPUR ON FRIDAY, WINDS GUSTING TO 90 KM/H. OVER 300,000 PEOPLE WERE EVACUATED; NO MAJOR DAMAGE WAS REPORTED."},
  {
    head: "TRUMP DEFENDS SHENZHEN SUMMIT AT FRIDAY NEWS CONFERENCE",
    body: "A DAY AFTER THE FIRST-EVER THREE-WAY TALKS WITH XI AND PUTIN, TRUMP HAILED A JOINT DECLARATION ON NUCLEAR RISKS. NO BREAKTHROUGH ON UKRAINE."},
];

const BRIEFS: string[] = [
  "MYANMAR CALLS THE ICJ GENOCIDE RULING 'UNFAIR'; SOUTH AFRICA WELCOMES IT.",
  "COP31 TALKS IN ANTALYA RUN PAST THEIR DEADLINE WITH NO DEAL IN SIGHT.",
  "HUNGARY LIFTS ITS VETO ON OPENING EU ACCESSION TALKS WITH UKRAINE.",
];

// ------------------------------------------------------------ layout -----
let y = 30;

// Masthead
drawCentered("THE WORLD TODAY", y, 8, INK);
y += 7 * 8 + 12;
// Double rule under the masthead
rect(MARGIN, y, INNER, 4, INK);
y += 8;
rect(MARGIN, y, INNER, 2, INK);
y += 12;
// Date line, in red
drawCentered("FRIDAY 20 NOVEMBER 2026", y, 4, RED);
y += 7 * 4 + 12;
rect(MARGIN, y, INNER, 2, RED);
y += 16;

// Lead story
drawText("LEAD STORY", MARGIN, y, 2, RED);
y += 7 * 2 + 8;
y = drawWrapped(LEAD_HEAD, MARGIN, y, INNER, 4, INK, 6);
y += 6;
y = drawWrapped(LEAD_BODY, MARGIN, y, INNER, 2, INK, 5);
y += 10;
rect(MARGIN, y, INNER, 3, INK);
y += 14;

// Numbered stories
STORIES.forEach((st, i) => {
  const num = String(i + 1);
  drawText(num + ".", MARGIN, y, 3, RED);
  const tx = MARGIN + 3 * 6 * 3;
  const tw = INNER - 3 * 6 * 3;
  let yy = drawWrapped(st.head, tx, y, tw, 3, INK, 5);
  yy += 2;
  yy = drawWrapped(st.body, tx, yy, tw, 2, SLATE, 5);
  y = yy + 11;
  if (i < STORIES.length - 1) {
    rect(MARGIN, y, INNER, 1, SLATE);
    y += 12;
  }
});

// Also in the news strip: three short briefs in three columns.
rect(MARGIN, y, INNER, 2, RED);
y += 6;
drawText("ALSO IN THE NEWS", MARGIN, y, 2, RED);
y += 7 * 2 + 6;
const colW = Math.floor((INNER - 2 * 24) / 3);
BRIEFS.forEach((b, i) => {
  drawWrapped(b, MARGIN + i * (colW + 24), y, colW, 2, SLATE, 5);
});
y += 3 * (7 * 2 + 5) + 4;

// Footer
rect(MARGIN, y, INNER, 2, INK);
y += 6;
drawCentered("FRIDAY 20 NOVEMBER 2026 - THE WORLD TODAY", y, 2, SLATE);

// ------------------------------------------------------------- write -----
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.png"), encodePng());
