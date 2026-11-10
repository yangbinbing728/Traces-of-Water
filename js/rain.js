/* Rain in a shallow pool, viewed slightly downward into soft backlight. */
class RainScene {
  constructor(){this.drops=[];this.impacts=[];this.spray=[];this.clock=0;}
  reset(){this.drops=[];this.impacts=[];this.spray=[];this.clock=0;}
  hit(x,y,depth=1){
    this.impacts.push({x,y,depth,age:0});
    if(this.impacts.length>90)this.impacts.shift();
    for(let i=0;i<4;i++)this.spray.push({x,y,vx:(Math.random()-.5)*65*depth,vy:-(20+Math.random()*65)*depth,age:0,life:.2+Math.random()*.25,depth});
    this.spray=this.spray.slice(-180);
  }
  draw(c,w,h,dt,time,reduced){
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#101a21');sky.addColorStop(.48,'#263b43');sky.addColorStop(1,'#10232b');c.fillStyle=sky;c.fillRect(0,0,w,h);
    const light=c.createRadialGradient(w*.72,h*.25,0,w*.72,h*.25,w*.7);light.addColorStop(0,'rgba(171,194,194,.14)');light.addColorStop(1,'rgba(130,165,174,0)');c.fillStyle=light;c.fillRect(0,0,w,h);
    // Fine, horizontal reflections widen toward the foreground.
    for(let i=0;i<95;i++){
      const n=i/95,y=h*(.39+n*n*.65),x=w*(.7+Math.sin(i*53.7)*(.025+n*.24));
      c.fillStyle=`rgba(177,201,198,${.018+n*.025})`;
      c.fillRect(x,y,(8+n*90)*(1+Math.sin(i*7.1+(reduced?0:time*.4))*.25),.5+n*.5);
    }
    if(!reduced){
      this.clock+=dt*(w<650?75:130);
      while(this.clock>=1){this.clock--;const depth=Math.random();this.drops.push({x:Math.random()*w*1.2,y:-70,depth,v:480+depth*700,length:9+depth*35,target:h*(.43+depth*.56)});}
      const wind=35+Math.sin(time*.35)*23;
      for(const d of this.drops){
        d.x-=wind*dt;d.y+=d.v*dt;
        const g=c.createLinearGradient(d.x+wind*d.length/d.v,d.y-d.length,d.x,d.y);
        g.addColorStop(0,'rgba(210,228,230,0)');g.addColorStop(1,`rgba(210,228,230,${.1+d.depth*.28})`);
        c.strokeStyle=g;c.lineWidth=.35+d.depth*.8;c.beginPath();c.moveTo(d.x+wind*d.length/d.v,d.y-d.length);c.lineTo(d.x,d.y);c.stroke();
        if(d.y>=d.target){this.hit(d.x,d.target,.3+d.depth*.7);d.dead=true;}
      }
      this.drops=this.drops.filter(d=>!d.dead).slice(-300);
    }
    for(const ring of this.impacts){
      ring.age+=dt;const fade=Math.max(0,1-ring.age/1.7),r=(2+(reduced?15:ring.age*36))*ring.depth;
      for(let j=0;j<2;j++){
        const radius=r+j*5*ring.depth;
        c.lineWidth=.45+ring.depth*.35;c.beginPath();c.ellipse(ring.x,ring.y,radius,radius*.24,0,.1+j*.7,Math.PI*1.8+j*.2);c.strokeStyle=`rgba(6,18,24,${fade*.5})`;c.stroke();
        c.beginPath();c.ellipse(ring.x,ring.y-.8,radius,radius*.24,0,.15,Math.PI*.9);c.strokeStyle=`rgba(186,213,216,${fade*.23})`;c.stroke();
      }
    }
    this.impacts=this.impacts.filter(d=>d.age<1.7);
    for(const p of this.spray){p.age+=dt;if(reduced)continue;p.vy+=240*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;c.fillStyle=`rgba(205,225,226,${Math.max(0,1-p.age/p.life)*.45})`;c.beginPath();c.ellipse(p.x,p.y,.5+p.depth*.4,1+p.depth*.9,0,0,Math.PI*2);c.fill();}
    this.spray=this.spray.filter(p=>p.age<p.life);
  }
}
