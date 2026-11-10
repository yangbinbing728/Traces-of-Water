(() => {
  const embedded=new URLSearchParams(location.search).has('embed');
  let active=!embedded;
  const canvas=document.querySelector('#glass'),error=document.querySelector('#error');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});
  if(!gl){error.hidden=false;error.textContent='This material study needs WebGL. Please open it in a browser with hardware acceleration enabled.';return;}
  const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const fragment=`precision highp float;
  varying vec2 uv;uniform vec2 resolution;uniform sampler2D scenery;
  uniform vec4 drops[64];uniform vec4 trails[96];uniform int count;uniform int trailCount;
  float heightAt(vec2 p){
    float h=0.;
    for(int i=0;i<64;i++){if(i>=count)break;vec4 d=drops[i];
      vec2 q=(p-d.xy)/vec2(d.z,d.z*(1.+min(d.w*.0018,.32)));
      // Rounded caps with a pinned, slightly irregular contact line.
      float a=atan(q.y,q.x);float edge=1.+.025*sin(a*3.+d.x*.03)+.012*sin(a*7.+d.y*.02);
      float t=dot(q,q)/(edge*edge);
      h+=d.z*.48*pow(max(0.,1.-t),.72);
    }
    for(int i=0;i<96;i++){if(i>=trailCount)break;vec4 t=trails[i];
      vec2 q=p-t.xy;q.y-=clamp(q.y,0.,t.z);
      h+=t.w*.23*exp(-dot(q,q)/max(.3,t.w*t.w));
    }return h;
  }
  vec3 background(vec2 p){return texture2D(scenery,clamp(p,vec2(.001),vec2(.999))).rgb;}
  void main(){
    vec2 p=vec2(uv.x,1.-uv.y)*resolution;
    float h=heightAt(p);vec3 base=background(uv);
    if(h>.025){
      float e=.45;vec2 slope=vec2(heightAt(p+vec2(e,0.))-heightAt(p-vec2(e,0.)),heightAt(p+vec2(0.,e))-heightAt(p-vec2(0.,e)))/(2.*e);
      vec3 n=normalize(vec3(-slope.x,slope.y,1.));
      vec3 ray=refract(vec3(0.,0.,-1.),n,1./1.333);
      vec2 displaced=uv+ray.xy*(36.+h*2.3)/resolution;
      vec3 transmitted=background(displaced);
      float fresnel=.02+.98*pow(1.-max(n.z,0.),5.);
      // A broad window reflected on the curved water surface, not a painted outline.
      vec3 reflection=vec3(.48,.56,.57);
      float window=exp(-pow((n.x+.36)/.18,4.)-pow((n.y-.48)/.4,4.));
      reflection=mix(reflection,vec3(.98,.99,.96),window);
      float spec=pow(max(dot(n,normalize(vec3(-.4,.65,1.))),0.),100.);
      vec3 water=mix(transmitted,reflection,min(.85,fresnel+.09))+spec*.46;
      water*=1.-.08*(1.-n.z);
      base=mix(base,water,smoothstep(.025,.5,h));
    }
    gl_FragColor=vec4(base,1.);
  }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  let program;
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}
  catch(e){error.hidden=false;error.textContent='The glass shader could not run on this device: '+e.message;return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const attr=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const uniform=n=>gl.getUniformLocation(program,n),locations={resolution:uniform('resolution'),drops:uniform('drops[0]'),trails:uniform('trails[0]'),count:uniform('count'),trailCount:uniform('trailCount')};
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(uniform('scenery'),0);
  let W,H,sim,holding=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Out-of-focus garden and window: a deliberately quiet optical reference behind the glass.
  function backdrop(){
    const c=document.createElement('canvas');c.width=1000;c.height=750;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,700,750);g.addColorStop(0,'#e5e8e1');g.addColorStop(.45,'#b9c7bc');g.addColorStop(1,'#737f6c');x.fillStyle=g;x.fillRect(0,0,1000,750);
    let seed=19;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    x.filter='blur(24px)';
    for(let i=0;i<90;i++){x.fillStyle=['#72826c','#96a086','#435b48','#c7ccaa'][i%4];x.globalAlpha=.12+rand()*.16;x.beginPath();x.ellipse(rand()*1000,210+rand()*620,20+rand()*85,25+rand()*100,0,0,Math.PI*2);x.fill();}
    x.globalAlpha=1;x.filter='blur(13px)';x.fillStyle='rgba(239,238,225,.8)';x.fillRect(235,0,23,750);x.fillRect(0,220,1000,16);x.fillStyle='rgba(44,57,52,.28)';x.fillRect(255,0,8,750);x.filter='none';
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,c);
  }
  function resize(){const oldW=W,oldH=H;W=innerWidth;H=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(locations.resolution,W,H);
    if(!sim){sim=new GlassWater(W,H);for(let i=0;i<32;i++)sim.add(W*(.17+Math.random()*.7),H*Math.random(),2+Math.random()*7);sim.add(W*.59,H*.24,13);}
    else{for(const d of sim.drops){d.x*=W/oldW;d.y*=H/oldH;}sim.trails=[];sim.width=W;sim.height=H;}
  }
  backdrop();resize();addEventListener('resize',resize);
  canvas.addEventListener('pointerdown',e=>{if(holding)return;canvas.setPointerCapture(e.pointerId);holding={id:e.pointerId,x:e.clientX,y:e.clientY,clock:0};sim.add(e.clientX,e.clientY,5);});
  canvas.addEventListener('pointermove',e=>{if(holding&&holding.id===e.pointerId){holding.x=e.clientX;holding.y=e.clientY;}});
  const stop=e=>{if(!e||!holding||e.pointerId===holding.id)holding=null;};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,stop);
  addEventListener('blur',()=>{holding=null;});document.addEventListener('visibilitychange',()=>{holding=null;previous=0;});
  canvas.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();sim.add(W*.55,H*.3,7);}});
  const pause=document.querySelector('#pause');function label(){pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));}pause.onclick=()=>{paused=!paused;holding=null;label();};label();
  if(embedded){
    addEventListener('message',event=>{
      if(event.source!==parent||!event.data||event.data.type!=='water-glass')return;
      const data=event.data;
      if(data.action==='active'){active=Boolean(data.value);holding=null;previous=0;}
      if(!active)return;
      if(data.action==='down'&&Number.isFinite(data.x)&&Number.isFinite(data.y)){
        holding={id:0,x:data.x*W,y:data.y*H,clock:0};sim.add(holding.x,holding.y,5);
      }
      if(data.action==='move'&&holding&&Number.isFinite(data.x)&&Number.isFinite(data.y)){holding.x=data.x*W;holding.y=data.y*H;}
      if(data.action==='up')holding=null;
    });
    parent.postMessage({type:'water-glass-ready'},'*');
  }
  let previous=0;const dropData=new Float32Array(64*4),trailData=new Float32Array(96*4);
  function frame(t){const dt=previous?Math.min((t-previous)/1000,.033):.016;previous=t;
    if(!document.hidden&&active){
      if(holding){holding.clock+=dt;while(holding.clock>.075){sim.add(holding.x,holding.y,3.5);holding.clock-=.075;}}
      if(!paused)sim.step(dt);
      sim.drops.forEach((d,i)=>dropData.set([d.x,d.y,d.r,d.v],i*4));sim.trails.forEach((d,i)=>trailData.set([d.x,d.y,d.length,d.r*d.life],i*4));
      gl.uniform1i(locations.count,sim.drops.length);gl.uniform1i(locations.trailCount,sim.trails.length);gl.uniform4fv(locations.drops,dropData);gl.uniform4fv(locations.trails,trailData);gl.drawArrays(gl.TRIANGLES,0,6);
    }requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
})();
