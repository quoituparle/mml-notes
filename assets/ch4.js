// Chapter 4 visuals: determinant, eigenvectors, SVD stages, low-rank approximation.
// Uses Plane, widget(), colors from app.js.
document.addEventListener('DOMContentLoaded',()=>{
  const f2=x=>(Math.abs(x)<5e-3?0:x).toFixed(2), dot=(a,b)=>a[0]*b[0]+a[1]*b[1], nrm=a=>Math.hypot(a[0],a[1]);
  const dash=(p,a,b,c,w=2)=>{p.ctx.setLineDash([6,4]);p.line(a,b,c,w);p.ctx.setLineDash([]);};
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];

  // ---- one-sided Jacobi SVD (m >= n):  A = U diag(S) V^T ----
  function svd(A){
    const m=A.length, n=A[0].length, U=A.map(r=>r.slice()), V=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
    for(let sweep=0;sweep<60;sweep++){ let rot=false;
      for(let p=0;p<n-1;p++)for(let q=p+1;q<n;q++){
        let al=0,be=0,ga=0; for(let i=0;i<m;i++){ al+=U[i][p]*U[i][p]; be+=U[i][q]*U[i][q]; ga+=U[i][p]*U[i][q]; }
        if(Math.abs(ga)>1e-12*Math.sqrt(al*be)&&Math.abs(ga)>1e-300){ rot=true;
          const z=(be-al)/(2*ga), t=Math.sign(z||1)/(Math.abs(z)+Math.sqrt(1+z*z)), c=1/Math.sqrt(1+t*t), s=c*t;
          for(let i=0;i<m;i++){ const a=U[i][p], b=U[i][q]; U[i][p]=c*a-s*b; U[i][q]=s*a+c*b; }
          for(let i=0;i<n;i++){ const a=V[i][p], b=V[i][q]; V[i][p]=c*a-s*b; V[i][q]=s*a+c*b; } } }
      if(!rot) break; }
    const S=[...Array(n).keys()].map(j=>Math.sqrt(U.reduce((a,r)=>a+r[j]*r[j],0)));
    const order=[...Array(n).keys()].sort((a,b)=>S[b]-S[a]);
    const Uo=U.map(r=>order.map(j=>S[j]>1e-10?r[j]/S[j]:0)), Vo=V.map(r=>order.map(j=>r[j]));
    return {U:Uo,S:order.map(j=>S[j]),V:Vo};
  }

  // ---- 4.1 determinant = signed area ----
  widget('w-det',[
    {id:'ax',label:'aₓ',min:-4,max:4,value:3},{id:'ay',label:'aᵧ',min:-4,max:4,value:1},
    {id:'bx',label:'bₓ',min:-4,max:4,value:1},{id:'by',label:'bᵧ',min:-4,max:4,value:2},
  ],(s,p)=>{
    const a=[s.ax,s.ay], b=[s.bx,s.by], det=a[0]*b[1]-b[0]*a[1];
    p.poly([[0,0],a,[a[0]+b[0],a[1]+b[1]],b],det>=0?'rgba(47,158,68,.2)':'rgba(201,42,42,.2)',det>=0?GREEN:RED);
    p.arrow(a,BLUE,'a'); p.arrow(b,ORANGE,'b');
    return `A = [a b] = [[${s.ax.toFixed(1)}, ${s.bx.toFixed(1)}],[${s.ay.toFixed(1)}, ${s.by.toFixed(1)}]]<br>det A = a₁₁a₂₂ − a₁₂a₂₁ = <b>${f2(det)}</b><br>Area of the parallelogram = |det A| = ${f2(Math.abs(det))}`+
      (Math.abs(det)<0.05?'<br><span class="warn">Area 0: a and b are dependent, so A is not invertible.</span>':(det>0?'<br><span class="ok">Positive:</span> b is counterclockwise from a (same orientation as e₁, e₂).':'<br><span class="warn">Negative:</span> b is clockwise from a (orientation flipped).'));
  },[{name:'Swap a and b (sign flips)',v:{ax:1,ay:2,bx:3,by:1}},{name:'Dependent',v:{ax:2,ay:1,bx:4,by:2}},{name:'Rectangle',v:{ax:3,ay:0,bx:0,by:2}}]);

  // ---- 4.2 eigenvectors: which x stay on their own line? ----
  widget('w-eig',[
    {id:'a',label:'a',min:-4,max:4,value:4},{id:'b',label:'b',min:-4,max:4,value:2},{id:'c',label:'c',min:-4,max:4,value:1},{id:'d',label:'d',min:-4,max:4,value:3},
    {id:'th',label:'θ°',min:0,max:360,step:5,value:30},
  ],(s,p)=>{
    const A=[[s.a,s.b],[s.c,s.d]], app=v=>[A[0][0]*v[0]+A[0][1]*v[1],A[1][0]*v[0]+A[1][1]*v[1]];
    let pc=null,pe=null;
    for(let i=0;i<=200;i++){ const t=i/200*2*Math.PI, u=[Math.cos(t),Math.sin(t)], q=app(u);
      if(pc) p.line(pc,u,'rgba(120,110,95,.6)',1.5); if(pe) p.line(pe,q,'rgba(217,72,15,.65)',2.5); pc=u; pe=q; }
    const tr=s.a+s.d, det=s.a*s.d-s.b*s.c, disc=tr*tr/4-det; let eig='';
    if(disc>=-1e-9){ const r=Math.sqrt(Math.max(0,disc)), ls=[tr/2+r,tr/2-r], seen=[];
      ls.forEach((l,i)=>{ const c1=[s.b,l-s.a], c2=[l-s.d,s.c], v=nrm(c1)>=nrm(c2)?c1:c2;
        if(nrm(v)>1e-9){ const u=[v[0]/nrm(v),v[1]/nrm(v)]; if(!(i===1&&r<1e-9)) p.through(u,'rgba(201,42,42,.55)',2);
          seen.push(`λ${i+1} = ${f2(l)} with eigenvector (${f2(u[0])}, ${f2(u[1])})`); } else seen.push(`λ${i+1} = ${f2(l)} (every vector is an eigenvector)`); });
      eig='<span class="ok">Real eigenvalues:</span><br>'+seen.join('<br>')+'<br><span style="color:#c92a2a">Red lines</span> = eigenspaces. Along them A only stretches.'; }
    else eig=`<span class="warn">Complex eigenvalues</span> ${f2(tr/2)} ± ${f2(Math.sqrt(-disc))}i: A rotates every direction, so no real vector stays on its line (no red lines).`;
    const x=[Math.cos(s.th*Math.PI/180),Math.sin(s.th*Math.PI/180)], Ax=app(x);
    p.arrow(x,BLUE,'x'); p.arrow(Ax,GREEN,'Ax');
    const par=nrm(Ax)<1e-9||Math.abs(cross(x,Ax))/nrm(Ax)<0.04;
    return `tr A = ${f2(tr)}, det A = ${f2(det)} &nbsp;→ p(λ) = λ² − ${f2(tr)}λ + ${f2(det)}<br>${eig}<br>`+
      `Test vector x = (${f2(x[0])}, ${f2(x[1])}) → Ax = (${f2(Ax[0])}, ${f2(Ax[1])})`+(par?'<br><span class="ok">Ax is on the same line as x: x is an eigenvector!</span>':'<br>Ax points elsewhere. Turn θ until Ax lines up with x.');
  },[{name:'Book Ex. 4.5',v:{a:4,b:2,c:1,d:3}},{name:'Symmetric',v:{a:2,b:1,c:1,d:2}},{name:'Rotation 45°',v:{a:.7,b:-.7,c:.7,d:.7}},{name:'Shear (defective)',v:{a:2,b:1,c:0,d:2}},{name:'Diagonal',v:{a:2,b:0,c:0,d:.5}}]);

  // ---- 4.5 SVD in stages ----
  widget('w-svd',[
    {id:'a',label:'a',min:-3,max:3,value:2},{id:'b',label:'b',min:-3,max:3,value:1},{id:'c',label:'c',min:-3,max:3,value:.5},{id:'d',label:'d',min:-3,max:3,value:1.5},
    {id:'st',label:'step',min:0,max:3,step:1,value:0},
  ],(s,p)=>{
    const A=[[s.a,s.b],[s.c,s.d]], {U,S,V}=svd(A), mapA=v=>[A[0][0]*v[0]+A[0][1]*v[1],A[1][0]*v[0]+A[1][1]*v[1]];
    const Vt=v=>[V[0][0]*v[0]+V[1][0]*v[1], V[0][1]*v[0]+V[1][1]*v[1]];
    const M=[v=>v, Vt, v=>{const w=Vt(v);return [S[0]*w[0],S[1]*w[1]];}, mapA][s.st];
    let prev=null; for(let i=0;i<=200;i++){ const t=i/200*2*Math.PI, q=M([Math.cos(t),Math.sin(t)]); if(prev) p.line(prev,q,ORANGE,2.5); prev=q; }
    const v1=[V[0][0],V[1][0]], v2=[V[0][1],V[1][1]];
    p.arrow(M(v1),BLUE,s.st===3?'σ₁u₁':(s.st===2?'σ₁e₁':(s.st===1?'e₁':'v₁'))); p.arrow(M(v2),GREEN,s.st===3?'σ₂u₂':(s.st===2?'σ₂e₂':(s.st===1?'e₂':'v₂')));
    p.dot(M([1,0]),RED,'',5);
    const names=['Start: the unit circle, with the right-singular vectors v₁ (blue) and v₂ (green).','Vᵀ: a rotation/reflection. v₁ and v₂ become the coordinate axes. The circle is unchanged.','Σ: stretch the axes by σ₁ and σ₂. The circle becomes an ellipse.','U: rotate/reflect again. This is the final result, Ax.'];
    const rank=S.filter(x=>x>1e-8).length;
    return `<b>Step ${s.st}/3.</b> ${names[s.st]}<br>σ₁ = ${f2(S[0])}, σ₂ = ${f2(S[1])} &nbsp; rank = ${rank} &nbsp; |det A| = σ₁σ₂ = ${f2(S[0]*S[1])}<br>The red dot follows the point (1, 0) so you can see rotations.`+(rank<2?'<br><span class="warn">σ₂ = 0: the ellipse collapses to a line (rank 1).</span>':'');
  },[{name:'Book-style',v:{a:2,b:1,c:.5,d:1.5}},{name:'Symmetric (eigen = SVD)',v:{a:2,b:1,c:1,d:2}},{name:'Pure rotation (σ₁ = σ₂ = 1)',v:{a:.7,b:-.7,c:.7,d:.7}},{name:'Rank 1',v:{a:1,b:2,c:.5,d:1}}]);

  // ---- 4.6 low-rank approximation ----
  (function(){
    const root=document.getElementById('w-lowrank'); if(!root) return;
    const cO=root.querySelector('.orig'), cA=root.querySelector('.appr'), cS=root.querySelector('.sv'), k=root.querySelector('.k'), kv=root.querySelector('.kv'), out=root.querySelector('.readout'), capk=root.querySelector('.capk'), pre=root.querySelector('.presets');
    const N=28; const img=[];
    let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;};
    for(let i=0;i<N;i++){ const r=[]; for(let j=0;j<N;j++){
      let v=0.25+0.35*(j/N);
      if(i>=5&&i<=13&&j>=3&&j<=12) v=0.95;
      if(Math.hypot(i-19,j-19)<6) v=0.1;
      if(Math.abs((i-j)-6)<1.2) v=Math.max(v,0.75);
      v+= (rnd()-.5)*0.1; r.push(Math.max(0,Math.min(1,v))); } img.push(r); }
    const movie=[[5,4,1],[5,5,0],[0,0,5],[1,0,4]];
    const sets={'Picture (28×28)':{A:img,nums:false,max:1,k:3},'Movie ratings (book Ex. 4.14)':{A:movie,nums:true,max:5,k:1}};
    Object.keys(sets).forEach(n=>sets[n].svd=svd(sets[n].A));
    let cur='Picture (28×28)';
    Object.keys(sets).forEach(n=>{ const b=document.createElement('button'); b.textContent=n; b.onclick=()=>{cur=n; k.max=sets[n].A[0].length; k.value=sets[n].k; draw();}; pre.appendChild(b); });
    function approx(D,kk){ const {U,S,V}=D.svd, m=D.A.length, n=D.A[0].length; const R=Array.from({length:m},()=>Array(n).fill(0));
      for(let r=0;r<kk;r++)for(let i=0;i<m;i++)for(let j=0;j<n;j++) R[i][j]+=S[r]*U[i][r]*V[j][r]; return R; }
    function drawMat(cv,M,max,nums){
      const m=M.length,n=M[0].length; cv.style.aspectRatio=n+'/'+m;
      const dpr=window.devicePixelRatio||1,w=cv.clientWidth||200,h=cv.clientHeight||200; cv.width=w*dpr; cv.height=h*dpr; const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
      const cw=w/n, ch=h/m;
      for(let i=0;i<m;i++)for(let j=0;j<n;j++){ const t=Math.max(0,Math.min(1,M[i][j]/max));
        if(nums){ g.fillStyle=`rgb(${Math.round(255-38*t)},${Math.round(250-178*t)},${Math.round(240-225*t)})`; } else { const gv=Math.round(255*t); g.fillStyle=`rgb(${gv},${gv},${gv})`; }
        g.fillRect(j*cw,i*ch,cw+.5,ch+.5);
        if(nums){ g.fillStyle=t>.55?'#fff':'#2d2a26'; g.font='bold 13px system-ui'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(M[i][j].toFixed(1),j*cw+cw/2,i*ch+ch/2); } }
    }
    function drawBars(cv,S,kk){
      const dpr=window.devicePixelRatio||1,w=cv.clientWidth||200,h=cv.clientHeight||200; cv.width=w*dpr; cv.height=h*dpr; const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
      const n=S.length, bw=(w-16)/n, mx=S[0]||1;
      S.forEach((v,i)=>{ const bh=(h-30)*v/mx; g.fillStyle=i<kk?ORANGE:'#cfc6b4'; g.fillRect(8+i*bw+1,h-16-bh,Math.max(1,bw-2),bh); });
      g.fillStyle=css('--muted'); g.font='11px system-ui'; g.textAlign='left'; g.fillText('σ₁',8,h-3); g.textAlign='right'; g.fillText('σ'+n,w-8,h-3);
    }
    function draw(){
      const D=sets[cur], kk=parseInt(k.value), n=D.A[0].length, m=D.A.length, mn=Math.min(m,n); kv.textContent=kk;
      const Ah=approx(D,kk); drawMat(cO,D.A,D.max,D.nums); drawMat(cA,Ah,D.max,D.nums); drawBars(cS,D.svd.S,kk);
      let fe=0; for(let i=0;i<m;i++)for(let j=0;j<n;j++) fe+=(D.A[i][j]-Ah[i][j])**2;
      const store=kk*(m+n+1), full=m*n, sig=D.svd.S[kk]||0;
      capk.textContent='Rank-'+kk+' approximation';
      out.innerHTML=`Σ<sub>i≤k</sub> σᵢuᵢvᵢᵀ keeps the <b>${kk}</b> strongest patterns out of ${mn}.<br>Spectral-norm error ‖A − Â(k)‖₂ = σ<sub>k+1</sub> = <b>${sig.toFixed(2)}</b> (Eckart–Young) &nbsp; Frobenius error = ${Math.sqrt(fe).toFixed(2)}<br>Numbers to store: k(m+n+1) = ${store} instead of m·n = ${full}`+(store>=full?' (no saving at this k)':` (${(100*store/full).toFixed(0)}%)`);
    }
    k.addEventListener('input',draw); window.addEventListener('resize',draw);
    k.max=sets[cur].A[0].length; k.value=sets[cur].k; draw();
  })();
});
