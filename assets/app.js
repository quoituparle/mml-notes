// Interactive visuals for the MML study notes (plain JS, no build step).
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const R = 6; // plot range is [-R, R]
const BLUE = '#2563b8', ORANGE = '#d9480f', GREEN = '#2f9e44', RED = '#c92a2a';

class Plane {
  constructor(canvas){ this.c = canvas; this.ctx = canvas.getContext('2d'); this.resize(); }
  resize(){
    const dpr = window.devicePixelRatio || 1, w = this.c.clientWidth || 330;
    this.c.width = w*dpr; this.c.height = w*dpr; this.w = w;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  X(x){ return (x+R)/(2*R)*this.w; }
  Y(y){ return (R-y)/(2*R)*this.w; }
  clear(){
    const g = this.ctx; g.clearRect(0,0,this.w,this.w);
    g.lineWidth = 1; g.strokeStyle = css('--grid');
    for(let i=-R;i<=R;i++){ this.line([i,-R],[i,R]); this.line([-R,i],[R,i]); }
    g.strokeStyle = css('--axis'); this.line([-R,0],[R,0]); this.line([0,-R],[0,R]);
  }
  line(a,b,color,width=1){
    const g=this.ctx; if(color) g.strokeStyle=color; g.lineWidth=width;
    g.beginPath(); g.moveTo(this.X(a[0]),this.Y(a[1])); g.lineTo(this.X(b[0]),this.Y(b[1])); g.stroke();
  }
  arrow(v,color,label,from=[0,0]){
    const g=this.ctx, x0=this.X(from[0]), y0=this.Y(from[1]), x1=this.X(from[0]+v[0]), y1=this.Y(from[1]+v[1]);
    g.strokeStyle=color; g.fillStyle=color; g.lineWidth=2.5;
    g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke();
    const a=Math.atan2(y1-y0,x1-x0); g.beginPath(); g.moveTo(x1,y1);
    g.lineTo(x1-10*Math.cos(a-.4),y1-10*Math.sin(a-.4)); g.lineTo(x1-10*Math.cos(a+.4),y1-10*Math.sin(a+.4)); g.fill();
    if(label){ g.font='bold 13px system-ui'; g.fillText(label,x1+6,y1-6); }
  }
  poly(pts,fill,stroke){
    const g=this.ctx; g.beginPath();
    pts.forEach((p,i)=>i?g.lineTo(this.X(p[0]),this.Y(p[1])):g.moveTo(this.X(p[0]),this.Y(p[1])));
    g.closePath(); if(fill){g.fillStyle=fill;g.fill();} if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}
  }
  dot(p,color,label,r=5){
    const g=this.ctx; g.fillStyle=color; g.beginPath(); g.arc(this.X(p[0]),this.Y(p[1]),r,0,7); g.fill();
    if(label){g.font='bold 13px system-ui';g.fillText(label,this.X(p[0])+8,this.Y(p[1])-8);}
  }
  // the infinite line  n·x = c, clipped to the box
  implicit(n,c,color,width=2.5){
    const [a,b]=n;
    if(Math.abs(b)>1e-9) this.line([-R*2,(c+a*R*2)/b],[R*2,(c-a*R*2)/b],color,width);
    else if(Math.abs(a)>1e-9) this.line([c/a,-R*2],[c/a,R*2],color,width);
  }
  // line through origin along direction v
  through(v,color,width=3){ if(Math.hypot(...v)>1e-6) this.line([-v[0]*9,-v[1]*9],[v[0]*9,v[1]*9],color,width); }
}

