// Chapter 7 visuals: gradient descent (1D, 2D with momentum and noise), Lagrange multipliers, convexity, LP, QP.
document.addEventListener('DOMContentLoaded',()=>{
  const f2=x=>(Math.abs(x)<5e-3?0:x).toFixed(2), f3=x=>(Math.abs(x)<5e-4?0:x).toFixed(3), dot=(a,b)=>a[0]*b[0]+a[1]*b[1], nrm=a=>Math.hypot(a[0],a[1]);
  const dash=(p,a,b,c,w=2)=>{p.ctx.setLineDash([6,4]);p.line(a,b,c,w);p.ctx.setLineDash([]);};
  function addSlider(ctrl,s){ const l=document.createElement('label'), i=document.createElement('input'), v=document.createElement('span');
    i.type='range'; i.min=s.min; i.max=s.max; i.step=s.step; i.value=s.value; l.append(document.createTextNode(s.label),i,v); ctrl.appendChild(l);
    const show=()=>v.textContent=parseFloat(i.value).toFixed(s.dec??1); i.addEventListener('input',show); show(); i._show=show; return i; }
  function eigSym(a,b,d){ const th=.5*Math.atan2(2*b,a-d), c=Math.cos(th), s=Math.sin(th); return {th,v1:[c,s],v2:[-s,c],l1:a*c*c+2*b*c*s+d*s*s,l2:a*s*s-2*b*c*s+d*c*c}; }
  function ellipse(p,Q,xc,level,color,width){ const E=eigSym(Q[0][0],Q[0][1],Q[1][1]); let prev=null;
    for(let i=0;i<=120;i++){ const t=i/120*2*Math.PI, r1=Math.sqrt(2*level/E.l1)*Math.cos(t), r2=Math.sqrt(2*level/E.l2)*Math.sin(t),
      q=[xc[0]+r1*E.v1[0]+r2*E.v2[0], xc[1]+r1*E.v1[1]+r2*E.v2[1]]; if(prev) p.line(prev,q,color,width); prev=q; } }

  // ---- 7.1 gradient descent in 1D on a non-convex function ----
  const F1=x=>x**4+7*x**3+5*x*x-17*x+3, D1=x=>4*x**3+21*x*x+10*x-17;
  widget1D('w-gd1',[
    {id:'x0',label:'x₀',min:-5.5,max:2.5,step:.1,value:1},{id:'lr',label:'γ·1000',min:1,max:60,step:1,value:10},{id:'n',label:'steps',min:0,max:60,step:1,value:25},
  ],(s,p)=>{
    const g=s.lr/1000; let x=s.x0; const path=[x];
    for(let i=0;i<s.n;i++){ x=x-g*D1(x); path.push(x); if(Math.abs(x)>50) break; }
    p.curve(F1,'#2d2a26',2.5);
    p.dot(-4.49,F1(-4.49),'rgba(47,158,68,.9)','global min',6); p.dot(.66,F1(.66),'rgba(47,158,68,.9)','local min',6);
    path.forEach((q,i)=>{ if(i>0) p.seg(path[i-1],F1(path[i-1]),q,F1(q),'rgba(217,72,15,.4)',1.5); p.dot(q,F1(q),i===0?BLUE:ORANGE,'',i===path.length-1?6:3.2); });
    const xe=path[path.length-1], div=Math.abs(xe)>10;
    return `f(x) = x⁴ + 7x³ + 5x² − 17x + 3 &nbsp; (two valleys). Update: x ← x − γ f′(x). &nbsp; start = <span style="color:${BLUE}"><b>blue</b></span>, steps = <span style="color:${ORANGE}"><b>orange</b></span><br>After ${path.length-1} steps: x = <b>${f2(xe)}</b>, f(x) = ${f2(F1(xe))}`+
      (div?'<br><span class="warn">Step too large: the iterates overshoot the valley and bounce around or blow up.</span>':(Math.abs(D1(xe))<.5?(xe>-2?'<br>Stuck in the <b>local</b> minimum (right valley). Gradient descent only finds <i>a</i> minimum, the one downhill from where you start.':'<br>Reached the <b>global</b> minimum (left valley).'):'<br>Still moving. Increase the steps (or γ).'));
  },[{name:'Start right (→ local min)',v:{x0:1,lr:10,n:30}},{name:'Start left (→ global min)',v:{x0:-2,lr:10,n:40}},{name:'γ too small',v:{x0:-2,lr:1,n:40}},{name:'γ too large',v:{x0:-5,lr:60,n:20}}],{},{xmin:-6,xmax:3,ymin:-60,ymax:120,xs:1,ys:20});

  // ---- 7.1 gradient descent in 2D (book Example 7.1) with momentum and SGD-style noise ----
  (function(){
    const root=document.getElementById('w-gd'); if(!root) return;
    const canvas=root.querySelector('canvas'), ctrl=root.querySelector('.ctrl'), out=root.querySelector('.readout'), plane=new Plane(canvas);
    const Q=[[2,1],[1,20]], bb=[5,3], xs=[97/39,1/39];
    const f=x=>x[0]*x[0]+x[0]*x[1]+10*x[1]*x[1]-5*x[0]-3*x[1], grad=x=>[2*x[0]+x[1]-5,x[0]+20*x[1]-3], fmin=f(xs);
    const bar=document.createElement('div'); bar.className='presets';
    const mk=(t,fn)=>{ const b=document.createElement('button'); b.textContent=t; b.onclick=fn; return b; };
    const sg=addSlider(ctrl,{label:'γ',min:.005,max:.11,step:.005,value:.085,dec:3}), sa=addSlider(ctrl,{label:'α',min:0,max:.95,step:.05,value:0,dec:2}), sn=addSlider(ctrl,{label:'noise',min:0,max:10,step:.5,value:0,dec:1});
    let x0=[-3,-1], path, delta, rng, k, lastF;
    function reset(){ path=[x0.slice()]; delta=[0,0]; rng=makeRng(5); k=0; lastF=f(x0); draw(); }
    function step(n){ for(let i=0;i<n;i++){ const x=path[path.length-1], g=grad(x), gam=parseFloat(sg.value), al=parseFloat(sa.value), no=parseFloat(sn.value);
        const ng=[g[0]+no*rng.n(), g[1]+no*rng.n()], d=[-gam*ng[0]+al*delta[0], -gam*ng[1]+al*delta[1]]; delta=d; path.push([x[0]+d[0],x[1]+d[1]]); k++; if(nrm(path[path.length-1])>1e4) break; } draw(); }
    function draw(){
      plane.clear(); [1,3,8,20,45,90,160].forEach(c=>ellipse(plane,Q,xs,c,'rgba(217,72,15,.4)',1.4));
      path.forEach((q,i)=>{ if(i>0) plane.line(path[i-1],q,'rgba(37,99,184,.7)',1.8); }); path.forEach((q,i)=>plane.dot(q,i===0?GREEN:BLUE,'',i===0?5:2.6));
      plane.dot(xs,RED,'x*',5);
      const x=path[path.length-1], fx=f(x), g=grad(x), dist=nrm([x[0]-xs[0],x[1]-xs[1]]), up=k>0&&fx>lastF+1e-9; if(k>0) lastF=fx;
      out.innerHTML=`Example 7.1: f(x) = ½xᵀQx − bᵀx, Q = [[2,1],[1,20]], b = (5, 3). Minimum x* = (${f2(xs[0])}, ${f2(xs[1])}) (red).<br>`+
        `Iteration <b>${k}</b>: x = (${f2(x[0])}, ${f2(x[1])}), f(x) − f(x*) = ${f2(fx-fmin)}, ‖∇f‖ = ${f2(nrm(g))}, distance to x* = ${f2(dist)}<br>`+
        (dist>40?'<span class="warn">Diverged: γ is too large (stability needs γ &lt; 2/λ<sub>max</sub> ≈ 0.1 without momentum).</span>':(up?'<span class="warn">f went up on the last step: the step overshot the narrow valley.</span> ':'')+(dist<.05?'<span class="ok">Converged.</span>':'')+(k===1?` First step from (−3,−1): x₁ = (${f2(path[1][0])}, ${f2(path[1][1])}) (book: (−1.98, 1.21) for γ = 0.085).`:''))+
        `<br><span class="why">Click anywhere on the plot to move the starting point. The long thin valley makes plain gradient descent zig-zag across it.</span>`;
    }
    [['Book Ex. 7.1 (γ = 0.085)',{g:.085,a:0,n:0}],['Too small',{g:.01,a:0,n:0}],['Too large',{g:.105,a:0,n:0}],['With momentum',{g:.04,a:.7,n:0}],['Noisy gradient (SGD-like)',{g:.03,a:0,n:6}]].forEach(([t,v])=>bar.appendChild(mk(t,()=>{ sg.value=v.g; sa.value=v.a; sn.value=v.n; sg._show(); sa._show(); sn._show(); reset(); })));
    const act=document.createElement('div'); act.className='presets'; act.append(mk('Step',()=>step(1)),mk('+25 steps',()=>step(25)),mk('Reset',reset));
    ctrl.before(bar); ctrl.after(act);
    canvas.addEventListener('click',e=>{ const r=canvas.getBoundingClientRect(); x0=[(e.clientX-r.left)/r.width*12-6, 6-(e.clientY-r.top)/r.height*12]; reset(); });
    window.addEventListener('resize',()=>{plane.resize();draw();}); reset();
  })();

  // ---- 7.2 Lagrange multipliers (equality constraint) ----
  widget('w-lagr',[
    {id:'px',label:'p₁',min:-5,max:5,value:3},{id:'py',label:'p₂',min:-5,max:5,value:3},{id:'t',label:'t',min:-6,max:6,value:2},
  ],(s,p)=>{
    const pc=[s.px,s.py]; let X,gg,opt;
    for(let r=1;r<=9;r++){ let prev=null; for(let i=0;i<=100;i++){ const a=i/100*2*Math.PI, q=[pc[0]+r*Math.cos(a),pc[1]+r*Math.sin(a)]; if(prev) p.line(prev,q,'rgba(120,110,95,.28)',1); prev=q; } }
    if(s.ct==='line'){ const n=[1,2], c=4, d=[-2/Math.sqrt(5),1/Math.sqrt(5)], foot=[c*n[0]/5,c*n[1]/5]; p.implicit(n,c,RED,3); X=[foot[0]+s.t*d[0],foot[1]+s.t*d[1]]; gg=n; const k=(c-dot(n,pc))/5; opt=[pc[0]+k*n[0],pc[1]+k*n[1]]; }
    else { let prev=null; for(let i=0;i<=120;i++){ const a=i/120*2*Math.PI, q=[3*Math.cos(a),3*Math.sin(a)]; if(prev) p.line(prev,q,RED,3); prev=q; } const ph=s.t*Math.PI/6; X=[3*Math.cos(ph),3*Math.sin(ph)]; gg=[2*X[0],2*X[1]]; const nn=nrm(pc); opt=nn>1e-9?[3*pc[0]/nn,3*pc[1]/nn]:null; }
    const gf=(q)=>[2*(q[0]-pc[0]),2*(q[1]-pc[1])], fv=q=>(q[0]-pc[0])**2+(q[1]-pc[1])**2;
    p.dot(pc,BLUE,'min of f',5);
    if(opt) p.dot(opt,GREEN,'constrained min',7);
    const g1=gf(X), n1=nrm(g1), n2=nrm(gg); if(n1>1e-9) p.arrow([2*g1[0]/n1,2*g1[1]/n1],GREEN,'∇f',X); if(n2>1e-9) p.arrow([2*gg[0]/n2,2*gg[1]/n2],ORANGE,'∇g',X);
    p.dot(X,'#2d2a26','',5);
    const ang=n1>1e-9&&n2>1e-9?Math.acos(Math.max(-1,Math.min(1,dot(g1,gg)/(n1*n2))))*180/Math.PI:NaN;
    let lam='';
    if(opt){ const go=gf(opt), gc=s.ct==='line'?[1,2]:[2*opt[0],2*opt[1]]; const l=-dot(go,gc)/dot(gc,gc); lam=`At the constrained minimum: ∇f = −λ∇g with <b>λ = ${f2(l)}</b> (the two gradients are parallel).`; }
    return `f(x) = ‖x − p‖² (circles, "distance to p"). Constraint g(x) = 0: <span style="color:${RED}"><b>red</b></span> ${s.ct==='line'?'line x₁ + 2x₂ − 4 = 0':'circle x₁² + x₂² − 9 = 0'}. Slide <i>t</i> to walk along the constraint.<br>`+
      `At the black dot: f = <b>${f2(fv(X))}</b>, angle between ∇f and ∇g = <b>${isNaN(ang)?'–':ang.toFixed(0)+'°'}</b>`+((!isNaN(ang)&&(ang<4||ang>176))?' → <span class="ok">parallel: a stationary point!</span>':'')+`<br>${lam}<br><span class="why">Why: if ∇f had any component along the constraint, you could slide along it and lower f. At the minimum ∇f must point straight "into/out of" the constraint, parallel to ∇g.</span>`;
  },[{name:'Line constraint',v:{ct:'line'}},{name:'Circle constraint',v:{ct:'circle'}}],{ct:'line'});

  // ---- 7.3 convexity: the chord lies above the curve ----
  const CF={
    sq:{name:'x²',f:x=>x*x,d:x=>2*x,lo:-3,hi:3,ymin:-1,ymax:9,xs:1,ys:2},
    dw:{name:'x⁴/4 − x²',f:x=>x**4/4-x*x,d:x=>x**3-2*x,lo:-3,hi:3,ymin:-2,ymax:9,xs:1,ys:2},
    xl:{name:'x log₂ x (book Ex. 7.3)',f:x=>x*Math.log2(x),d:x=>Math.log2(x)+1/Math.LN2,lo:.05,hi:5,ymin:-1,ymax:12,xs:1,ys:2},
    ex:{name:'eˣ',f:Math.exp,d:Math.exp,lo:-3,hi:3,ymin:-1,ymax:20,xs:1,ys:5},
  };
  widget1D('w-convex',[
    {id:'ua',label:'x',min:0,max:1,step:.01,value:.2},{id:'ub',label:'y',min:0,max:1,step:.01,value:.85},{id:'th',label:'θ',min:0,max:1,step:.05,value:.5},
  ],(s,p)=>{
    const C=CF[s.fn]; Object.assign(p.r,{xmin:C.lo,xmax:C.hi,ymin:C.ymin,ymax:C.ymax,xs:C.xs,ys:C.ys}); p.clear();
    const a=C.lo+(C.hi-C.lo)*s.ua, b=C.lo+(C.hi-C.lo)*s.ub, m=s.th*a+(1-s.th)*b, fa=C.f(a), fb=C.f(b), chord=s.th*fa+(1-s.th)*fb, fm=C.f(m);
    p.curve(C.f,'#2d2a26',2.5,C.lo+1e-3,C.hi); p.seg(a,fa,b,fb,ORANGE,2.5);
    p.tangent(a,fa,C.d(a),'rgba(47,158,68,.7)',1.8,true);
    p.dot(a,fa,BLUE,'x',5); p.dot(b,fb,BLUE,'y',5); p.dot(m,chord,ORANGE,'',6); p.dot(m,fm,RED,'',6);
    const ok=fm<=chord+1e-9, tanOK=C.f(b)>=fa+C.d(a)*(b-a)-1e-9;
    return `f = ${C.name}. Point between x and y: θx + (1−θ)y = ${f2(m)}<br>f(θx + (1−θ)y) = <b style="color:${RED}">${f2(fm)}</b> (red, on the curve) &nbsp; vs &nbsp; θf(x) + (1−θ)f(y) = <b style="color:${ORANGE}">${f2(chord)}</b> (orange, on the chord)<br>`+
      (ok?'<span class="ok">Curve ≤ chord ✓</span> (the convexity inequality holds here)':'<span class="warn">Curve is ABOVE the chord ✗: f is not convex.</span>')+`<br>Tangent at x (green dashed): f(y) ${tanOK?'≥':'<'} f(x) + f′(x)(y − x) ${tanOK?'✓':'✗'}. For a convex function every tangent line stays below the curve.`;
  },[{name:'x² (convex)',v:{fn:'sq'}},{name:'Double well (not convex)',v:{fn:'dw',ua:.27,ub:.73,th:.5}},{name:'x log₂x: book x=2, y=4',v:{fn:'xl',ua:.394,ub:.798,th:.5}},{name:'eˣ (convex)',v:{fn:'ex'}}],{fn:'sq'},{xmin:-3,xmax:3,ymin:-1,ymax:9});

  // ---- 7.3.1 linear program (book Example 7.5) ----
  widgetFree('w-lp',[
    {id:'c1',label:'c₁',min:-8,max:8,step:.5,value:-5},{id:'c2',label:'c₂',min:-8,max:8,step:.5,value:-3},
  ],(s,g,w,h)=>{
    const A=[[2,2,33],[2,-4,8],[-2,1,-5],[0,-1,-1],[0,1,8]];
    let poly=[[-50,-50],[50,-50],[50,50],[-50,50]];
    A.forEach(([a1,a2,b])=>{ const out=[]; for(let i=0;i<poly.length;i++){ const P=poly[i], Qn=poly[(i+1)%poly.length], vp=a1*P[0]+a2*P[1]-b, vq=a1*Qn[0]+a2*Qn[1]-b;
      if(vp<=0) out.push(P); if((vp<0&&vq>0)||(vp>0&&vq<0)){ const t=vp/(vp-vq); out.push([P[0]+t*(Qn[0]-P[0]),P[1]+t*(Qn[1]-P[1])]); } } poly=out; });
    const xmin=-1,xmax=16.5,ymin=-.5,ymax=9.5, X=x=>40+(x-xmin)/(xmax-xmin)*(w-56), Y=y=>h-26-(y-ymin)/(ymax-ymin)*(h-40);
    g.strokeStyle=css('--grid'); g.lineWidth=1; g.fillStyle=css('--muted'); g.font='11px system-ui'; g.textAlign='center';
    for(let x=0;x<=16;x+=2){ g.beginPath(); g.moveTo(X(x),Y(ymin)); g.lineTo(X(x),Y(ymax)); g.stroke(); g.fillText(x,X(x),h-10); }
    g.textAlign='right'; for(let y=0;y<=9;y+=2){ g.beginPath(); g.moveTo(X(xmin),Y(y)); g.lineTo(X(xmax),Y(y)); g.stroke(); g.fillText(y,34,Y(y)+4); }
    g.strokeStyle=css('--axis'); g.beginPath(); g.moveTo(X(xmin),Y(0)); g.lineTo(X(xmax),Y(0)); g.moveTo(X(0),Y(ymin)); g.lineTo(X(0),Y(ymax)); g.stroke();
    g.save(); g.beginPath(); g.rect(X(xmin),Y(ymax),X(xmax)-X(xmin),Y(ymin)-Y(ymax)); g.clip();
    g.fillStyle='rgba(47,158,68,.16)'; g.beginPath(); poly.forEach((q,i)=>i?g.lineTo(X(q[0]),Y(q[1])):g.moveTo(X(q[0]),Y(q[1]))); g.closePath(); g.fill(); g.strokeStyle='rgba(47,158,68,.9)'; g.lineWidth=2.5; g.stroke();
    A.forEach(([a1,a2,b])=>{ g.strokeStyle='rgba(120,110,95,.5)'; g.lineWidth=1; g.beginPath(); if(Math.abs(a2)>1e-9){ g.moveTo(X(-50),Y((b+50*a1)/a2)); g.lineTo(X(50),Y((b-50*a1)/a2)); } else { g.moveTo(X(b/a1),Y(-50)); g.lineTo(X(b/a1),Y(50)); } g.stroke(); });
    const c=[s.c1,s.c2]; let best=null,bv=Infinity; poly.forEach(q=>{ const v=c[0]*q[0]+c[1]*q[1]; if(v<bv-1e-9){bv=v;best=q;} });
    if(nrm(c)>1e-9&&best){ const nc=nrm(c), dir=[-c[1]/nc,c[0]/nc];
      for(let k=-4;k<=4;k++){ const z=bv+k*3*nc; g.strokeStyle=k===0?'rgba(217,72,15,.95)':'rgba(217,72,15,.3)'; g.lineWidth=k===0?2.5:1.2; g.setLineDash(k===0?[]:[5,4]);
        const ctr=[c[0]*z/(nc*nc),c[1]*z/(nc*nc)]; g.beginPath(); g.moveTo(X(ctr[0]-60*dir[0]),Y(ctr[1]-60*dir[1])); g.lineTo(X(ctr[0]+60*dir[0]),Y(ctr[1]+60*dir[1])); g.stroke(); } g.setLineDash([]); }
    g.restore();
    if(best){ g.fillStyle=ORANGE; g.beginPath(); const cx=X(best[0]),cy=Y(best[1]); for(let i=0;i<10;i++){ const r=i%2?5:12, a=-Math.PI/2+i*Math.PI/5; g.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)); } g.closePath(); g.fill(); }
    if(nrm(c)>1e-9){ const nc=nrm(c), cx=X(2),cy=Y(8.4); g.strokeStyle=BLUE; g.fillStyle=BLUE; g.lineWidth=3; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx-c[0]/nc*34,cy+c[1]/nc*34); g.stroke(); g.font='bold 12px system-ui'; g.textAlign='left'; g.fillText('−c (downhill)',cx-c[0]/nc*34+4,cy+c[1]/nc*34+14); }
    const act=best?A.map((r,i)=>Math.abs(r[0]*best[0]+r[1]*best[1]-r[2])<1e-6?i+1:null).filter(Boolean):[];
    return `Minimise cᵀx subject to Ax ≤ b (book Example 7.5, with c = (−5, −3)). <span style="color:#2f9e44"><b>Green</b></span> = feasible region (a polygon). Dashed orange = lines of equal objective value.<br>`+
      (best?`Optimum <b>x* = (${f2(best[0])}, ${f2(best[1])})</b> (star), cᵀx* = ${f2(bv)}. Active constraints: ${act.length?act.map(i=>'#'+i).join(', '):'none'}.<br>The optimum of a linear program is always at a <b>corner</b> (vertex). Rotate c with the sliders and the star jumps from corner to corner.`:'No feasible region.');
  },[{name:'Book: c = (−5, −3)',v:{c1:-5,c2:-3}},{name:'c = (1, 1)',v:{c1:1,c2:1}},{name:'c = (0, −1)',v:{c1:0,c2:-1}},{name:'c = (−1, 2)',v:{c1:-1,c2:2}}]);

  // ---- 7.3.2 quadratic program (book Example 7.6) ----
  widget('w-qp',[{id:'sz',label:'box ±',min:.3,max:4,step:.1,value:1}],(s,p)=>{
    const Q=[[2,1],[1,4]], c=[5,3], f=x=>.5*(2*x[0]*x[0]+2*x[0]*x[1]+4*x[1]*x[1])+c[0]*x[0]+c[1]*x[1], xu=[-17/7,-1/7], z=s.sz;
    const cl=v=>Math.max(-z,Math.min(z,v)), cand=[]; if(Math.abs(xu[0])<=z&&Math.abs(xu[1])<=z) cand.push(xu);
    [-z,z].forEach(e=>{ cand.push([e,cl(-(c[1]+e)/4)]); cand.push([cl(-(c[0]+e)/2),e]); }); cand.push([-z,-z],[z,z],[-z,z],[z,-z]);
    let best=cand[0]; cand.forEach(q=>{ if(f(q)<f(best)-1e-12) best=q; });
    [.5,1.5,3,6,12,20].forEach(l=>ellipse(p,Q,xu,l,'rgba(217,72,15,.4)',1.4));
    p.poly([[-z,-z],[z,-z],[z,z],[-z,z]],'rgba(47,158,68,.14)','rgba(47,158,68,.95)');
    p.dot(xu,BLUE,'unconstrained min',5); p.dot(best,RED,'constrained min',7);
    const inside=Math.abs(xu[0])<=z&&Math.abs(xu[1])<=z;
    return `Minimise ½xᵀQx + cᵀx with Q = [[2,1],[1,4]], c = (5, 3), subject to |x₁| ≤ ${z.toFixed(1)}, |x₂| ≤ ${z.toFixed(1)} (book Example 7.6: box ±1).<br>`+
      `Unconstrained minimum x = −Q⁻¹c = (${f2(xu[0])}, ${f2(xu[1])}) (blue). Constrained minimum: <b>(${f2(best[0])}, ${f2(best[1])})</b> (red), f = ${f2(f(best))}.<br>`+
      (inside?'<span class="ok">The box is big enough: the constraint is inactive, same answer as unconstrained.</span>':'The unconstrained minimum is outside the box, so the answer is pushed onto the <b>boundary</b>: the closest "ellipse level" that still touches the box. Make the box bigger to release it.');
  });
});
