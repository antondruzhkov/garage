// Tiny static server for web/ (tests only)
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(new URL('../web',import.meta.url).pathname);
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml'};
export function serve(port=0){return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
  const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end('nf');return;}
  r.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream','content-length':fs.statSync(f).size});fs.createReadStream(f).pipe(r);});
  s.listen(port,'127.0.0.1',()=>res(s));});}
