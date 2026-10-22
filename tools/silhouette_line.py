# Line silhouette for the loader from the colour-coded render (tools/silhouette.mjs).
# python3 tools/silhouette_line.py <groups.png>  ->  web/assets/silhouette-line.png
import sys
from PIL import Image, ImageFilter, ImageChops, ImageDraw
src=Image.open(sys.argv[1]).convert('RGB');W,H=src.size;px=src.load()
# flat colours as they come out of the renderer (tone mapping softens them), plus the white background
GROUPS={'wheels':(255,26,26),'tank':(153,224,90),'seat':(0,0,220),'engine':(227,227,110),'exhaust':(245,53,240),'front':(160,229,229),'rest':(0,0,0)}
BG=(255,255,255)
def d2(p,c):return (p[0]-c[0])**2+(p[1]-c[1])**2+(p[2]-c[2])**2
masks={k:Image.new('L',(W,H),0) for k in GROUPS}
mp={k:m.load() for k,m in masks.items()}
for y in range(H):
  for x in range(W):
    p=px[x,y];best,bd='bg',d2(p,BG)
    for k,c in GROUPS.items():
      d=d2(p,c)
      if d<bd:best,bd=k,d
    if best!='bg':mp[best][x,y]=255
def solid(m,close):
  m=m.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
  pad=Image.new('L',(W+4,H+4),0);pad.paste(m,(2,2));ImageDraw.floodfill(pad,(0,0),128)
  s=pad.point(lambda v:0 if v==128 else 255).crop((2,2,W+2,H+2))
  return s.filter(ImageFilter.GaussianBlur(2.5)).point(lambda v:255 if v>127 else 0)
def edge(s,w):return ImageChops.subtract(s.filter(ImageFilter.MaxFilter(w)),s)
def smooth(m,close,blur):
  s=solid(m,close);return s.filter(ImageFilter.GaussianBlur(blur)).point(lambda v:255 if v>127 else 0)
whole=Image.new('L',(W,H),0)
for m in masks.values():whole=ImageChops.lighter(whole,m)
line=edge(smooth(whole,15,3),7)
for k,cl,bl in [('tank',9,3),('seat',9,3),('engine',35,8),('exhaust',13,3)]:
  line=ImageChops.lighter(line,edge(smooth(masks[k],cl,bl),5))
# wheels: clean circles from the real wheel size and position (tyre, rim, hub)
d=ImageDraw.Draw(line);wm=masks['wheels']
for half in [(0,0,W//2,H),(W//2,0,W,H)]:
  bb=wm.crop(half).getbbox()
  if not bb:continue
  x0,y0,x1,y1=bb[0]+half[0],bb[1],bb[2]+half[0],bb[3];cx,cy=(x0+x1)/2,(y0+y1)/2;R=max(x1-x0,y1-y0)/2
  for k,w in [(1.0,5),(0.70,4),(0.13,4)]:
    r=R*k-w/2;d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=255,width=w)
bb=line.getbbox();m=10
line=line.crop((bb[0]-m,bb[1]-m,bb[2]+m,bb[3]+m)).filter(ImageFilter.GaussianBlur(0.7))
s=760/line.size[0];line=line.resize((760,round(line.size[1]*s)),Image.LANCZOS)
out=Image.new('RGBA',line.size,(0,0,0,0));out.putalpha(line);out.save('web/assets/silhouette-line.png',optimize=True)
prev=Image.new('RGB',line.size,(255,255,255));prev.paste((20,20,20),mask=line);prev.save(sys.argv[1].replace('.png','-preview.png'))
print(out.size)
