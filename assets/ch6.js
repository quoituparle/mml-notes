// Chapter 6 visuals: binomial, joint tables, Bayes icon array, Gaussians, CLT, Beta conjugacy, change of variables.
document.addEventListener('DOMContentLoaded',()=>{
  const f2=x=>(Math.abs(x)<5e-3?0:x).toFixed(2), f3=x=>(Math.abs(x)<5e-4?0:x).toFixed(3), pct=x=>(100*x).toFixed(1)+'%';

  // ---- 6.2 Binomial pmf ----
  widget1D('w-binom',[
    {id:'N',label:'N',min:1,max:40,step:1,value:2},{id:'mu',label:'μ',min:.01,max:.99,step:.01,value:.3},
  ],(s,p)=>{
    const pm=m=>Math.exp(lgamma(s.N+1)-lgamma(m+1)-lgamma(s.N-m+1))*Math.pow(s.mu,m)*Math.pow(1-s.mu,s.N-m);
    const xs=[...Array(s.N+1).keys()], hs=xs.map(pm), top=Math.max(...hs)*1.2;
    Object.assign(p.r,{xmin:-.8,xmax:s.N+.8,ymin:0,ymax:Math.max(.2,top),xs:s.N>14?Math.ceil(s.N/10):1,ys:top>.6?.2:.1}); p.clear();
    p.bars(xs,hs,.8,'rgba(217,72,15,.65)');
    if(s.N<=6) xs.forEach((m,i)=>p.text(hs[i].toFixed(2),p.X(m),p.Y(hs[i])-6,'#2d2a26','center'));
    return `Bin(N=${s.N}, μ=${s.mu.toFixed(2)}): p(m) = C(N,m) μ<sup>m</sup>(1−μ)<sup>N−m</sup> &nbsp; (m = number of "successes")<br>Mean E[m] = Nμ = <b>${f2(s.N*s.mu)}</b>, variance V[m] = Nμ(1−μ) = <b>${f2(s.N*s.mu*(1-s.mu))}</b><br>Heights add to 1: Σ p(m) = ${hs.reduce((a,b)=>a+b,0).toFixed(3)}`;
  },[{name:'Book Ex. 6.1 (2 draws, P($)=0.3)',v:{N:2,mu:.3}},{name:'10 coin flips',v:{N:10,mu:.5}},{name:'Many flips',v:{N:40,mu:.3}}],{},{xmin:-1,xmax:3,ymin:0,ymax:.6});

  // ---- 6.3 joint table: sum rule, product rule ----
  (function(){
    const root=document.getElementById('w-joint'); if(!root) return;
    const box=root.querySelector('.jt'), out=root.querySelector('.readout');
    const P=[[.10,.05,.05],[.05,.20,.10],[.05,.10,.30]];
    const px=P.map(r=>r.reduce((a,b)=>a+b,0)), py=[0,1,2].map(j=>P.reduce((a,r)=>a+r[j],0));
    let sel={t:'cell',i:1,j:1};
    function render(){
      const t=document.createElement('table'); t.className='mat'; t.style.fontSize='15px';
      const hr=document.createElement('tr'); ['','y₁','y₂','y₃','p(x)'].forEach((h,j)=>{ const td=document.createElement('td'); td.textContent=h; td.style.fontWeight='700'; td.style.color='var(--muted)';
        if(j>=1&&j<=3){ td.classList.add('cell'); td.onclick=()=>{sel={t:'col',j:j-1};render();}; if(sel.t==='col'&&sel.j===j-1) td.classList.add('on'); } hr.appendChild(td); }); t.appendChild(hr);
      P.forEach((row,i)=>{ const tr=document.createElement('tr'); const th=document.createElement('td'); th.textContent='x'+['₁','₂','₃'][i]; th.style.fontWeight='700'; th.style.color='var(--muted)'; th.classList.add('cell'); th.onclick=()=>{sel={t:'row',i};render();}; if(sel.t==='row'&&sel.i===i) th.classList.add('on'); tr.appendChild(th);
        row.forEach((v,j)=>{ const td=document.createElement('td'); td.textContent=v.toFixed(2); td.classList.add('cell'); td.onclick=()=>{sel={t:'cell',i,j};render();};
          if((sel.t==='cell'&&sel.i===i&&sel.j===j)) td.classList.add('on'); if(sel.t==='row'&&sel.i===i) td.classList.add('hh'); if(sel.t==='col'&&sel.j===j) td.classList.add('hv'); tr.appendChild(td); });
        const m=document.createElement('td'); m.textContent=px[i].toFixed(2); m.style.fontWeight='700'; m.style.background='var(--code)'; tr.appendChild(m); t.appendChild(tr); });
      const fr=document.createElement('tr'); const l=document.createElement('td'); l.textContent='p(y)'; l.style.fontWeight='700'; l.style.color='var(--muted)'; fr.appendChild(l);
      py.forEach(v=>{ const td=document.createElement('td'); td.textContent=v.toFixed(2); td.style.fontWeight='700'; td.style.background='var(--code)'; fr.appendChild(td); });
      const one=document.createElement('td'); one.textContent='1.00'; fr.appendChild(one); t.appendChild(fr);
      box.replaceChildren(t); box.style.textAlign='center';
      const X=['x₁','x₂','x₃'], Y=['y₁','y₂','y₃']; let h='';
      if(sel.t==='row'){ const i=sel.i; h=`<b>Condition on ${X[i]}</b>: divide the row by its total p(${X[i]}) = ${px[i].toFixed(2)} (sum rule gave this total):<br>`+P[i].map((v,j)=>`p(${Y[j]}|${X[i]}) = ${v.toFixed(2)}/${px[i].toFixed(2)} = <b>${(v/px[i]).toFixed(2)}</b>`).join('<br>')+`<br>These add to 1: it is a proper distribution.`; }
      else if(sel.t==='col'){ const j=sel.j; h=`<b>Condition on ${Y[j]}</b>: divide the column by its total p(${Y[j]}) = ${py[j].toFixed(2)}:<br>`+P.map((r,i)=>`p(${X[i]}|${Y[j]}) = ${r[j].toFixed(2)}/${py[j].toFixed(2)} = <b>${(r[j]/py[j]).toFixed(2)}</b>`).join('<br>'); }
      else { const {i,j}=sel; const pyx=P[i][j]/px[i], pxy=P[i][j]/py[j];
        h=`Joint p(${X[i]}, ${Y[j]}) = <b>${P[i][j].toFixed(2)}</b><br>Product rule: p(${Y[j]}|${X[i]})·p(${X[i]}) = ${pyx.toFixed(2)} × ${px[i].toFixed(2)} = ${(pyx*px[i]).toFixed(2)} ✓<br>`+
          `Bayes: p(${X[i]}|${Y[j]}) = p(${Y[j]}|${X[i]})p(${X[i]}) / p(${Y[j]}) = ${pyx.toFixed(2)}×${px[i].toFixed(2)} / ${py[j].toFixed(2)} = <b>${pxy.toFixed(2)}</b>`; }
      out.innerHTML=h+`<br><span class="why">Shaded totals: <b>sum rule</b> (marginals p(x), p(y) = add the row / column). Click a row label, a column label, or a cell.</span>`;
    }
    render();
  })();

  // ---- 6.3 Bayes: icon array ----
  widgetFree('w-bayes',[
    {id:'prev',label:'prior',min:.1,max:50,step:.1,value:1},{id:'sens',label:'sens.',min:50,max:100,step:1,value:90},{id:'fpr',label:'FPR',min:0,max:30,step:1,value:9},
  ],(s,g,w,h)=>{
    const N=1000, cols=50, rows=20, sick=Math.max(s.prev>0?1:0,Math.round(N*s.prev/100)), TP=Math.round(sick*s.sens/100), FN=sick-TP, FP=Math.round((N-sick)*s.fpr/100), TN=N-sick-TP-FN-FP;
    const col=[]; for(let i=0;i<TP;i++) col.push(0); for(let i=0;i<FN;i++) col.push(1); for(let i=0;i<FP;i++) col.push(2); while(col.length<N) col.push(3);
    const C=['#2563b8','#8a8478','#d9480f','#d8d1c2'], gx=(w-16)/cols, gy=(h-16)/rows, r=Math.min(gx,gy)*.36;
    col.forEach((c,k)=>{ const x=8+(k%cols+.5)*gx, y=8+(Math.floor(k/cols)+.5)*gy; g.fillStyle=C[c]; g.beginPath(); g.arc(x,y,c>=2||c===0?r:r*.8,0,7); g.fill(); });
    const pos=TP+FP, post=pos?TP/pos:0, exact=(s.prev/100*s.sens/100)/((s.prev/100*s.sens/100)+(1-s.prev/100)*s.fpr/100);
    return `Out of 1000 people: <span style="color:#2563b8"><b>${TP}</b> sick &amp; test positive</span>, <span style="color:#8a8478"><b>${FN}</b> sick &amp; test negative</span>, <span style="color:#d9480f"><b>${FP}</b> healthy &amp; test positive</span>, <span style="color:#a39a86"><b>${TN}</b> healthy &amp; negative</span>.<br>`+
      `You tested positive. Among the ${pos} positives (blue + orange), only <b>${pct(post)}</b> are really sick.<br>Bayes' theorem: p(sick | +) = p(+ | sick)·p(sick) / p(+) = <b>${pct(exact)}</b><br><span class="why">The prior (how rare the disease is) matters as much as the test's accuracy.</span>`;
  },[{name:'Rare disease (1%, 90%, 9%)',v:{prev:1,sens:90,fpr:9}},{name:'Common disease (30%)',v:{prev:30,sens:90,fpr:9}},{name:'Very accurate test',v:{prev:1,sens:99,fpr:1}}]);

  // ---- 6.5 univariate Gaussian ----
  widget1D('w-gauss1d',[
    {id:'mu',label:'μ',min:-3,max:3,step:.1,value:0},{id:'sg',label:'σ',min:.3,max:3,step:.1,value:1},
    {id:'a',label:'a',min:-6,max:6,step:.1,value:-1},{id:'b',label:'b',min:-6,max:6,step:.1,value:1},
  ],(s,p)=>{
    const lo=Math.min(s.a,s.b), hi=Math.max(s.a,s.b), f=x=>normPdf(x,s.mu,s.sg);
    p.area(f,lo,hi,'rgba(217,72,15,.3)'); p.curve(f,'#2d2a26',2.5); p.vline(s.mu,'rgba(37,99,184,.7)');
    const A=Phi((hi-s.mu)/s.sg)-Phi((lo-s.mu)/s.sg);
    return `p(x) = 1/√(2πσ²) · exp(−(x−μ)²/(2σ²)) &nbsp; (peak height <b>${f2(f(s.mu))}</b>${f(s.mu)>1?' — above 1! only <i>areas</i> are probabilities':''})<br>P(${lo.toFixed(1)} ≤ X ≤ ${hi.toFixed(1)}) = shaded area = <b>${pct(A)}</b><br><span class="why">Rule of thumb: ±1σ ≈ 68%, ±2σ ≈ 95%, ±3σ ≈ 99.7%.</span>`;
  },[{name:'μ ± σ',v:st=>({a:Math.max(-6,st.mu-st.sg),b:Math.min(6,st.mu+st.sg)})},{name:'μ ± 2σ',v:st=>({a:Math.max(-6,st.mu-2*st.sg),b:Math.min(6,st.mu+2*st.sg)})},{name:'μ ± 3σ',v:st=>({a:Math.max(-6,st.mu-3*st.sg),b:Math.min(6,st.mu+3*st.sg)})},{name:'Narrow (σ=0.3)',v:{sg:.3,a:-.3,b:.3}}],{},{xmin:-6,xmax:6,ymin:0,ymax:1.5,xs:1,ys:.5});

  // ---- 6.5 bivariate Gaussian ----
  (function(){
    const rng=makeRng(42), Z=[]; for(let i=0;i<320;i++) Z.push([rng.n(),rng.n()]);
    widget('w-gauss2d',[
      {id:'s1',label:'σ₁',min:.5,max:2,value:1.5},{id:'s2',label:'σ₂',min:.5,max:2,value:1},{id:'rho',label:'ρ',min:-.95,max:.95,step:.05,value:.7},{id:'c',label:'x₁=',min:-4,max:4,value:1.5},
    ],(s,p)=>{
      const L=[[s.s1,0],[s.rho*s.s2,s.s2*Math.sqrt(1-s.rho*s.rho)]], T=v=>[L[0][0]*v[0]+L[0][1]*v[1],L[1][0]*v[0]+L[1][1]*v[1]];
      for(const k of [3,2,1]){ let prev=null; for(let i=0;i<=120;i++){ const a=i/120*2*Math.PI, q=T([k*Math.cos(a),k*Math.sin(a)]); if(prev) p.line(prev,q,k===1?'rgba(217,72,15,.8)':'rgba(217,72,15,.35)',k===1?2.5:1.5); prev=q; } }
      const X=Z.map(T); X.forEach(q=>p.dot(q,'rgba(37,99,184,.55)','',2.4));
      const slope=s.rho*s.s2/s.s1, m=slope*s.c, sd=s.s2*Math.sqrt(1-s.rho*s.rho);
      p.implicit([1,0],s.c,'rgba(120,110,95,.6)',1.2); p.line([-6,-6*slope],[6,6*slope],'rgba(47,158,68,.6)',1.5);
      p.line([s.c,m-2*sd],[s.c,m+2*sd],GREEN,5); p.dot([s.c,m],RED,'',5);
      const n=X.length, mx=X.reduce((a,q)=>a+q[0],0)/n, my=X.reduce((a,q)=>a+q[1],0)/n;
      let cxx=0,cyy=0,cxy=0; X.forEach(q=>{cxx+=(q[0]-mx)**2; cyy+=(q[1]-my)**2; cxy+=(q[0]-mx)*(q[1]-my);}); cxx/=n; cyy/=n; cxy/=n;
      return `Σ = [[σ₁², ρσ₁σ₂],[ρσ₁σ₂, σ₂²]] = [[${f2(s.s1*s.s1)}, ${f2(s.rho*s.s1*s.s2)}],[${f2(s.rho*s.s1*s.s2)}, ${f2(s.s2*s.s2)}]]<br>`+
        `Cholesky L (Ch. 4): [[${f2(L[0][0])}, 0],[${f2(L[1][0])}, ${f2(L[1][1])}]]. Each dot = L·z with z ~ N(0, I).<br>`+
        `<span style="color:${GREEN}"><b>Conditional</b></span> p(x₂ | x₁=${s.c.toFixed(1)}) = N(${f2(m)}, ${f2(sd*sd)}) (red dot = mean, green bar = ±2 std)<br>`+
        `Empirical (320 samples): covariance [[${f2(cxx)}, ${f2(cxy)}],[${f2(cxy)}, ${f2(cyy)}]], correlation ${f2(cxy/Math.sqrt(cxx*cyy))}`+
        (Math.abs(s.rho)<.01?'<br><span class="ok">ρ = 0: uncorrelated (for Gaussians this means independent).</span>':'');
    },[{name:'Independent (ρ=0)',v:{rho:0}},{name:'Positive correlation',v:{rho:.8}},{name:'Negative correlation',v:{rho:-.8}}]);
  })();

  // ---- 6.5 central limit theorem ----
  widget1D('w-clt',[{id:'n',label:'n',min:1,max:30,step:1,value:1}],(s,p)=>{
    const D={u:{name:'uniform(0,1)',m:.5,v:1/12,draw:r=>r.u()},e:{name:'exponential (skewed)',m:1,v:1,draw:r=>-Math.log(1-r.u())},b:{name:'coin flip (0 or 1)',m:.5,v:.25,draw:r=>r.u()<.5?0:1}}[s.d];
    const rng=makeRng(11), M=3000, nb=32, lo=-4, hi=4, bw=(hi-lo)/nb, cnt=Array(nb).fill(0);
    for(let i=0;i<M;i++){ let t=0; for(let k=0;k<s.n;k++) t+=D.draw(rng); const z=(t-s.n*D.m)/Math.sqrt(s.n*D.v), b=Math.floor((z-lo)/bw); if(b>=0&&b<nb) cnt[b]++; }
    p.bars(cnt.map((_,i)=>lo+bw*(i+.5)),cnt.map(c=>c/(M*bw)),bw,'rgba(37,99,184,.45)');
    p.curve(x=>normPdf(x),ORANGE,2.5);
    return `Add up <b>n = ${s.n}</b> independent draws from ${D.name} (standardised), 3000 times. <span style="color:${BLUE}"><b>Blue</b></span>: histogram of the sums. <span style="color:${ORANGE}"><b>Orange</b></span>: the Gaussian N(0,1).<br>As n grows the histogram becomes a bell curve, whatever the starting shape. That's why Gaussians are everywhere (central limit theorem).`;
  },[{name:'Uniform',v:{d:'u'}},{name:'Skewed (exponential)',v:{d:'e'}},{name:'Coin flips',v:{d:'b'}}],{d:'u'},{xmin:-4,xmax:4,ymin:0,ymax:.8,xs:1,ys:.2});

  // ---- 6.6 Beta-Bernoulli / Beta-Binomial conjugacy ----
  widget1D('w-beta',[
    {id:'a',label:'α',min:.5,max:10,step:.5,value:2},{id:'b',label:'β',min:.5,max:10,step:.5,value:2},
    {id:'h',label:'heads',min:0,max:30,step:1,value:6},{id:'t',label:'tails',min:0,max:30,step:1,value:2},
  ],(s,p)=>{
    const B=(a,b)=>x=>Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+(a-1)*Math.log(x)+(b-1)*Math.log(1-x));
    const a2=s.a+s.h, b2=s.b+s.t, pr=B(s.a,s.b), po=B(a2,b2);
    p.curve(pr,'rgba(120,110,95,.9)',2,.002,.998); p.curve(po,ORANGE,3,.002,.998);
    p.text('prior Beta('+s.a+', '+s.b+')',44,22,'#7a7268'); p.text('posterior Beta('+a2+', '+b2+')',44,40,ORANGE);
    const N=s.h+s.t, mle=N?s.h/N:NaN, mean=a2/(a2+b2), map=(a2>1&&b2>1)?(a2-1)/(a2+b2-2):NaN;
    if(N) p.vline(mle,'rgba(37,99,184,.7)');
    return `Prior belief about the coin: Beta(α=${s.a}, β=${s.b}), mean ${f3(s.a/(s.a+s.b))}<br>Data: ${s.h} heads, ${s.t} tails. Conjugacy: the posterior is again a Beta, with <b>just counts added</b>: Beta(α + h, β + t) = <b>Beta(${a2}, ${b2})</b><br>`+
      `Posterior mean ${f3(mean)}${isNaN(map)?'':`, most likely value (MAP) ${f3(map)}`}${N?`, maximum-likelihood h/N = ${f3(mle)} (blue line)`:''}<br><span class="why">α and β act like "imaginary earlier flips". Lots of data overwhelms the prior.</span>`;
  },[{name:'Flat prior, 6H 2T',v:{a:1,b:1,h:6,t:2}},{name:'Strong fair-coin prior (10,10)',v:{a:10,b:10,h:6,t:2}},{name:'No data yet',v:{h:0,t:0}},{name:'Lots of data (30H, 10T)',v:{a:2,b:2,h:30,t:10}}],{},{xmin:0,xmax:1,ymin:0,ymax:8,xs:.1,ys:2});

  // ---- 6.7 change of variables ----
  (function(){
    const rng=makeRng(3), X=[]; for(let i=0;i<5000;i++) X.push(rng.n());
    widget1D('w-change',[{id:'a',label:'a',min:.5,max:3,step:.1,value:2},{id:'b',label:'b',min:-3,max:3,step:.1,value:1}],(s,p)=>{
      const F={
        lin:{U:x=>s.a*x+s.b,pdf:y=>normPdf(y,s.b,s.a),lo:s.b-4*s.a,hi:s.b+4*s.a,ymax:Math.max(.5,.5/s.a*1.5),name:`Y = ${s.a.toFixed(1)}X + ${s.b.toFixed(1)}`,txt:`p<sub>Y</sub>(y) = p<sub>X</sub>((y−b)/a) · <b>1/a</b>. The Jacobian factor 1/a rescales the density because stretching spreads the probability thinner. Result: Y ~ N(b, a²), Gaussians stay Gaussian under affine maps.`},
        exp:{U:Math.exp,pdf:y=>y>0?normPdf(Math.log(y))/y:0,lo:0,hi:8,ymax:.9,name:'Y = eˣ',txt:`U⁻¹(y) = ln y, so p<sub>Y</sub>(y) = p<sub>X</sub>(ln y) · <b>1/y</b>. This is the log-normal distribution. The factor 1/y squeezes the density where y is large.`},
        cdf:{U:Phi,pdf:y=>(y>0&&y<1)?1:0,lo:0,hi:1,ymax:1.6,name:'Y = Φ(X) (the CDF of X)',txt:`Applying X's own CDF turns <i>any</i> continuous X into Uniform(0,1) (the probability integral transform, book Thm 6.15). Run it backwards (inverse transform) to sample from any distribution you can invert.`},
        sq:{U:x=>x*x,pdf:y=>y>0?Math.exp(-y/2)/Math.sqrt(2*Math.PI*y):0,lo:0,hi:6,ymax:1.2,name:'Y = X²',txt:`Not one-to-one: both +√y and −√y map to y, so p<sub>Y</sub>(y) = 2·p<sub>X</sub>(√y)·<b>1/(2√y)</b>. The spike at 0 appears because many x near 0 all land near y = 0 (chi-squared, 1 degree of freedom).`},
      }[s.fn];
      Object.assign(p.r,{xmin:F.lo,xmax:F.hi,ymin:0,ymax:F.ymax,xs:(F.hi-F.lo)>10?2:(F.hi-F.lo)>2?1:.2,ys:F.ymax>1?.5:.2}); p.clear();
      const nb=50, bw=(F.hi-F.lo)/nb, cnt=Array(nb).fill(0);
      X.forEach(x=>{ const y=F.U(x), b=Math.floor((y-F.lo)/bw); if(b>=0&&b<nb) cnt[b]++; });
      p.bars(cnt.map((_,i)=>F.lo+bw*(i+.5)),cnt.map(c=>c/(X.length*bw)),bw,'rgba(37,99,184,.4)');
      p.curve(F.pdf,ORANGE,3,F.lo+1e-3,F.hi,600);
      return `X ~ N(0, 1). <b>${F.name}</b>. <span style="color:${BLUE}"><b>Blue</b></span>: histogram of Y for 5000 samples. <span style="color:${ORANGE}"><b>Orange</b></span>: density from the change-of-variables formula p<sub>Y</sub>(y) = p<sub>X</sub>(U⁻¹(y)) · |dU⁻¹/dy|.<br>${F.txt}`;
    },[{name:'Y = aX + b',v:{fn:'lin'}},{name:'Y = eˣ',v:{fn:'exp'}},{name:'Y = Φ(X) → uniform',v:{fn:'cdf'}},{name:'Y = X²',v:{fn:'sq'}}],{fn:'lin'},{xmin:-6,xmax:8,ymin:0,ymax:.5});
  })();
});
