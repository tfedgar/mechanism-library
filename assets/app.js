var q=document.getElementById('q'),cat=document.getElementById('cat'),tier=document.getElementById('tier'),
cards=[...document.querySelectorAll('.card')],empty=document.getElementById('empty');
function flt(){var t=(q.value||'').toLowerCase().trim(),c=cat.value,ti=tier.value,any=false;
 cards.forEach(function(el){var ok=(!t||el.dataset.q.indexOf(t)>=0)&&(!c||el.dataset.cat===c)&&(!ti||el.dataset.tier===ti);
  el.style.display=ok?'':'none';if(ok)any=true;});empty.hidden=any;}
[q,cat,tier].forEach(function(el){el.addEventListener('input',flt);});
// stagger reveal
cards.forEach(function(el,i){el.style.animationDelay=Math.min(i*22,600)+'ms';});
