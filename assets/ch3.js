// Chapter 3 visuals: norms, inner products, angles, projections, Gram-Schmidt, rotations.
// Uses Plane, widget(), colors and helpers from app.js.
document.addEventListener('DOMContentLoaded',()=>{
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), nrm=a=>Math.sqrt(dot(a,a)), deg=r=>r*180/Math.PI, f2=x=>(Math.abs(x)<5e-3?0:x).toFixed(2);
  const dash=(p,a,b,c,w=2)=>{p.ctx.setLineDash([6,4]);p.line(a,b,c,w);p.ctx.setLineDash([]);};
  const sub=(a,b)=>a.map((x,i)=>x-b[i]), add=(a,b)=>a.map((x,i)=>x+b[i]), mul=(k,a)=>a.map(x=>k*x);
  const vs=v=>'('+v.map(f2).join(', ')+')';

  // ---- 3.1 norms: all vectors with the same p-norm as x ----
  widget('w-norm',[
    {id:'x1',label:'x₁',min:-4,max:4,value:3},{id:'x2',label:'x₂',min:-4,max:4,value:2},{id:'p',label:'p',min:1,max:20,step:.5,value:2},
  ],(s,p)=>{
    const pn=(a,b,q)=>Math.pow(Math.pow(Math.abs(a),q)+Math.pow(Math.abs(b),q),1/q);
    const rho=pn(s.x1,s.x2,s.p);
    if(rho>1e-6){ let prev=null;
      for(let i=0;i<=240;i++){ const t=i/240*2*Math.PI, u=[Math.cos(t),Math.sin(t)], k=rho/pn(u[0],u[1],s.p), q=[k*u[0],k*u[1]];
        if(prev) p.line(prev,q,ORANGE,3); prev=q; } }
    p.arrow([s.x1,s.x2],BLUE,'x');
    const l1=Math.abs(s.x1)+Math.abs(s.x2), l2=Math.hypot(s.x1,s.x2), li=Math.max(Math.abs(s.x1),Math.abs(s.x2));
    return `<b>Orange</b>: every vector with the same ℓ<sub>p</sub> length as x (p = ${s.p.toFixed(1)}).<br>`+
      `‖x‖₁ = |x₁|+|x₂| = <b>${l1.toFixed(2)}</b> &nbsp; ‖x‖₂ = √(x₁²+x₂²) = <b>${l2.toFixed(2)}</b> &nbsp; ‖x‖<sub>∞</sub> = max = <b>${li.toFixed(2)}</b><br>`+
      `p = 1 gives a diamond, p = 2 a circle, large p approaches a square.`;
  },[{name:'ℓ1 (Manhattan)',v:{p:1}},{name:'ℓ2 (Euclidean)',v:{p:2}},{name:'p = 20 (≈ max norm)',v:{p:20}}]);

  // ---- 3.2 inner product defined by a symmetric matrix A ----
  widget('w-inner',[
    {id:'a',label:'A₁₁',min:-1,max:4,value:1},{id:'b',label:'A₁₂',min:-2,max:2,value:0},{id:'c',label:'A₂₂',min:-1,max:4,value:1},
  ],(s,p)=>{
    const ip=(u,v)=>u[0]*(s.a*v[0]+s.b*v[1])+u[1]*(s.b*v[0]+s.c*v[1]);
    const pd=s.a>1e-9&&(s.a*s.c-s.b*s.b)>1e-9;
    const x=[2,2], y=[-2,2];
    if(pd){ let prev=null; for(let i=0;i<=240;i++){ const t=i/240*2*Math.PI,u=[Math.cos(t),Math.sin(t)],k=2/Math.sqrt(ip(u,u)),q=[k*u[0],k*u[1]];
      if(prev) p.line(prev,q,'rgba(217,72,15,.6)',2.5); prev=q; } }
    p.arrow(x,BLUE,'x'); p.arrow(y,GREEN,'y');
    const head=`A = [[${s.a.toFixed(1)}, ${s.b.toFixed(1)}],[${s.b.toFixed(1)}, ${s.c.toFixed(1)}]], &nbsp; x = (2, 2), y = (−2, 2)<br>`;
    if(!pd) return head+`<span class="warn">Not positive definite</span> (needs A₁₁ &gt; 0 and det A &gt; 0), so ⟨x,y⟩ = xᵀAy is <b>not</b> an inner product. No lengths or angles.`;
    const xy=ip(x,y), lx=Math.sqrt(ip(x,x)), ly=Math.sqrt(ip(y,y)), c=xy/(lx*ly), w=deg(Math.acos(Math.max(-1,Math.min(1,c))));
    return head+`<span class="ok">Valid inner product ✓</span><br>⟨x,y⟩ = ${f2(xy)}, &nbsp; ‖x‖ = ${f2(lx)}, ‖y‖ = ${f2(ly)}<br>Angle between x and y: <b>${w.toFixed(1)}°</b>`+(Math.abs(xy)<1e-6?' → <span class="ok">orthogonal</span>':' → not orthogonal')+
      `<br><span style="color:${ORANGE}"><b>Orange</b></span>: all vectors of length 2 under this inner product.`;
  },[{name:'Dot product',v:{a:1,b:0,c:1}},{name:'diag(2, 1)  (book Ex. 3.7)',v:{a:2,b:0,c:1}},{name:'book Ex. 3.5 (lengths)',v:{a:1,b:-.5,c:1}},{name:'Not positive definite',v:{a:1,b:2,c:1}}]);

  // ---- 3.3 / 3.4 angle, dot product, distance ----
  widget('w-angle',[
    {id:'ux',label:'uₓ',min:-5,max:5,value:3},{id:'uy',label:'u_y',min:-5,max:5,value:1},
    {id:'vx',label:'vₓ',min:-5,max:5,value:-1},{id:'vy',label:'v_y',min:-5,max:5,value:3},
  ],(s,p)=>{
    const u=[s.ux,s.uy], v=[s.vx,s.vy], lu=nrm(u), lv=nrm(v);
    p.dashedSeg=null; dash(p,u,v,'rgba(120,110,95,.6)',1.5);
    p.arrow(u,BLUE,'u'); p.arrow(v,GREEN,'v');
    if(lu<1e-6||lv<1e-6) return 'Angles need nonzero vectors.';
    const c=Math.max(-1,Math.min(1,dot(u,v)/(lu*lv))), w=Math.acos(c);
    const a1=Math.atan2(u[1],u[0]); let d=Math.atan2(v[1],v[0])-a1; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
    const g=p.ctx; g.strokeStyle=RED; g.lineWidth=2; g.beginPath(); g.arc(p.X(0),p.Y(0),34,-a1,-(a1+d),d>0); g.stroke();
    return `u·v = ${f2(dot(u,v))} &nbsp; ‖u‖ = ${f2(lu)}, ‖v‖ = ${f2(lv)}<br>cos ω = u·v / (‖u‖‖v‖) = <b>${c.toFixed(3)}</b> → ω = <b>${deg(w).toFixed(1)}°</b><br>`+
      `Cauchy–Schwarz: |u·v| = ${f2(Math.abs(dot(u,v)))} ≤ ‖u‖‖v‖ = ${f2(lu*lv)} ✓<br>Distance d(u,v) = ‖u − v‖ = ${f2(nrm(sub(u,v)))} (dashed line)`+
      (Math.abs(dot(u,v))<0.05?'<br><span class="ok">Orthogonal: u ⊥ v</span>':(c>.97?'<br>Almost the same direction.':(c<-.97?'<br>Almost opposite directions.':'')));
  },[{name:'Orthogonal',v:{ux:3,uy:1,vx:-1,vy:3}},{name:'Same direction',v:{ux:2,uy:1,vx:4,vy:2}},{name:'Opposite',v:{ux:2,uy:1,vx:-4,vy:-2}},{name:'Book Ex. 3.6: (1,1),(1,2)',v:{ux:1,uy:1,vx:1,vy:2}}]);

  // ---- 3.5 orthonormal basis: coordinates are just dot products ----
  widget('w-onb',[
    {id:'th',label:'θ°',min:-180,max:180,step:5,value:30},{id:'x1',label:'x₁',min:-5,max:5,value:3},{id:'x2',label:'x₂',min:-5,max:5,value:2},
  ],(s,p)=>{
    const th=s.th*Math.PI/180, b1=[Math.cos(th),Math.sin(th)], b2=[-Math.sin(th),Math.cos(th)], x=[s.x1,s.x2];
    const l1=dot(x,b1), l2=dot(x,b2), c1=mul(l1,b1), c2=mul(l2,b2);
    p.through(b1,'rgba(37,99,184,.15)',1); p.through(b2,'rgba(47,158,68,.15)',1);
    dash(p,x,c1,'rgba(120,110,95,.7)',1.5); dash(p,x,c2,'rgba(120,110,95,.7)',1.5);
    p.arrow(c1,'rgba(37,99,184,.45)',''); p.arrow(c2,'rgba(47,158,68,.45)','');
    p.arrow(b1,BLUE,'b₁'); p.arrow(b2,GREEN,'b₂'); p.dot(x,RED,'x',6);
    return `b₁ = (${f2(b1[0])}, ${f2(b1[1])}), b₂ = (${f2(b2[0])}, ${f2(b2[1])}): unit length and b₁·b₂ = ${f2(dot(b1,b2))}<br>`+
      `Coordinates of x, with <b>no equation solving</b>:<br>λ₁ = bᵀ₁x = <b>${f2(l1)}</b>, &nbsp; λ₂ = bᵀ₂x = <b>${f2(l2)}</b><br>Check: λ₁b₁ + λ₂b₂ = ${vs(add(c1,c2))} = x ✓`;
  },[{name:'Standard basis',v:{th:0}},{name:'Rotated 45°',v:{th:45}}]);

  // ---- 3.6 orthogonal complement ----
  projWidget('w-compl','compl');
  // ---- 3.8.1 projection onto a line ----
  projWidget('w-proj','line');
  function projWidget(id,mode){
    const sl=[{id:'th',label:'θ°',min:0,max:175,step:5,value:30}];
    if(mode==='line') sl.push({id:'len',label:'|b|',min:.5,max:3,value:2});
    sl.push({id:'x1',label:'x₁',min:-5,max:5,value:3},{id:'x2',label:'x₂',min:-5,max:5,value:4});
    widget(id,sl,(s,p)=>{
      const th=s.th*Math.PI/180, u=[Math.cos(th),Math.sin(th)], L=mode==='line'?s.len:1, b=mul(L,u), x=[s.x1,s.x2];
      const lam=dot(b,x)/dot(b,b), pi=mul(lam,b), err=sub(x,pi), en=nrm(err);
      p.through(u,'rgba(37,99,184,.35)',2);
      if(mode==='compl') p.through([-u[1],u[0]],'rgba(47,158,68,.5)',2);
      p.arrow(b,BLUE,'b');
      dash(p,x,pi,'rgba(120,110,95,.8)',1.5);
      if(en>1e-6&&Math.abs(lam)>1e-3){ const a=mul(-Math.sign(lam)*.35,u), w=mul(.35/en,err);
        p.poly([pi,add(pi,a),add(add(pi,a),w),add(pi,w)],null,'#777'); }
      p.arrow(pi,ORANGE,'π'); p.dot(x,RED,'x',6);
      if(mode==='compl'){
        const bp=[-u[1],u[0]], psi=dot(x,bp);
        return `b = (${f2(u[0])}, ${f2(u[1])}) spans U (blue line). U⊥ (green line) is everything orthogonal to U.<br>`+
          `x = λ·b + ψ·b⊥ with λ = ${f2(dot(x,u))}, ψ = ${f2(psi)}<br>Dimensions: dim U + dim U⊥ = 1 + 1 = 2 = dim ℝ². Only 0 lies in both.`;
      }
      const P=[[u[0]*u[0],u[0]*u[1]],[u[0]*u[1],u[1]*u[1]]];
      return `λ = bᵀx / bᵀb = <b>${f2(lam)}</b> &nbsp; π(x) = λb = <b>${vs(pi)}</b><br>Error ‖x − π(x)‖ = <b>${f2(en)}</b> (the dashed segment meets the line at a right angle)<br>`+
        `P = bbᵀ/‖b‖² = [[${f2(P[0][0])}, ${f2(P[0][1])}],[${f2(P[1][0])}, ${f2(P[1][1])}]], and P·P = P.<br><span class="why">Change |b|: λ changes, but π(x) and P do not. Only the direction matters.</span>`;
    },[{name:'Reset',v:{th:30}}]);
  }

  // ---- 3.8.1 projecting a cloud of data: the PCA preview ----
  (function(){
    const D=[[-4.2,-2.4],[-3.2,-1.2],[-1.6,-1.5],[-.4,.6],[1.2,.7],[2.6,1.9],[3.6,1.4],[4.4,2.8]];
    const Sxx=D.reduce((a,q)=>a+q[0]*q[0],0), Syy=D.reduce((a,q)=>a+q[1]*q[1],0), Sxy=D.reduce((a,q)=>a+q[0]*q[1],0);
    let best=deg(.5*Math.atan2(2*Sxy,Sxx-Syy)); if(best<0) best+=180;
    const lmax=(Sxx+Syy)/2+Math.sqrt(((Sxx-Syy)/2)**2+Sxy**2), Emin=Sxx+Syy-lmax;
    widget('w-projdata',[{id:'th',label:'θ°',min:0,max:175,step:1,value:100}],(s,p)=>{
      const th=s.th*Math.PI/180, u=[Math.cos(th),Math.sin(th)]; let E=0;
      p.through(u,'rgba(37,99,184,.4)',2);
      D.forEach(q=>{ const pi=mul(dot(q,u),u); E+=dot(sub(q,pi),sub(q,pi)); dash(p,q,pi,'rgba(120,110,95,.7)',1.2); p.dot(pi,ORANGE,'',3.5); });
      D.forEach(q=>p.dot(q,BLUE,'',4.5));
      const good=E<Emin*1.03;
      return `Total squared error Σ‖xᵢ − π(xᵢ)‖² = <b>${E.toFixed(1)}</b><br>Smallest possible: ${Emin.toFixed(1)} at θ ≈ ${best.toFixed(0)}°`+(good?'<br><span class="ok">You found (almost) the best line!</span>':'<br>Rotate the line to make the dashed segments shorter.');
    },[{name:'Jump to best angle',v:{th:Math.round(best)}},{name:'Bad angle',v:{th:100}}]);
  })();

  // ---- 3.8.2 projection onto a plane in R^3 (book Example 3.11) ----
  widget('w-proj3d',[
    {id:'az',label:'turn',min:-180,max:180,step:5,value:35},{id:'el',label:'tilt',min:0,max:80,step:5,value:20},
    {id:'x1',label:'x₁',min:-6,max:6,step:1,value:6},{id:'x2',label:'x₂',min:-6,max:6,step:1,value:0},{id:'x3',label:'x₃',min:-6,max:6,step:1,value:0},
  ],(s,p)=>{
    const a=s.az*Math.PI/180, e=s.el*Math.PI/180, sc=.8;
    const P3=q=>{ const x1=q[0]*Math.cos(a)-q[1]*Math.sin(a), y1=q[0]*Math.sin(a)+q[1]*Math.cos(a); return [x1*sc,(y1*Math.sin(e)+q[2]*Math.cos(e))*sc]; };
    const b1=[1,1,1], b2=[0,1,2], x=[s.x1,s.x2,s.x3];
    ['x₁','x₂','x₃'].forEach((n,i)=>{ const d=[0,0,0]; d[i]=6; const e0=[0,0,0]; e0[i]=-6;
      p.line(P3(e0),P3(d),css('--axis'),1); const t=P3(mul(1.07,d)); p.ctx.fillStyle=css('--muted'); p.ctx.font='12px system-ui'; p.ctx.fillText(n,p.X(t[0]),p.Y(t[1])); });
    const corner=(u,v)=>P3(add(mul(u,b1),mul(v,b2)));
    p.poly([corner(-1.4,-1.4),corner(1.4,-1.4),corner(1.4,1.4),corner(-1.4,1.4)],'rgba(217,72,15,.13)','rgba(217,72,15,.6)');
    p.arrow(P3(b1),BLUE,'b₁'); p.arrow(P3(b2),GREEN,'b₂');
    const G=[[dot(b1,b1),dot(b1,b2)],[dot(b1,b2),dot(b2,b2)]], r=[dot(b1,x),dot(b2,x)], det=G[0][0]*G[1][1]-G[0][1]*G[1][0];
    const lam=[(G[1][1]*r[0]-G[0][1]*r[1])/det,(-G[1][0]*r[0]+G[0][0]*r[1])/det];
    const pi=add(mul(lam[0],b1),mul(lam[1],b2)), er=sub(x,pi);
    dash(p,P3(x),P3(pi),'rgba(120,110,95,.9)',2);
    p.dot(P3(pi),GREEN,'π(x)',6); p.dot(P3(x),RED,'x',6);
    return `U = span[b₁, b₂] with b₁ = (1,1,1), b₂ = (0,1,2) (orange plane). Drag <i>turn/tilt</i> to look around.<br>`+
      `Normal equation BᵀBλ = Bᵀx gives λ = (${f2(lam[0])}, ${f2(lam[1])})<br>π(x) = Bλ = <b>${vs(pi)}</b><br>Error ‖x − π(x)‖ = <b>${f2(nrm(er))}</b><br>`+
      `Check: (x − π)·b₁ = ${f2(dot(er,b1))}, (x − π)·b₂ = ${f2(dot(er,b2))} (both 0: the error is orthogonal to U)`;
  },[{name:'Book example x = (6,0,0)',v:{x1:6,x2:0,x3:0}},{name:'x inside U (error 0)',v:{x1:2,x2:4,x3:6}}]);

  // ---- 3.8.3 Gram-Schmidt ----
  widget('w-gs',[
    {id:'b1x',label:'b₁ₓ',min:-5,max:5,value:2},{id:'b1y',label:'b₁ᵧ',min:-5,max:5,value:0},
    {id:'b2x',label:'b₂ₓ',min:-5,max:5,value:1},{id:'b2y',label:'b₂ᵧ',min:-5,max:5,value:1},
  ],(s,p)=>{
    const b1=[s.b1x,s.b1y], b2=[s.b2x,s.b2y], l1=dot(b1,b1);
    p.arrow(b1,BLUE,'b₁=u₁'); p.arrow(b2,'rgba(47,158,68,.6)','b₂');
    if(l1<1e-6) return 'b₁ must be nonzero.';
    const pr=mul(dot(b1,b2)/l1,b1), u2=sub(b2,pr);
    dash(p,pr,b2,'rgba(120,110,95,.8)',1.5); p.arrow(pr,'rgba(217,72,15,.6)','π');
    if(nrm(u2)<1e-6) return `<span class="warn">b₂ is a multiple of b₁</span>: they are dependent, so there is nothing new to orthogonalise.`;
    p.arrow(u2,RED,'u₂');
    const e1=mul(1/nrm(b1),b1), e2=mul(1/nrm(u2),u2);
    return `u₁ = b₁ = ${vs(b1)}<br>π<sub>span[u₁]</sub>(b₂) = ${vs(pr)} (orange)<br>u₂ = b₂ − π(b₂) = <b>${vs(u2)}</b> (red)<br>u₁·u₂ = <b>${f2(dot(b1,u2))}</b> ✓ orthogonal<br>Normalised: e₁ = ${vs(e1)}, e₂ = ${vs(e2)}`;
  },[{name:'Book Example 3.12',v:{b1x:2,b1y:0,b2x:1,b2y:1}},{name:'Tilted basis',v:{b1x:3,b1y:1,b2x:1,b2y:3}}]);

  // ---- 3.9 rotations ----
  widget('w-rot',[
    {id:'th',label:'θ°',min:-180,max:180,step:5,value:30},{id:'fl',label:'flip',min:0,max:1,step:1,value:0},
  ],(s,p)=>{
    const th=s.th*Math.PI/180, c=Math.cos(th), sn=Math.sin(th);
    const M=s.fl?[[c,sn],[sn,-c]]:[[c,-sn],[sn,c]];
    const app=v=>[M[0][0]*v[0]+M[0][1]*v[1], M[1][0]*v[0]+M[1][1]*v[1]];
    const x1=[2,3], x2=[0,-1], r1=app(x1), r2=app(x2);
    p.arrow(x1,'rgba(37,99,184,.35)','x₁'); p.arrow(x2,'rgba(47,158,68,.35)','x₂');
    p.arrow(r1,BLUE,'Rx₁'); p.arrow(r2,GREEN,'Rx₂');
    const ang=(a,b)=>deg(Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(nrm(a)*nrm(b))))));
    const det=M[0][0]*M[1][1]-M[0][1]*M[1][0];
    return `R = [[${f2(M[0][0])}, ${f2(M[0][1])}],[${f2(M[1][0])}, ${f2(M[1][1])}]] &nbsp; det R = <b>${det.toFixed(0)}</b>${s.fl?' (a flip, still orthogonal)':' (a pure rotation)'}<br>`+
      `Lengths: ‖x₁‖ = ${f2(nrm(x1))} → ${f2(nrm(r1))}, &nbsp; ‖x₂‖ = ${f2(nrm(x2))} → ${f2(nrm(r2))}<br>Angle between x₁ and x₂: ${ang(x1,x2).toFixed(1)}° → ${ang(r1,r2).toFixed(1)}°<br>Nothing about shapes changes, only the orientation.`;
  },[{name:'Rotate 30°',v:{th:30,fl:0}},{name:'Rotate 90°',v:{th:90,fl:0}},{name:'Flip (mirror)',v:{th:0,fl:1}}]);

  // ---- 3.7 inner product of functions ----
  (function(){
    const root=document.getElementById('w-funcs'); if(!root) return;
    const cv=root.querySelector('canvas'), ctrl=root.querySelector('.ctrl'), out=root.querySelector('.readout'), g=cv.getContext('2d');
    const F={'sin x':Math.sin,'cos x':Math.cos,'cos 2x':x=>Math.cos(2*x),'sin 2x':x=>Math.sin(2*x),'1':()=>1,'x':x=>x};
    const pairs=[['sin x','cos x'],['cos x','cos 2x'],['sin x','sin 2x'],['1','cos x'],['sin x','sin x'],['x','sin x']];
    let cur=0; const box=document.createElement('div'); box.className='presets';
    pairs.forEach((pr,i)=>{ const b=document.createElement('button'); b.textContent=`${pr[0]}  ·  ${pr[1]}`; b.onclick=()=>{cur=i;draw();}; box.appendChild(b); });
    ctrl.appendChild(box);
    function draw(){
      const dpr=window.devicePixelRatio||1, w=cv.clientWidth||600, h=cv.clientHeight||w/2.4;
      cv.width=w*dpr; cv.height=h*dpr; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
      const X=x=>10+(x+Math.PI)/(2*Math.PI)*(w-20), Y=y=>h/2-y*(h/2-14)/3, [nu,nv]=pairs[cur], u=F[nu], v=F[nv];
      g.strokeStyle=css('--grid'); g.lineWidth=1; for(let y=-3;y<=3;y++){ g.beginPath(); g.moveTo(10,Y(y)); g.lineTo(w-10,Y(y)); g.stroke(); }
      g.strokeStyle=css('--axis'); g.beginPath(); g.moveTo(10,Y(0)); g.lineTo(w-10,Y(0)); g.moveTo(X(0),6); g.lineTo(X(0),h-6); g.stroke();
      g.fillStyle=css('--muted'); g.font='12px system-ui'; [['−π',-Math.PI],['−π/2',-Math.PI/2],['π/2',Math.PI/2],['π',Math.PI]].forEach(([t,x])=>g.fillText(t,X(x)-8,Y(0)+14));
      const N=2000, dx=2*Math.PI/N; let I=0;
      for(let i=0;i<N;i++){ const x=-Math.PI+(i+.5)*dx, y=u(x)*v(x); I+=y*dx;
        g.fillStyle=y>=0?'rgba(217,72,15,.28)':'rgba(37,99,184,.28)'; g.fillRect(X(x),Math.min(Y(0),Y(y)),Math.max(1,X(x+dx)-X(x)+.5),Math.abs(Y(y)-Y(0))); }
      const curve=(fn,col,wd)=>{ g.strokeStyle=col; g.lineWidth=wd; g.beginPath(); for(let i=0;i<=400;i++){ const x=-Math.PI+i/400*2*Math.PI; i?g.lineTo(X(x),Y(fn(x))):g.moveTo(X(x),Y(fn(x))); } g.stroke(); };
      curve(u,BLUE,2); curve(v,GREEN,2); curve(x=>u(x)*v(x),ORANGE,2.5);
      g.font='bold 13px system-ui'; g.fillStyle=BLUE; g.fillText('u = '+nu,14,18); g.fillStyle=GREEN; g.fillText('v = '+nv,14,34); g.fillStyle=ORANGE; g.fillText('u·v  (area = ⟨u,v⟩)',14,50);
      const orth=Math.abs(I)<1e-3;
      out.innerHTML=`⟨u, v⟩ = ∫<sub>−π</sub><sup>π</sup> u(x)v(x) dx ≈ <b>${Math.abs(I)<1e-3?'0.00':I.toFixed(2)}</b><br>`+(orth?'<span class="ok">Orthogonal:</span> the orange area above the axis exactly cancels the area below it.':'<span class="warn">Not orthogonal:</span> the positive and negative areas do not cancel.');
    }
    window.addEventListener('resize',draw); draw();
  })();
});
