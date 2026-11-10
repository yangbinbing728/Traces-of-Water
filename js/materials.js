/* Seeded material stamps: the same saved mark renders identically in every view. */
const WaterMaterial = (() => {
  const cache = new Map();
  function rng(seed) {
    let n = (seed * 100003 + 17) >>> 0;
    return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  }
  function stamp(mark) {
    const key = `${mark.type}:${mark.seed}:${mark.color}`;
    if (cache.has(key)) return cache.get(key);
    const s = document.createElement('canvas'); s.width = s.height = 256;
    const c = s.getContext('2d'), rand = rng(mark.seed);
    c.translate(128,128);
    c.fillStyle = '#000';
    if (mark.type === 'footprints') {
      c.scale(2.5,2.5);
      c.beginPath(); c.ellipse(-3,24,8,11,.15,0,Math.PI*2); c.fill();
      c.beginPath(); c.moveTo(-9,17); c.bezierCurveTo(-14,1,-17,-22,-8,-29);
      c.bezierCurveTo(1,-36,16,-29,14,-18); c.bezierCurveTo(12,-8,1,-9,-2,7);
      c.bezierCurveTo(-3,13,2,16,-9,17); c.fill();
      for(let i=0;i<5;i++) { c.beginPath(); c.ellipse(-11+i*6,-37+ i*i*.65,4.5-i*.55,6-i*.65,-.2,0,Math.PI*2);c.fill(); }
      c.setTransform(1,0,0,1,0,0);
    } else {
      c.beginPath();
      for(let i=0;i<=240;i++) {
        const a=i/240*Math.PI*2;
        const radius=91*(1+.065*Math.sin(a*3+mark.seed)+.04*Math.sin(a*7+mark.seed*2)+.015*Math.sin(a*19+mark.seed));
        const x=Math.cos(a)*radius,y=Math.sin(a)*radius*.81;
        i?c.lineTo(x,y):c.moveTo(x,y);
      }
      c.closePath(); c.fill(); c.setTransform(1,0,0,1,0,0);
    }
    const mask=c.getImageData(0,0,256,256), out=c.createImageData(256,256);
    const rgb=mark.color.match(/\w\w/g).map(v=>parseInt(v,16));
    for(let y=2;y<254;y++) for(let x=2;x<254;x++) {
      const i=(y*256+x)*4;
      if(!mask.data[i+3]) continue;
      let edge=0;
      for(const offset of [-2,2,-512,512]) if(!mask.data[i+offset*4+3]) edge++;
      const grain=rand(), cloud=(Math.sin(x*.047+mark.seed)+Math.sin(y*.063+x*.021)+2)/4;
      const fiber= Math.sin(y*2.7+Math.sin(x*.15)*2)>.86 ? .65 : 1;
      let opacity=(.075+cloud*.15+grain*.055+edge*.065)*fiber;
      if(mark.type==='footprints') opacity*=grain<.19?.12:1.12;
      out.data[i]=rgb[0];out.data[i+1]=rgb[1];out.data[i+2]=rgb[2];out.data[i+3]=Math.min(145,opacity*255);
    }
    c.putImageData(out,0,0);
    cache.set(key,s); if(cache.size>256)cache.delete(cache.keys().next().value);
    return s;
  }
  function bead(c,r,color) {
    c.save();c.scale(1,.82);
    c.beginPath();c.ellipse(0,0,r*.61,r,0,0,Math.PI*2);
    c.shadowColor='rgba(36,62,70,.18)';c.shadowBlur=r*.22;c.shadowOffsetY=r*.11;
    const g=c.createRadialGradient(-r*.18,-r*.3,r*.04,0,0,r);
    g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(.32,'rgba(235,245,245,.12)');
    g.addColorStop(.74,color+'24');g.addColorStop(.93,'rgba(48,83,96,.28)');g.addColorStop(1,'rgba(255,255,255,.5)');
    c.fillStyle=g;c.fill();c.shadowColor='transparent';
    c.beginPath();c.ellipse(-r*.2,-r*.38,r*.13,r*.25,.4,0,Math.PI*2);
    c.fillStyle='rgba(255,255,255,.8)';c.fill();c.restore();
  }
  function ring(c,x,y,r,flat,alpha,dark) {
    c.save();c.translate(x,y);c.scale(1,flat);c.lineWidth=.8/Math.sqrt(flat);
    for(let j=0;j<3;j++) {
      const radius=r+j*9;
      c.beginPath();c.ellipse(0,0,radius,radius,0,0,Math.PI*2);
      c.strokeStyle=dark?`rgba(4,15,21,${alpha*.65})`:`rgba(74,108,120,${alpha*.28})`;c.stroke();
      c.beginPath();c.ellipse(0,-1.4,radius,radius,0,.15,Math.PI*.93);
      c.strokeStyle=`rgba(${dark?'195,222,226':'255,255,255'},${alpha*.6})`;c.stroke();
    } c.restore();
  }
  function draw(c,m,w,h,alpha=1,age=5,reduced=false) {
    const r=m.size*Math.min(w,h);c.save();c.translate(m.x*w,m.y*h);c.rotate(m.angle);c.globalAlpha=alpha;
    if(m.type==='stains'||m.type==='footprints') {
      const growth=reduced?1:.82+.18*(1-Math.exp(-age*.7));
      c.globalCompositeOperation='multiply';
      c.drawImage(stamp(m),-r*1.4*growth,-r*1.4*growth,r*2.8*growth,r*2.8*growth);
    } else if(m.type==='tears') bead(c,r*.55,m.color);
    else ring(c,0,0,r,.3,.6,false);
    c.restore();
  }
  return {draw,ring};
})();
