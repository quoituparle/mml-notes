// Chapter 5 visuals: derivative as a limit, Taylor, gradient + Hessian, Jacobian, backprop.
document.addEventListener('DOMContentLoaded',()=>{
  const f2=x=>(Math.abs(x)<5e-4?0:x).toFixed(3), f1=x=>(Math.abs(x)<5e-3?0:x).toFixed(2);

  // ---- 5.1 difference quotient -> derivative ----
  const FN={
    sq:{f:x=>x*x,d:x=>2*x,name:'x²'}, sin:{f:Math.sin,d:Math.cos,name:'sin x'},
    cub:{f:x=>x*x*x/2-x,d:x=>1.5*x*x-1,name:'x³/2 − x'}, abs:{f:Math.abs,d:x=>x>0?1:(x<0?-1:NaN),name:'|x|'},
  };
  widget1D('w-deriv',[
    {id:'x0',label:'x₀',min:-3,max:3,step:.1,value:1},{id:'h',label:'h',min:-3,max:3,step:.05,value:2},
  ],(s,p)=>{
    const F=FN[s.fn], h=Math.abs(s.h)<0.01?0.01:s.h, y0=F.f(s.x0), y1=F.f(s.x0+h), m=(y1-y0)/h, d=F.d(s.x0);
    p.curve(F.f,'#2d2a26',2.5);
    if(isFinite(d)) p.tangent(s.x0,y0,d,'rgba(47,158,68,.8)',2,true);
    p.tangent(s.x0,y0,m,ORANGE,2.5);
    p.dot(s.x0,y0,BLUE,'',5); p.dot(s.x0+h,y1,ORANGE,'',5);
    return `f(x) = ${F.name} at x₀ = ${s.x0.toFixed(1)}<br>Secant slope (f(x₀+h) − f(x₀))/h = <b>${f2(m)}</b> &nbsp;(orange line through the two dots)<br>`+
      (isFinite(d)?`Derivative f′(x₀) = <b>${f2(d)}</b> &nbsp;(green dashed tangent)<br>Shrink |h| toward 0: the orange line rotates into the green one.`:
      `<span class="warn">f′(0) does not exist:</span> from the right the slope is +1, from the left −1 (try h &gt; 0, then h &lt; 0). The limit has no single value.`);
  },[{name:'x²',v:{fn:'sq'}},{name:'sin x',v:{fn:'sin'}},{name:'x³/2 − x',v:{fn:'cub'}},{name:'|x| at the kink',v:{fn:'abs',x0:0,h:1}}],{fn:'sq'},{xmin:-4,xmax:4,ymin:-3,ymax:5});

  // ---- 5.1.1 Taylor polynomials ----
  const TF={
    sc:{name:'sin x + cos x',f:x=>Math.sin(x)+Math.cos(x),d:(x,k)=>Math.sin(x+k*Math.PI/2)+Math.cos(x+k*Math.PI/2)},
    sin:{name:'sin x',f:Math.sin,d:(x,k)=>Math.sin(x+k*Math.PI/2)},
    exp:{name:'eˣ',f:Math.exp,d:(x,k)=>Math.exp(x)},
    x4:{name:'x⁴',f:x=>x**4,d:(x,k)=>k>4?0:x**(4-k)*[1,4,12,24,24][k]},
  };
  const fact=n=>n<2?1:n*fact(n-1);
  widget1D('w-taylor',[
    {id:'n',label:'degree n',min:0,max:12,step:1,value:3},{id:'x0',label:'x₀',min:-3,max:3,step:.1,value:0},
  ],(s,p)=>{
    const F=TF[s.fn], co=[]; for(let k=0;k<=s.n;k++) co.push(F.d(s.x0,k)/fact(k));
    const T=x=>co.reduce((a,c,k)=>a+c*Math.pow(x-s.x0,k),0);
    p.curve(F.f,'#2d2a26',2.5); p.curve(T,ORANGE,2.5); p.dot(s.x0,F.f(s.x0),BLUE,'x₀',5);
    let err=0; for(let i=0;i<=100;i++){ const x=s.x0-1+2*i/100; err=Math.max(err,Math.abs(F.f(x)-T(x))); }
    p.text('f = '+F.name,40,22,'#2d2a26'); p.text('Tₙ (degree '+s.n+')',40,40,ORANGE);
    return `T<sub>${s.n}</sub>(x) = Σ f<sup>(k)</sup>(x₀)/k! · (x − x₀)<sup>k</sup><br>Coefficients f<sup>(k)</sup>(x₀)/k!: ${co.slice(0,6).map(f1).join(', ')}${co.length>6?', …':''}<br>Largest error within ±1 of x₀: <b>${err<1e-6?'≈ 0 (exact)':err.toExponential(1)}</b><br>`+
      `Higher degree ⇒ good over a wider region. Move x₀ and see the match follow it.`;
  },[{name:'sin x + cos x (book Ex. 5.4)',v:{fn:'sc',x0:0,n:5}},{name:'sin x',v:{fn:'sin',x0:0,n:3}},{name:'eˣ',v:{fn:'exp',x0:0,n:3}},{name:'x⁴ at x₀=1 (book Ex. 5.3)',v:{fn:'x4',x0:1,n:2}}],{fn:'sc'},{xmin:-4,xmax:4,ymin:-3,ymax:5});

  // ---- 5.2 gradient & Hessian on a 2D function ----
  const GF={
    bowl:{name:'(x² + 4y²)/10',f:(x,y)=>(x*x+4*y*y)/10,g:(x,y)=>[x/5,4*y/5],H:()=>[[.2,0],[0,.8]],sc:2},
    saddle:{name:'(x² − y²)/6',f:(x,y)=>(x*x-y*y)/6,g:(x,y)=>[x/3,-y/3],H:()=>[[1/3,0],[0,-1/3]],sc:2},
    hills:{name:'2 sin(x/1.5) cos(y/1.5)',f:(x,y)=>2*Math.sin(x/1.5)*Math.cos(y/1.5),
      g:(x,y)=>[(2/1.5)*Math.cos(x/1.5)*Math.cos(y/1.5),-(2/1.5)*Math.sin(x/1.5)*Math.sin(y/1.5)],
      H:(x,y)=>{const a=1/1.5; return [[-2*a*a*Math.sin(a*x)*Math.cos(a*y),-2*a*a*Math.cos(a*x)*Math.sin(a*y)],[-2*a*a*Math.cos(a*x)*Math.sin(a*y),-2*a*a*Math.sin(a*x)*Math.cos(a*y)]];},sc:1},
    book:{name:'x²y + xy³ (book Ex. 5.7)',f:(x,y)=>x*x*y+x*y**3,g:(x,y)=>[2*x*y+y**3,x*x+3*x*y*y],H:(x,y)=>[[2*y,2*x+3*y*y],[2*x+3*y*y,6*x*y]],sc:150},
  };
  widget('w-grad',[
    {id:'x',label:'x',min:-5,max:5,value:3},{id:'y',label:'y',min:-5,max:5,value:2},
  ],(s,p)=>{
    const F=GF[s.fn], n=40, w=12/n, g=p.ctx;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const x=-6+(i+.5)*w, y=-6+(j+.5)*w, t=Math.tanh(F.f(x,y)/F.sc);
      g.fillStyle=t>=0?`rgba(217,72,15,${.06+.5*t})`:`rgba(37,99,184,${.06-.5*t})`; g.fillRect(p.X(-6+i*w),p.Y(-6+(j+1)*w),p.X(w)-p.X(0)+.6,p.Y(0)-p.Y(w)+.6); }
    const gr=F.g(s.x,s.y), gn=Math.hypot(gr[0],gr[1]), H=F.H(s.x,s.y);
    if(gn>1e-9){ const u=[gr[0]/gn,gr[1]/gn];
      p.through([-u[1],u[0]],'rgba(120,110,95,.7)',1.5);
      p.arrow([2*u[0],2*u[1]],RED,'∇f'); p.arrow([-2*u[0],-2*u[1]],'rgba(47,158,68,.9)','−∇f'); }
    p.dot([s.x,s.y],'#2d2a26','',4.5);
    const tr=H[0][0]+H[1][1], dt=H[0][0]*H[1][1]-H[0][1]*H[0][1], r=Math.sqrt(Math.max(0,tr*tr/4-dt)), e1=tr/2+r, e2=tr/2-r;
    const kind=Math.abs(e1)<1e-6&&Math.abs(e2)<1e-6?'flat':(e1>0&&e2>0?'bowl (curves up in every direction)':(e1<0&&e2<0?'dome (curves down everywhere)':'saddle (up in one direction, down in another)'));
    return `f = ${F.name}. At (${s.x.toFixed(1)}, ${s.y.toFixed(1)}): f = ${f2(F.f(s.x,s.y))}<br>Gradient ∇f = [∂f/∂x, ∂f/∂y] = [<b>${f2(gr[0])}</b>, <b>${f2(gr[1])}</b>], &nbsp;‖∇f‖ = ${f2(gn)}<br>`+
      `<span style="color:${RED}"><b>Red</b></span>: steepest ascent, perpendicular to the grey level line. <span style="color:${GREEN}"><b>Green</b></span>: steepest descent.<br>`+
      `Hessian [[${f2(H[0][0])}, ${f2(H[0][1])}],[${f2(H[1][0])}, ${f2(H[1][1])}]], eigenvalues ${f2(e1)}, ${f2(e2)} → locally a <b>${kind}</b>.<br><span class="why">Orange = f &gt; 0, blue = f &lt; 0.</span>`;
  },[{name:'Bowl',v:{fn:'bowl'}},{name:'Saddle',v:{fn:'saddle'}},{name:'Hills',v:{fn:'hills'}},{name:'Book Ex. 5.7',v:{fn:'book',x:1,y:1}}],{fn:'bowl'});

  // ---- 5.3 Jacobian: local linear approximation (polar coordinates) ----
  widget('w-jac',[
    {id:'r',label:'r',min:.5,max:4.5,value:3},{id:'t',label:'θ°',min:0,max:355,step:5,value:40},
    {id:'dr',label:'Δr',min:.1,max:1.5,value:.7},{id:'dt',label:'Δθ°',min:5,max:60,step:5,value:30},
  ],(s,p)=>{
    const P=(r,t)=>[r*Math.cos(t),r*Math.sin(t)], t0=s.t*Math.PI/180, dt=s.dt*Math.PI/180;
    for(let r=1;r<=6;r++){ let prev=null; for(let i=0;i<=120;i++){ const q=P(r,i/120*2*Math.PI); if(prev) p.line(prev,q,'rgba(120,110,95,.25)',1); prev=q; } }
    for(let a=0;a<360;a+=30) p.line([0,0],P(6,a*Math.PI/180),'rgba(120,110,95,.25)',1);
    const patch=[]; const N=14;
    for(let i=0;i<=N;i++) patch.push(P(s.r+s.dr*i/N,t0));
    for(let i=1;i<=N;i++) patch.push(P(s.r+s.dr,t0+dt*i/N));
    for(let i=1;i<=N;i++) patch.push(P(s.r+s.dr*(1-i/N),t0+dt));
    for(let i=1;i<N;i++) patch.push(P(s.r,t0+dt*(1-i/N)));
    p.poly(patch,'rgba(217,72,15,.3)',ORANGE);
    const p0=P(s.r,t0), c1=[Math.cos(t0),Math.sin(t0)], c2=[-s.r*Math.sin(t0),s.r*Math.cos(t0)];
    const p1=[p0[0]+s.dr*c1[0],p0[1]+s.dr*c1[1]], p3=[p0[0]+dt*c2[0],p0[1]+dt*c2[1]], p2=[p1[0]+p3[0]-p0[0],p1[1]+p3[1]-p0[1]];
    p.poly([p0,p1,p2,p3],'rgba(37,99,184,.1)',BLUE);
    const ex=dt*(s.r*s.dr+s.dr*s.dr/2), lin=s.r*s.dr*dt;
    return `Map f(r, θ) = (r cos θ, r sin θ). The small rectangle [r, r+Δr] × [θ, θ+Δθ] in input space lands on the <b style="color:${ORANGE}">orange</b> curved patch.<br>`+
      `Jacobian J = [[cos θ, −r sin θ],[sin θ, r cos θ]] = [[${f2(c1[0])}, ${f2(c2[0])}],[${f2(c1[1])}, ${f2(c2[1])}]], &nbsp;det J = r = ${f2(s.r)}<br>`+
      `<b style="color:${BLUE}">Blue</b> parallelogram = what the linear map J does to the rectangle.<br>True area ${f2(ex)} vs Jacobian estimate |det J|ΔrΔθ = ${f2(lin)} (${(100*Math.abs(ex-lin)/ex).toFixed(1)}% off). Shrink Δr, Δθ and they agree.`;
  });

  // ---- 5.6 backprop on the book's computation graph ----
  (function(){
    const root=document.getElementById('w-backprop'); if(!root) return;
    const svg=root.querySelector('.graph'), out=root.querySelector('.readout'), xs=root.querySelector('.x'), xv=root.querySelector('.xv'), bF=root.querySelector('.bf'), bB=root.querySelector('.bb');
    let mode=1;
    const pos={x:[55,135],a:[175,135],b:[290,48],c:[405,135],d:[520,48],e:[520,222],f:[635,135]};
    const edges=[['x','a','2x'],['a','b','eᵃ'],['a','c','1'],['b','c','1'],['c','d','1/(2√c)'],['c','e','−sin c'],['d','f','1'],['e','f','1']];
    const lab={x:'x',a:'a = x²',b:'b = eᵃ',c:'c = a + b',d:'d = √c',e:'e = cos c',f:'f = d + e'};
    function calc(x){ const a=x*x, b=Math.exp(a), c=a+b, d=Math.sqrt(c), e=Math.cos(c), f=d+e;
      const gf=1, gd=1, ge=1, gc=gd/(2*d)+ge*(-Math.sin(c)), gb=gc, ga=gb*b+gc, gx=ga*2*x; return {v:{x,a,b,c,d,e,f},g:{f:gf,d:gd,e:ge,c:gc,b:gb,a:ga,x:gx}}; }
    function draw(){
      const x=parseFloat(xs.value); xv.textContent=x.toFixed(2); const R=calc(x), W=88, H=58;
      let h=`<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9a9a92"/></marker></defs>`;
      edges.forEach(([u,v,l])=>{ const [x1,y1]=pos[u],[x2,y2]=pos[v], dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy), sx=x1+dx/L*(W/2+2)*(Math.abs(dx)>Math.abs(dy)?1:.6), sy=y1+dy/L*H/2*.9, ex=x2-dx/L*(W/2+4)*(Math.abs(dx)>Math.abs(dy)?1:.6), ey=y2-dy/L*H/2*.95;
        h+=`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#9a9a92" stroke-width="1.6" marker-end="url(#ar)"/><text x="${(sx+ex)/2}" y="${(sy+ey)/2-5}" font-size="11" text-anchor="middle" fill="#7a7268">${l}</text>`; });
      Object.keys(pos).forEach(k=>{ const [cx,cy]=pos[k];
        h+=`<rect x="${cx-W/2}" y="${cy-H/2}" width="${W}" height="${H}" rx="9" fill="#fff" stroke="${k==='f'||k==='x'?'#d9480f':'#cfc6b4'}" stroke-width="1.6"/>`+
           `<text x="${cx}" y="${cy-H/2+16}" text-anchor="middle" font-size="12" font-weight="600" fill="#2d2a26">${lab[k]}</text>`+
           `<text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="13" fill="#2563b8">${R.v[k].toFixed(3)}</text>`+
           (mode?`<text x="${cx}" y="${cy+H/2-6}" text-anchor="middle" font-size="12" fill="#d9480f">∂f/∂${k}=${R.g[k].toFixed(3)}</text>`:''); });
      svg.innerHTML=h;
      const c=R.v.c, closed=2*x*(1/(2*Math.sqrt(c))-Math.sin(c))*(1+Math.exp(x*x)), hh=1e-5, fn=z=>Math.sqrt(z*z+Math.exp(z*z))+Math.cos(z*z+Math.exp(z*z)), num=(fn(x+hh)-fn(x-hh))/(2*hh);
      out.innerHTML=`<span style="color:#2563b8"><b>Blue</b></span>: forward pass (compute f from x, left to right).`+(mode?` <span style="color:#d9480f"><b>Orange</b></span>: backward pass (start with ∂f/∂f = 1, multiply local derivatives right to left, <i>adding</i> where paths join).<br>`+
        `Backprop: df/dx = <b>${R.g.x.toFixed(5)}</b><br>Book's closed form (5.110): ${closed.toFixed(5)}<br>Numerical check (f(x+h)−f(x−h))/2h: ${num.toFixed(5)}`:`<br>Click "Backward pass" to see the gradients flow back.`);
    }
    bF.onclick=()=>{mode=0;draw();}; bB.onclick=()=>{mode=1;draw();}; xs.addEventListener('input',draw); draw();
  })();
});