// widget(rootId, sliders, draw, presets, init): sliders drive the state, `extra` holds non-slider state set by presets
function widget(rootId, sliders, draw, presets, init){
  const root = document.getElementById(rootId); if(!root) return;
  const canvas = root.querySelector('canvas'), ctrl = root.querySelector('.ctrl'), out = root.querySelector('.readout');
  const plane = new Plane(canvas), st = {}, inputs = {}, extra = Object.assign({}, init||{});
  if(presets){
    const box = document.createElement('div'); box.className='presets';
    presets.forEach(p=>{ const b=document.createElement('button'); b.textContent=p.name;
      b.onclick=()=>{ Object.entries(p.v).forEach(([k,v])=>{ if(inputs[k]) inputs[k].value=v; else extra[k]=v; }); update(); };
      box.appendChild(b); });
    ctrl.before(box);
  }
  sliders.forEach(s=>{
    const l=document.createElement('label'), i=document.createElement('input'), v=document.createElement('span');
    i.type='range'; i.min=s.min; i.max=s.max; i.step=s.step||0.1; i.value=s.value; inputs[s.id]=i;
    l.append(document.createTextNode(s.label), i, v); ctrl.appendChild(l); i._v=v;
  });
  function update(){
    Object.assign(st, extra);
    sliders.forEach(s=>{ st[s.id]=parseFloat(inputs[s.id].value); inputs[s.id]._v.textContent=st[s.id].toFixed(s.step>=1?0:(s.step<.1?2:1)); });
    plane.clear(); out.innerHTML = draw(st, plane);
  }
  sliders.forEach(s=>inputs[s.id].addEventListener('input',update));
  window.addEventListener('resize',()=>{plane.resize();update();});
  update();
}
const f1 = x => (Math.abs(x)<1e-9?0:x).toFixed(2);
const cross = (a,b) => a[0]*b[1]-a[1]*b[0];

