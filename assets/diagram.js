(function(){
  // Encyclopedia reading-depth toggle: plain / standard / full (persisted). A section shows when its
  // data-level <= the chosen depth. Default = full (nothing hidden unless the reader asks).
  var _art=document.querySelector('article'), _db=[].slice.call(document.querySelectorAll('.depth-b'));
  if(_art && _db.length){
    var _hint={plain:'the essentials',standard:'the core picture',expert:'everything — incl. pharmacology & refs'};
    var setD=function(l){ _art.setAttribute('data-read',l); try{localStorage.setItem('gr-depth',l);}catch(e){}
      _db.forEach(function(b){b.classList.toggle('on',b.getAttribute('data-lvl')===l);});
      var h=document.querySelector('.depth-hint'); if(h)h.textContent=_hint[l]||''; };
    var st; try{st=localStorage.getItem('gr-depth');}catch(e){}
    setD(st||'expert');
    _db.forEach(function(b){ b.addEventListener('click',function(){ setD(b.getAttribute('data-lvl')); }); });
  }
  // Glossary: TAP an abbreviation to reveal its full name (native hover already covers desktop; this adds mobile)
  var _abbrs=[].slice.call(document.querySelectorAll('abbr[title]'));
  if(_abbrs.length){
    var _at=document.createElement('div'); _at.className='dg-tip'; _at.style.display='none'; document.body.appendChild(_at);
    _abbrs.forEach(function(a){ a.style.cursor='help';
      a.addEventListener('click',function(ev){ ev.stopPropagation(); _at.textContent=a.getAttribute('title');
        _at.style.display='block'; var r=a.getBoundingClientRect();
        _at.style.left=Math.min(r.left,innerWidth-_at.offsetWidth-10)+'px'; _at.style.top=(r.bottom+window.scrollY-window.scrollY+6)+'px'; }); });
    document.addEventListener('click',function(){_at.style.display='none';});
  }
  // Block 4: evidence lens — "human-evidenced only" hides non-human steps (runs even without a diagram)
  var lensBtn=document.querySelector('.lens-btn');
  if(lensBtn){ var ol=document.querySelector('.steps'); lensBtn.addEventListener('click',function(){
    var on=lensBtn.getAttribute('data-lens')!=='on'; lensBtn.setAttribute('data-lens',on?'on':'off');
    lensBtn.classList.toggle('on',on); if(ol) ol.classList.toggle('lens-human',on);
    lensBtn.textContent=on?'Show all steps':'Strongest evidence only';
  }); }
  // Block 5: self-check reveal
  [].slice.call(document.querySelectorAll('.qa .qq')).forEach(function(b){
    b.addEventListener('click',function(){ var a=b.nextElementSibling, hid=a.hasAttribute('hidden');
      if(hid){a.removeAttribute('hidden');}else{a.setAttribute('hidden','');} b.classList.toggle('open',hid); });
  });
  var svgs=[].slice.call(document.querySelectorAll('.diagram svg'));
  if(!svgs.length) return;
  var CMAP={}; (window.__CONCEPTS__||[]).forEach(function(p){CMAP[p[0]]=p[1];});
  var BASE=(window.__TUTOR__&&window.__TUTOR__.base)||'';
  var TIER={drug:0,molecular:1,cellular:2,effect:3,branch:4,caveat:5};
  var tip=document.createElement('div'); tip.className='dg-tip'; tip.style.display='none';
  document.body.appendChild(tip);
  function showTip(html,ev){ tip.innerHTML=html; tip.style.display='block'; moveTip(ev); }
  function moveTip(ev){ var x=ev.clientX, y=ev.clientY; tip.style.left=Math.min(x+14,innerWidth-tip.offsetWidth-8)+'px'; tip.style.top=(y+16)+'px'; }
  function hideTip(){ tip.style.display='none'; }
  function esc(s){ return (s||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  svgs.forEach(function(svg){
    var nodes=[].slice.call(svg.querySelectorAll('g.node'));
    var edges=[].slice.call(svg.querySelectorAll('g.edge'));
    if(!nodes.length) return;
    var wrap=svg.closest('.diagram'); if(wrap) wrap.classList.add('dg-live');
    var inc={};
    edges.forEach(function(e){ var f=e.getAttribute('data-from'),t=e.getAttribute('data-to');
      (inc[f]=inc[f]||[]).push(e); (inc[t]=inc[t]||[]).push(e); });
    function clear(){ svg.classList.remove('dg-on'); nodes.concat(edges).forEach(function(el){el.classList.remove('dg-lit','dg-dim');}); hideTip(); }
    function focus(n){
      var id=n.getAttribute('data-id'), lit={}; lit[id]=1;
      (inc[id]||[]).forEach(function(e){ e.classList.add('dg-lit'); lit[e.getAttribute('data-from')]=1; lit[e.getAttribute('data-to')]=1; });
      svg.classList.add('dg-on');
      nodes.forEach(function(m){ var on=!!lit[m.getAttribute('data-id')]; m.classList.toggle('dg-lit',on); m.classList.toggle('dg-dim',!on); });
      edges.forEach(function(e){ if(!e.classList.contains('dg-lit')) e.classList.add('dg-dim'); });
    }
    function tierName(n){ return {drug:'trigger',molecular:'molecular',cellular:'cellular',effect:'effect',branch:'branch',caveat:'caveat'}[n.getAttribute('data-tier')]||''; }
    nodes.forEach(function(n){
      n.style.cursor='pointer';
      n.addEventListener('mouseenter',function(ev){ focus(n); var t=tierName(n); showTip('<b>'+esc(n.getAttribute('data-full'))+'</b>'+(t?'<span class="dg-t">'+t+'</span>':''),ev); });
      n.addEventListener('mousemove',moveTip);
      n.addEventListener('mouseleave',clear);
      n.addEventListener('click',function(){ clickNode(n); });
    });
    edges.forEach(function(e){
      e.addEventListener('mouseenter',function(ev){ var f=e.getAttribute('data-full'); if(f) showTip(esc(f),ev); });
      e.addEventListener('mousemove',moveTip);
      e.addEventListener('mouseleave',hideTip);
    });
    function clickNode(n){
      var full=(n.getAttribute('data-full')||''), low=full.toLowerCase(), slug=null, best=0;
      Object.keys(CMAP).forEach(function(term){ if(term.length>3 && low.indexOf(term)>=0 && term.length>best){best=term.length; slug=CMAP[term];} });
      if(slug){ location.href=BASE+'concepts/'+slug+'.html'; return; }
      var toks=full.split(/[^A-Za-z0-9]+/).filter(function(w){return w.length>4;});
      var steps=[].slice.call(document.querySelectorAll('#mechanism .steps li, .cbody p'));
      for(var i=0;i<toks.length;i++){ var k=toks[i].toLowerCase();
        var hit=steps.filter(function(li){return li.textContent.toLowerCase().indexOf(k)>=0;})[0];
        if(hit){ hit.scrollIntoView({behavior:'smooth',block:'center'}); hit.classList.add('dg-flash'); setTimeout(function(){hit.classList.remove('dg-flash');},1400); return; }
      }
    }
    // walk-the-flow player: step through nodes in tier order, lighting each
    if(nodes.length>2){
      var order=nodes.slice().sort(function(a,b){ return (TIER[a.getAttribute('data-tier')]||9)-(TIER[b.getAttribute('data-tier')]||9); });
      var bar=document.createElement('div'); bar.className='dg-ctl';
      bar.innerHTML='<button type="button" class="dg-play">▶ Walk the mechanism</button><span class="dg-step"></span>';
      wrap.parentNode.insertBefore(bar,wrap.nextSibling);
      var i=-1, timer=null, playing=false;
      var btn=bar.querySelector('.dg-play'), lbl=bar.querySelector('.dg-step');
      function step(k){ i=k; if(i<0||i>=order.length){ stop(); clear(); return; } focus(order[i]); lbl.textContent=(i+1)+'/'+order.length+' · '+order[i].getAttribute('data-full'); }
      function stop(){ playing=false; btn.textContent='▶ Walk the mechanism'; if(timer)clearInterval(timer); timer=null; }
      btn.addEventListener('click',function(){
        if(playing){ stop(); return; }
        playing=true; btn.textContent='⏸ Pause'; if(i>=order.length-1)i=-1;
        step(i+1); timer=setInterval(function(){ if(i>=order.length-1){ stop(); } else { step(i+1); } },1600);
      });
    }
  });
})();