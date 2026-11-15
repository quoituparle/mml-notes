// Shared 1D plotting helpers (curves, areas) and widget1D(), used by chapters 5-7.
class Plot1D {
  constructor(canvas, range){ this.c=canvas; this.g=canvas.getContext('2d'); this.r=Object.assign({xmin:-4,xmax:4,ymin:-4,ymax:4,xs:1,ys:1},range||{}); this.resize(); }
  resize(){
    const dpr=window.devicePixelRatio||1; this.w=this.c.clientWidth||600; this.h=this.c.clientHeight||this.w/2.4;
    this.c.width=this.w*dpr; this.c.height=this.h*dpr; this.g.setTransform(dpr,0,0,dpr,0,0);
  }
  X(x){ return 30+(x-this.r.xmin)/(this.r.xmax-this.r.xmin)*(this.w-44); }
  Y(y){ return this.h-22-(y-this.r.ymin)/(this.r.ymax-this.r.ymin)*(this.h-38); }
  clear(){
    const g=this.g, r=this.r; g.clearRect(0,0,this.w,this.h);
    g.lineWidth=1; g.strokeStyle=css('--grid'); g.fillStyle=css('--muted'); g.font='11px system-ui';
    for(let x=Math.ceil(r.xmin/r.xs)*r.xs;x<=r.xmax+1e-9;x+=r.xs){ g.beginPath(); g.moveTo(this.X(x),this.Y(r.ymin)); g.lineTo(this.X(x),this.Y(r.ymax)); g.stroke(); g.textAlign='center'; g.fillText(+x.toFixed(2),this.X(x),this.h-7); }
    for(let y=Math.ceil(r.ymin/r.ys)*r.ys;y<=r.ymax+1e-9;y+=r.ys){ g.beginPath(); g.moveTo(this.X(r.xmin),this.Y(y)); g.lineTo(this.X(r.xmax),this.Y(y)); g.stroke(); g.textAlign='right'; g.fillText(+y.toFixed(2),26,this.Y(y)+4); }
    g.strokeStyle=css('--axis'); g.lineWidth=1.3;
    if(r.ymin<=0&&r.ymax>=0){ g.beginPath(); g.moveTo(this.X(r.xmin),this.Y(0)); g.lineTo(this.X(r.xmax),this.Y(0)); g.stroke(); }
    if(r.xmin<=0&&r.xmax>=0){ g.beginPath(); g.moveTo(this.X(0),this.Y(r.ymin)); g.lineTo(this.X(0),this.Y(r.ymax)); g.stroke(); }
  }
  clip(fn){ const g=this.g; g.save(); g.beginPath(); g.rect(this.X(this.r.xmin),this.Y(this.r.ymax),this.X(this.r.xmax)-this.X(this.r.xmin),this.Y(this.r.ymin)-this.Y(this.r.ymax)); g.clip(); fn(); g.restore(); }
  curve(fn,color,width=2.5,xa,xb,N=400){
    xa=xa??this.r.xmin; xb=xb??this.r.xmax;
    this.clip(()=>{ const g=this.g; g.strokeStyle=color; g.lineWidth=width; g.beginPath(); let pen=false;
      for(let i=0;i<=N;i++){ const x=xa+(xb-xa)*i/N, y=fn(x); if(!isFinite(y)||Math.abs(y)>1e4){pen=false;continue;} pen?g.lineTo(this.X(x),this.Y(y)):g.moveTo(this.X(x),this.Y(y)); pen=true; }
      g.stroke(); });
  }
  area(fn,a,b,fill,N=300){
    this.clip(()=>{ const g=this.g; g.fillStyle=fill; g.beginPath(); g.moveTo(this.X(a),this.Y(0));
      for(let i=0;i<=N;i++){ const x=a+(b-a)*i/N; g.lineTo(this.X(x),this.Y(fn(x))); } g.lineTo(this.X(b),this.Y(0)); g.closePath(); g.fill(); });
  }
  seg(x1,y1,x2,y2,color,width=2,dashed=false){ this.clip(()=>{ const g=this.g; g.strokeStyle=color; g.lineWidth=width; g.setLineDash(dashed?[6,4]:[]); g.beginPath(); g.moveTo(this.X(x1),this.Y(y1)); g.lineTo(this.X(x2),this.Y(y2)); g.stroke(); g.setLineDash([]); }); }
  vline(x,color,dashed=true,width=1.5){ this.seg(x,this.r.ymin,x,this.r.ymax,color,width,dashed); }
  // infinite line y = y0 + m (x - x0)
  tangent(x0,y0,m,color,width=2,dashed=false){ const a=this.r.xmin, b=this.r.xmax; this.seg(a,y0+m*(a-x0),b,y0+m*(b-x0),color,width,dashed); }
  dot(x,y,color,label,rad=5){ const g=this.g; g.fillStyle=color; g.beginPath(); g.arc(this.X(x),this.Y(y),rad,0,7); g.fill(); if(label){ g.font='bold 13px system-ui'; g.textAlign='left'; g.fillText(label,this.X(x)+8,this.Y(y)-8); } }
  text(s,x,y,color,align='left'){ const g=this.g; g.fillStyle=color; g.font='bold 13px system-ui'; g.textAlign=align; g.fillText(s,x,y); }
  bars(xs,hs,w,fill){ this.clip(()=>{ const g=this.g; g.fillStyle=fill; xs.forEach((x,i)=>{ g.fillRect(this.X(x-w/2),this.Y(hs[i]),this.X(x+w/2)-this.X(x-w/2)-1,this.Y(0)-this.Y(hs[i])); }); }); }
}

