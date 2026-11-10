/* Units are CSS pixels and seconds. A pinned contact line must release before gravity wins. */
class GlassWater {
  constructor(width,height,random=Math.random){this.width=width;this.height=height;this.random=random;this.drops=[];this.trails=[];this.nextId=0;}
  add(x,y,radius=5){
    const near=this.drops.find(d=>Math.hypot(d.x-x,d.y-y)<d.r+radius);
    if(near){near.r=Math.cbrt(near.r**3+radius**3);return near;}
    const d={id:this.nextId++,x,y,r:radius,v:0,seed:this.random()*6.28,pin:8+this.random()*4};
    this.drops.push(d);if(this.drops.length>64)this.drops.shift();return d;
  }
  step(dt){
    for(const d of this.drops){
      const oldX=d.x,oldY=d.y;
      if(d.r>d.pin){const drive=(d.r-d.pin)*27;d.v+=(drive-d.v*2.8)*dt;d.y+=d.v*dt;d.x+=Math.sin(d.y*.025+d.seed)*d.v*.025*dt;}
      if(d.y-oldY>.2){
        this.trails.push({x:oldX,y:oldY,length:d.y-oldY+2,r:Math.max(.7,d.r*.1),life:1});
        d.r=Math.max(3,d.r-d.v*dt*.0009);
      }
      d.r=Math.max(0,d.r-dt*.013);
    }
    for(let i=0;i<this.drops.length;i++)for(let j=i+1;j<this.drops.length;j++){
      const a=this.drops[i],b=this.drops[j];
      if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*.83){
        const va=a.r**3,vb=b.r**3,total=va+vb;
        a.x=(a.x*va+b.x*vb)/total;a.y=(a.y*va+b.y*vb)/total;
        a.v=(a.v*va+b.v*vb)/total;a.r=Math.cbrt(total);a.pin=Math.min(a.pin,b.pin);
        this.drops.splice(j--,1);
      }
    }
    this.drops=this.drops.filter(d=>d.y<this.height+d.r*2&&d.r>1);
    for(const t of this.trails)t.life-=dt*.14;
    this.trails=this.trails.filter(t=>t.life>0).slice(-96);
  }
}
