// Dependency-free raster export of the code-native Sage leaf mark.
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const table = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc = data => { let n = 0xffffffff; for (const b of data) n = table[(n ^ b) & 255] ^ (n >>> 8); return (n ^ 0xffffffff) >>> 0; };
function chunk(type, data) { const t = Buffer.from(type); const size = Buffer.alloc(4); size.writeUInt32BE(data.length); const check = Buffer.alloc(4); check.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([size, t, data, check]); }
function curve(a, b, c, d) { return Array.from({ length: 61 }, (_, i) => { const t = i / 60, u = 1 - t; return [0,1].map(k => u*u*u*a[k] + 3*u*u*t*b[k] + 3*u*t*t*c[k] + t*t*t*d[k]); }); }
const leaf = [...curve([19,45],[14,23],[29,14],[48,17]), ...curve([48,17],[50,36],[41,49],[25,44])];
const lines = [...leaf.slice(1).map((p,i) => [leaf[i],p]), [[20,50],[41,25]], [[27,38],[28,29]], [[35,31],[43,30]]];
function distance(x,y,a,b) { const dx=b[0]-a[0],dy=b[1]-a[1]; const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy || 1))); return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy); }
for (const size of [192,512]) {
  const rows=Buffer.alloc((size*4+1)*size); const base=[49,91,73],mark=[220,231,205];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let coverage=0;
    for(const sy of [.25,.75])for(const sx of [.25,.75]){const px=(x+sx)/size*64,py=(y+sy)/size*64;if(lines.some(([a,b])=>distance(px,py,a,b)<=1.4))coverage+=.25;}
    const at=y*(size*4+1)+1+x*4;for(let k=0;k<3;k++)rows[at+k]=Math.round(base[k]*(1-coverage)+mark[k]*coverage);rows[at+3]=255;
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  await writeFile(fileURLToPath(new URL(`../public/icon-${size}.png`,import.meta.url)),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));
}
console.log('Generated 192px and 512px Sage icons.');