// widget1D(rootId, sliders, draw, presets, init, range): like widget() but with a Plot1D
function widget1D(rootId, sliders, draw, presets, init, range){
  const root=document.getElementById(rootId); if(!root) return;
  const canvas=root.querySelector('canvas'), ctrl=root.querySelector('.ctrl'), out=root.querySelector('.readout');
  const plot=new Plot1D(canvas,range), st={}, inputs={}, extra=Object.assign({},init||{});
  if(presets){ const box=document.createElement('div'); box.className='presets';
    presets.forEach(p=>{ const b=document.createElement('button'); b.textContent=p.name;
      b.onclick=()=>{ const vals=typeof p.v==='function'?p.v(st):p.v; Object.entries(vals).forEach(([k,v])=>{ if(inputs[k]) inputs[k].value=v; else extra[k]=v; }); update(); }; box.appendChild(b); });
    ctrl.before(box); }
  sliders.forEach(s=>{ const l=document.createElement('label'), i=document.createElement('input'), v=document.createElement('span');
    i.type='range'; i.min=s.min; i.max=s.max; i.step=s.step||0.1; i.value=s.value; inputs[s.id]=i; l.append(document.createTextNode(s.label),i,v); ctrl.appendChild(l); i._v=v; });
  function update(){
    Object.assign(st,extra);
    sliders.forEach(s=>{ st[s.id]=parseFloat(inputs[s.id].value); inputs[s.id]._v.textContent=st[s.id].toFixed(s.step>=1?0:(s.step<.1?2:1)); });
    plot.clear(); out.innerHTML=draw(st,plot,inputs);
  }
  sliders.forEach(s=>inputs[s.id].addEventListener('input',update));
  window.addEventListener('resize',()=>{plot.resize();update();});
  update();
}

// widgetFree: sliders + a raw canvas (no axes). draw(state, g, w, h, inputs) returns readout HTML.
function widgetFree(rootId, sliders, draw, presets, init){
  const root=document.getElementById(rootId); if(!root) return;
  const canvas=root.querySelector('canvas'), ctrl=root.querySelector('.ctrl'), out=root.querySelector('.readout'), g=canvas.getContext('2d');
  const st={}, inputs={}, extra=Object.assign({},init||{});
  if(presets){ const box=document.createElement('div'); box.className='presets';
    presets.forEach(p=>{ const b=document.createElement('button'); b.textContent=p.name;
      b.onclick=()=>{ const vals=typeof p.v==='function'?p.v(st):p.v; Object.entries(vals).forEach(([k,v])=>{ if(inputs[k]) inputs[k].value=v; else extra[k]=v; }); update(); }; box.appendChild(b); });
    ctrl.before(box); }
  sliders.forEach(s=>{ const l=document.createElement('label'), i=document.createElement('input'), v=document.createElement('span');
    i.type='range'; i.min=s.min; i.max=s.max; i.step=s.step||0.1; i.value=s.value; inputs[s.id]=i; l.append(document.createTextNode(s.label),i,v); ctrl.appendChild(l); i._v=v; });
  function update(){
    Object.assign(st,extra);
    sliders.forEach(s=>{ st[s.id]=parseFloat(inputs[s.id].value); inputs[s.id]._v.textContent=st[s.id].toFixed(s.step>=1?0:(s.step<.1?2:1)); });
    const dpr=window.devicePixelRatio||1, w=canvas.clientWidth||600, h=canvas.clientHeight||w/2.4;
    canvas.width=w*dpr; canvas.height=h*dpr; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
    out.innerHTML=draw(st,g,w,h,inputs);
  }
  sliders.forEach(s=>inputs[s.id].addEventListener('input',update));
  window.addEventListener('resize',update);
  update();
}

// small math helpers shared by chapters 6-7
const erf=x=>{ const s=Math.sign(x), t=1/(1+0.3275911*Math.abs(x)), y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return s*y; };
const Phi=z=>0.5*(1+erf(z/Math.SQRT2));
const normPdf=(x,m=0,s=1)=>Math.exp(-0.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
const lgamma=x=>{ const c=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x); x-=1; let a=0.99999999999980993; const t=x+7.5; for(let i=0;i<8;i++) a+=c[i]/(x+i+1);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a); };
function makeRng(seed){ let s=seed>>>0||1; const u=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
  return { u, n:()=>Math.sqrt(-2*Math.log(u()+1e-12))*Math.cos(2*Math.PI*u()) }; }