// ---------- fractions (for the elimination stepper) ----------
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const fr=(n,d=1)=>{ if(d<0){n=-n;d=-d;} const g=gcd(n,d)||1; return [n/g,d/g]; };
const fsub=(a,b)=>fr(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
const fmul=(a,b)=>fr(a[0]*b[0],a[1]*b[1]);
const fdiv=(a,b)=>fr(a[0]*b[1],a[1]*b[0]);
const fstr=a=>a[1]===1?String(a[0]):a[0]+'/'+a[1];
const isZ=a=>a[0]===0;

function rrefSteps(M0){
  const M=M0.map(r=>r.map(x=>fr(x))), m=M.length, n=M[0].length-1, snap=()=>M.map(r=>r.map(x=>x.slice()));
  const steps=[{M:snap(),msg:'Start: the augmented matrix [A | b]. Each row is one equation.',hi:null}];
  let r=0; const piv=[];
  for(let c=0;c<n&&r<m;c++){
    let p=-1; for(let i=r;i<m;i++) if(!isZ(M[i][c])){p=i;break;}
    if(p<0) continue;
    if(p!==r){ [M[r],M[p]]=[M[p],M[r]]; steps.push({M:snap(),msg:`Swap R${r+1} and R${p+1} to get a nonzero pivot in column ${c+1}.`,hi:[r,c]}); }
    const pv=M[r][c];
    if(pv[0]!==1||pv[1]!==1){ M[r]=M[r].map(x=>fdiv(x,pv)); steps.push({M:snap(),msg:`Scale R${r+1} by 1/(${fstr(pv)}) so the pivot becomes 1.`,hi:[r,c]}); }
    for(let i=0;i<m;i++){ if(i===r||isZ(M[i][c])) continue;
      const f=M[i][c]; M[i]=M[i].map((x,j)=>fsub(x,fmul(f,M[r][j])));
      steps.push({M:snap(),msg:`R${i+1} ← R${i+1} − (${fstr(f)})·R${r+1}: clear column ${c+1} in row ${i+1}.`,hi:[r,c]}); }
    piv.push(c); r++;
  }
  let note='';
  const bad=M.some(row=>row.slice(0,n).every(isZ)&&!isZ(row[n]));
  if(bad) note='<span class="warn">A row now reads 0 = nonzero. Contradiction → no solution.</span>';
  else if(piv.length===n) note='<span class="ok">Every column is a pivot → exactly one solution:</span> '+M.slice(0,n).map((row,i)=>`x${i+1} = ${fstr(row[n])}`).join(', ');
  else { const free=[...Array(n).keys()].filter(c=>!piv.includes(c));
    note=`<span class="ok">Done (reduced row-echelon form).</span> Pivot columns: ${piv.map(c=>c+1).join(', ')}. Free variable(s): ${free.map(c=>'x'+(c+1)).join(', ')} → infinitely many solutions.`; }
  steps.push({M:snap(),msg:'No more moves possible.',hi:null,note});
  return {steps,piv,n};
}

function matTable(M,{sepLast=false,cls=()=>'',cell=false}={}){
  const t=document.createElement('table'); t.className='mat';
  M.forEach((row,i)=>{ const tr=document.createElement('tr');
    row.forEach((v,j)=>{ const td=document.createElement('td'); td.textContent=Array.isArray(v)?fstr(v):v;
      if(sepLast&&j===row.length-1) td.classList.add('sep'); const c=cls(i,j); if(c) td.classList.add(c); if(cell) td.classList.add('cell');
      td.dataset.i=i; td.dataset.j=j; tr.appendChild(td); });
    t.appendChild(tr); });
  return t;
}

function rankInfo(M){
  const A=M.map(r=>r.slice()), m=A.length, n=A[0].length; let r=0; const piv=[];
  for(let c=0;c<n&&r<m;c++){
    let p=r; for(let i=r+1;i<m;i++) if(Math.abs(A[i][c])>Math.abs(A[p][c])) p=i;
    if(Math.abs(A[p][c])<1e-9) continue;
    [A[r],A[p]]=[A[p],A[r]];
    for(let i=r+1;i<m;i++){ const f=A[i][c]/A[r][c]; for(let j=c;j<n;j++) A[i][j]-=f*A[r][j]; }
    piv.push(c); r++;
  }
  return {rank:r,piv};
}

document.addEventListener('DOMContentLoaded',()=>{
  // ---- 2.1 rows: each equation is a line ----
  widget('w-lines',[
    {id:'a1',label:'a₁',min:-3,max:3,value:2},{id:'b1',label:'b₁',min:-3,max:3,value:1},{id:'c1',label:'c₁',min:-5,max:5,value:5},
    {id:'a2',label:'a₂',min:-3,max:3,value:1},{id:'b2',label:'b₂',min:-3,max:3,value:3},{id:'c2',label:'c₂',min:-5,max:5,value:5},
  ],(s,p)=>{
    p.implicit([s.a1,s.b1],s.c1,BLUE); p.implicit([s.a2,s.b2],s.c2,ORANGE);
    const det=s.a1*s.b2-s.a2*s.b1;
    if(Math.abs(det)>1e-6){
      const x=(s.c1*s.b2-s.c2*s.b1)/det, y=(s.a1*s.c2-s.a2*s.c1)/det; p.dot([x,y],GREEN,'',7);
      return `<span class="ok">Exactly one solution:</span> (x₁, x₂) = (${f1(x)}, ${f1(y)})<br>The two lines have different directions.`;
    }
    const same=Math.abs(s.a1*s.c2-s.a2*s.c1)<1e-6&&Math.abs(s.b1*s.c2-s.b2*s.c1)<1e-6;
    return same?`<span class="warn">Infinitely many solutions</span>: the lines lie on top of each other.`:`<span class="warn">No solution</span>: parallel lines never meet.`;
  },[{name:'Factory example',v:{a1:2,b1:1,c1:5,a2:1,b2:3,c2:5}},{name:'Parallel → none',v:{a1:1,b1:1,c1:3,a2:1,b2:1,c2:-1}},{name:'Same line → ∞',v:{a1:1,b1:1,c1:3,a2:2,b2:2,c2:6}}]);

  // ---- 2.1 columns: b as a combination of columns ----
  widget('w-cols',[
    {id:'x1',label:'x₁',min:-3,max:3,value:0},{id:'x2',label:'x₂',min:-3,max:3,value:0},
  ],(s,p)=>{
    const a1=[s.p1x,s.p1y], a2=[s.p2x,s.p2y], t=[s.tx,s.ty];
    const dep=Math.abs(cross(a1,a2))<1e-6;
    if(dep) p.through(a1,'rgba(217,72,15,.35)',9);
    p.through(a1,'rgba(37,99,184,.12)',1); p.through(a2,'rgba(47,158,68,.12)',1);
    const u=[s.x1*a1[0],s.x1*a1[1]], v=[s.x2*a2[0],s.x2*a2[1]], res=[u[0]+v[0],u[1]+v[1]];
    p.arrow(a1,'rgba(37,99,184,.45)','a₁'); p.arrow(a2,'rgba(47,158,68,.45)','a₂');
    p.arrow(u,BLUE,''); p.arrow(v,GREEN,'',u);
    p.dot(t,ORANGE,'b',8); p.dot(res,RED,'',4);
    const d=Math.hypot(res[0]-t[0],res[1]-t[1]);
    return `A = [a₁ a₂] = [[${s.p1x}, ${s.p2x}],[${s.p1y}, ${s.p2y}]], b = (${s.tx}, ${s.ty})<br>x₁a₁ + x₂a₂ = (${f1(res[0])}, ${f1(res[1])})<br>`+
      (d<0.12?`<span class="ok">Solved!</span> You found x = (${f1(s.x1)}, ${f1(s.x2)}).`:`Distance to b: <b>${d.toFixed(2)}</b>. Keep adjusting.`)+
      (dep?`<br><span class="warn">The columns are dependent</span>: they only reach the orange line. Targets off the line are impossible.`:'');
  },[{name:'b = (5, 5)',v:{p1x:2,p1y:1,p2x:1,p2y:3,tx:5,ty:5}},{name:'b = (0, 5)',v:{p1x:2,p1y:1,p2x:1,p2y:3,tx:0,ty:5}},{name:'b = (3, −1)',v:{p1x:2,p1y:1,p2x:1,p2y:3,tx:3,ty:-1}},
     {name:'Dependent cols, b = (4, 2)',v:{p1x:2,p1y:1,p2x:4,p2y:2,tx:4,ty:2}},{name:'Dependent cols, b = (5, 5)',v:{p1x:2,p1y:1,p2x:4,p2y:2,tx:5,ty:5}}],
  {p1x:2,p1y:1,p2x:1,p2y:3,tx:5,ty:5});

  // ---- 2.2 matrix multiplication, hover a result cell ----
  (function(){
    const root=document.getElementById('w-matmul'); if(!root) return;
    const A=[[1,2,3],[3,2,1]], B=[[0,2],[1,-1],[0,1]], C=[[0,0],[0,0]];
    for(let i=0;i<2;i++)for(let j=0;j<2;j++) C[i][j]=A[i].reduce((s,_,k)=>s+A[i][k]*B[k][j],0);
    const mm=root.querySelector('.mm'), out=root.querySelector('.readout');
    const tA=matTable(A), tB=matTable(B), tC=matTable(C,{cell:true});
    const op=t=>{const s=document.createElement('span');s.className='op';s.textContent=t;return s;};
    mm.append(tA,op('×'),tB,op('='),tC);
    function show(i,j){
      tA.querySelectorAll('td').forEach(td=>td.classList.toggle('hh',+td.dataset.i===i));
      tB.querySelectorAll('td').forEach(td=>td.classList.toggle('hv',+td.dataset.j===j));
      tC.querySelectorAll('td').forEach(td=>td.classList.toggle('on',+td.dataset.i===i&&+td.dataset.j===j));
      const terms=A[i].map((a,k)=>`${a}·${B[k][j]<0?'('+B[k][j]+')':B[k][j]}`).join(' + ');
      out.innerHTML=`Row ${i+1} of A · column ${j+1} of B:<br><b>${terms} = ${C[i][j]}</b>`;
    }
    tC.querySelectorAll('td').forEach(td=>{ const go=()=>show(+td.dataset.i,+td.dataset.j); td.addEventListener('mouseenter',go); td.addEventListener('click',go); });
    show(0,0);
  })();

  // ---- 2.3 Gaussian elimination stepper ----
  (function(){
    const root=document.getElementById('w-gauss'); if(!root) return;
    const systems={
      'One solution':[[1,1,1,6],[2,1,-1,1],[1,-1,2,5]],
      'Infinitely many':[[1,2,1,4],[2,4,3,9],[1,2,2,5]],
      'No solution':[[1,1,2],[1,1,3]],
    };
    const box=root.querySelector('.stepbox'), eq=root.querySelector('.eqs');
    let cur=null, k=0;
    const pre=document.createElement('div'); pre.className='presets';
    Object.keys(systems).forEach(name=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>load(name);pre.appendChild(b);});
    const view=document.createElement('div'), msg=document.createElement('div'); msg.className='readout';
    const row=document.createElement('div'); row.className='row';
    const back=document.createElement('button'), next=document.createElement('button'), reset=document.createElement('button');
    back.textContent='← Back'; next.textContent='Next step →'; reset.textContent='Reset';
    row.append(back,next,reset); box.append(pre,view,row,msg);
    function eqText(M){
      const n=M[0].length-1;
      return M.map(r=>{ let s='';
        for(let j=0;j<n;j++){ const c=r[j]; if(!c) continue;
          s+=(s?(c<0?' − ':' + '):(c<0?'−':''))+(Math.abs(c)===1?'':Math.abs(c))+'x'+(j+1); }
        return (s||'0')+' = '+r[n]; }).join('<br>');
    }
    function load(name){ cur=rrefSteps(systems[name]); k=0; eq.innerHTML=eqText(systems[name]); draw(); }
    function draw(){
      const s=cur.steps[k];
      view.replaceChildren(matTable(s.M,{sepLast:true,cls:(i,j)=>s.hi&&s.hi[0]===i&&s.hi[1]===j?'pv':''}));
      view.style.textAlign='center';
      msg.innerHTML=`<b>Step ${k}/${cur.steps.length-1}.</b> ${s.msg}`+(s.note?`<br>${s.note}`:'');
      back.disabled=k===0; next.disabled=k===cur.steps.length-1;
    }
    back.onclick=()=>{k--;draw();}; next.onclick=()=>{k++;draw();}; reset.onclick=()=>{k=0;draw();};
    load('One solution');
  })();

  // ---- 2.4 closure: is the set a subspace? ----
  widget('w-sub',[
    {id:'s',label:'u',min:-3,max:3,value:1},{id:'t',label:'v',min:-3,max:3,value:2},
  ],(s,p)=>{
    const P={line0:q=>[1.5*q,q], shift:q=>[1.5*q,q+1.5], parab:q=>[q,q*q/2]};
    const IN={line0:z=>Math.abs(z[1]-z[0]/1.5)<.06, shift:z=>Math.abs(z[1]-z[0]/1.5-1.5)<.06, parab:z=>Math.abs(z[1]-z[0]*z[0]/2)<.08};
    const f=P[s.set], inn=IN[s.set];
    for(let q=-3;q<3;q+=.05) p.line(f(q),f(q+.05),'rgba(120,110,95,.7)',3);
    const u=f(s.s), v=f(s.t), sum=[u[0]+v[0],u[1]+v[1]], sc=[2*u[0],2*u[1]];
    p.dot(sc,ORANGE,'2u',5); p.dot(sum,RED,'u+v',6); p.dot(u,BLUE,'u'); p.dot(v,GREEN,'v');
    const ck=b=>b?'<span class="ok">stays inside ✓</span>':'<span class="warn">falls outside ✗</span>';
    const zero=inn([0,0]);
    return `u + v ${ck(inn(sum))}<br>2·u ${ck(inn(sc))}<br>Contains the zero vector? ${zero?'<span class="ok">yes ✓</span>':'<span class="warn">no ✗</span>'}<br>`+
      ((inn(sum)&&inn(sc)&&zero)?'Closed so far. A line through 0 passes <b>every</b> test, so it is a <b>subspace</b>.':'Not closed → <b>not a subspace</b>.');
  },[{name:'Line through 0',v:{set:'line0'}},{name:'Shifted line',v:{set:'shift'}},{name:'Parabola',v:{set:'parab'}}],{set:'line0'});

  // ---- 2.5 independence & span ----
  widget('w-span',[
    {id:'x1',label:'v₁x',min:-4,max:4,value:2},{id:'y1',label:'v₁y',min:-4,max:4,value:1},
    {id:'x2',label:'v₂x',min:-4,max:4,value:-1},{id:'y2',label:'v₂y',min:-4,max:4,value:2},
  ],(s,p)=>{
    const det=cross([s.x1,s.y1],[s.x2,s.y2]), g=p.ctx;
    if(Math.abs(det)>0.05){ g.fillStyle='rgba(217,72,15,.08)'; g.fillRect(0,0,p.w,p.w); }
    else { const v=Math.hypot(s.x1,s.y1)>Math.hypot(s.x2,s.y2)?[s.x1,s.y1]:[s.x2,s.y2]; p.through(v,ORANGE,5); }
    p.arrow([s.x1,s.y1],BLUE,'v₁'); p.arrow([s.x2,s.y2],GREEN,'v₂');
    return Math.abs(det)>0.05
      ?`<span class="ok">Independent.</span> The span is the whole plane ℝ² (shaded): every point is some λ₁v₁ + λ₂v₂.`
      :`<span class="warn">Dependent.</span> One vector is a multiple of the other, so the span is only a line (orange).`;
  },[{name:'Independent',v:{x1:2,y1:1,x2:-1,y2:2}},{name:'Dependent',v:{x1:2,y1:1,x2:-1,y2:-.5}}]);

  // ---- 2.6 basis change ----
  widget('w-basis',[
    {id:'b1x',label:'b₁x',min:-3,max:3,value:2},{id:'b1y',label:'b₁y',min:-3,max:3,value:1},
    {id:'b2x',label:'b₂x',min:-3,max:3,value:-1},{id:'b2y',label:'b₂y',min:-3,max:3,value:1},
    {id:'px',label:'x₁',min:-4,max:4,value:3},{id:'py',label:'x₂',min:-4,max:4,value:2},
  ],(s,p)=>{
    const det=s.b1x*s.b2y-s.b2x*s.b1y;
    for(let k=-8;k<=8;k++){
      p.line([k*s.b1x-8*s.b2x,k*s.b1y-8*s.b2y],[k*s.b1x+8*s.b2x,k*s.b1y+8*s.b2y],'rgba(217,72,15,.22)',1);
      p.line([k*s.b2x-8*s.b1x,k*s.b2y-8*s.b1y],[k*s.b2x+8*s.b1x,k*s.b2y+8*s.b1y],'rgba(217,72,15,.22)',1);
    }
    p.arrow([s.b1x,s.b1y],BLUE,'b₁'); p.arrow([s.b2x,s.b2y],GREEN,'b₂'); p.dot([s.px,s.py],RED,'x',6);
    if(Math.abs(det)<0.05) return `<span class="warn">b₁ and b₂ are dependent, so they are not a basis.</span>`;
    const l1=(s.px*s.b2y-s.b2x*s.py)/det, l2=(s.b1x*s.py-s.b1y*s.px)/det;
    return `Standard coordinates: x = (${f1(s.px)}, ${f1(s.py)})<br>Coordinates in basis B: <b>(${f1(l1)}, ${f1(l2)})</b><br>That is: x = ${f1(l1)}·b₁ + ${f1(l2)}·b₂`;
  },[{name:'Standard basis',v:{b1x:1,b1y:0,b2x:0,b2y:1}},{name:'Skewed basis',v:{b1x:2,b1y:1,b2x:-1,b2y:1}}]);

  // ---- 2.6 rank explorer ----
  (function(){
    const root=document.getElementById('w-rank'); if(!root) return;
    const grid=root.querySelector('.mat-in'), out=root.querySelector('.readout');
    const presets={'Identity':[[1,0,0],[0,1,0],[0,0,1]],'Column 3 = col 1 + col 2':[[1,0,1],[0,1,1],[2,1,3]],'All rows multiples':[[1,2,3],[2,4,6],[3,6,9]],'Full rank':[[2,1,0],[1,3,1],[0,1,4]]};
    const pre=document.createElement('div'); pre.className='presets';
    const inputs=[], t=document.createElement('table'); t.className='mat';
    for(let i=0;i<3;i++){ const tr=document.createElement('tr'); inputs.push([]);
      for(let j=0;j<3;j++){ const td=document.createElement('td'), inp=document.createElement('input'); inp.type='number'; inp.step=1; inp.value=0; inp.addEventListener('input',calc); td.appendChild(inp); tr.appendChild(td); inputs[i].push(inp);} t.appendChild(tr);}
    function set(M){ M.forEach((r,i)=>r.forEach((v,j)=>inputs[i][j].value=v)); calc(); }
    Object.keys(presets).forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>set(presets[n]);pre.appendChild(b);});
    grid.append(pre,t);
    function calc(){
      const M=inputs.map(r=>r.map(i=>parseFloat(i.value)||0)), {rank,piv}=rankInfo(M);
      out.innerHTML=`<b>rank(A) = ${rank}</b> (out of 3)<br>Pivot columns: ${piv.length?piv.map(c=>c+1).join(', '):'none'}<br>`+
        `Redundant columns: ${3-rank}<br>Kernel dimension: 3 − ${rank} = <b>${3-rank}</b><br>`+
        (rank===3?'<span class="ok">Full rank → A is invertible.</span>':'<span class="warn">Rank-deficient → A is not invertible.</span>');
    }
    set(presets['Column 3 = col 1 + col 2']);
  })();

  // ---- 2.7 matrix as map ----
  widget('w-map',[
    {id:'a',label:'a',min:-3,max:3,value:1},{id:'b',label:'b',min:-3,max:3,value:0},
    {id:'c',label:'c',min:-3,max:3,value:0},{id:'d',label:'d',min:-3,max:3,value:1},
  ],(s,p)=>{
    const M=(x,y)=>[s.a*x+s.b*y, s.c*x+s.d*y];
    for(let i=-R;i<=R;i++){ p.line(M(i,-R),M(i,R),'rgba(37,99,184,.25)',1); p.line(M(-R,i),M(R,i),'rgba(37,99,184,.25)',1); }
    p.poly([[0,0],[1,0],[1,1],[0,1]],'rgba(150,140,120,.2)','#a59b88');
    p.poly([M(0,0),M(1,0),M(1,1),M(0,1)],'rgba(217,72,15,.22)',ORANGE);
    p.arrow([s.a,s.c],BLUE,'Ae₁'); p.arrow([s.b,s.d],GREEN,'Ae₂');
    const det=s.a*s.d-s.b*s.c, sing=Math.abs(det)<0.05;
    if(sing){ const col=Math.hypot(s.a,s.c)>Math.hypot(s.b,s.d)?[s.a,s.c]:[s.b,s.d]; p.through(col,ORANGE,3); }
    return `A = [[${s.a.toFixed(1)}, ${s.b.toFixed(1)}],[${s.c.toFixed(1)}, ${s.d.toFixed(1)}]]<br>Area of the orange square: |det A| = <b>${Math.abs(det).toFixed(2)}</b>${det<-0.05?' (negative det: the plane got flipped)':''}<br>`+
      (sing?`<span class="warn">Singular:</span> the whole plane is squashed onto a line. Image has dim 1, kernel has dim 1 (1 + 1 = 2).`:`<span class="ok">Invertible:</span> rank 2, nothing is lost, the map can be undone.`);
  },[{name:'Identity',v:{a:1,b:0,c:0,d:1}},{name:'Scale ×2',v:{a:2,b:0,c:0,d:2}},{name:'Rotate 45°',v:{a:.7,b:-.7,c:.7,d:.7}},
     {name:'Shear',v:{a:1,b:1,c:0,d:1}},{name:'Mirror',v:{a:-1,b:0,c:0,d:1}},{name:'Squash (singular)',v:{a:1,b:2,c:.5,d:1}}]);

  // ---- 2.7 composition does not commute ----
  widget('w-compose',[
    {id:'th',label:'θ°',min:-180,max:180,step:5,value:90},{id:'sx',label:'stretch',min:.5,max:2.5,value:2},
  ],(s,p)=>{
    const F=[[0,0],[.5,0],[.5,1],[1.2,1],[1.2,1.5],[.5,1.5],[.5,2.2],[1.6,2.2],[1.6,2.7],[0,2.7]].map(q=>[q[0]-.5,q[1]-1.3]);
    const th=s.th*Math.PI/180, rot=q=>[Math.cos(th)*q[0]-Math.sin(th)*q[1], Math.sin(th)*q[0]+Math.cos(th)*q[1]], str=q=>[s.sx*q[0],q[1]];
    p.poly(F,'rgba(150,140,120,.22)','#a59b88');
    p.poly(F.map(str).map(rot),'rgba(37,99,184,.18)',BLUE);
    p.poly(F.map(rot).map(str),'rgba(217,72,15,.18)',ORANGE);
    return `<span style="color:${BLUE}"><b>Blue</b></span>: stretch first, then rotate (R·S·x)<br><span style="color:${ORANGE}"><b>Orange</b></span>: rotate first, then stretch (S·R·x)<br>Same two moves, different order, different result. That is <b>AB ≠ BA</b>.`;
  },[{name:'Rotate 90°, stretch 2',v:{th:90,sx:2}},{name:'No rotation (they agree)',v:{th:0,sx:2}}]);

  // ---- 2.8 affine solution set ----
  widget('w-affine',[
    {id:'a',label:'a',min:-3,max:3,value:1},{id:'b',label:'b',min:-3,max:3,value:2},{id:'c',label:'c',min:-5,max:5,value:4},{id:'t',label:'λ',min:-4,max:4,value:1},
  ],(s,p)=>{
    const n2=s.a*s.a+s.b*s.b; if(n2<1e-6) return 'Pick a nonzero (a, b).';
    const xp=[s.c*s.a/n2, s.c*s.b/n2], k=[-s.b/Math.sqrt(n2), s.a/Math.sqrt(n2)];
    p.implicit([s.a,s.b],0,BLUE,3); p.implicit([s.a,s.b],s.c,ORANGE,3);
    p.arrow(xp,RED,'x₀'); const sol=[xp[0]+s.t*k[0], xp[1]+s.t*k[1]];
    p.arrow([s.t*k[0],s.t*k[1]],GREEN,'',xp); p.dot(sol,GREEN,'x',6);
    return `Equation: ${s.a.toFixed(1)}·x₁ + ${s.b.toFixed(1)}·x₂ = ${s.c.toFixed(1)}<br><span style="color:${BLUE}"><b>Blue</b></span> = kernel, solutions of Ax = 0 (a subspace, through the origin)<br><span style="color:${ORANGE}"><b>Orange</b></span> = solutions of Ax = b: the kernel shifted by x₀ (an affine subspace)<br>Slide λ: x = x₀ + λk always solves it.`;
  });
});
