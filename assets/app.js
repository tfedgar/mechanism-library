var q=document.getElementById('q'),cat=document.getElementById('cat'),tier=document.getElementById('tier'),
reg=document.getElementById('reg'),cards=[...document.querySelectorAll('.card')],empty=document.getElementById('empty');
function flt(){var t=(q.value||'').toLowerCase().trim(),c=cat.value,ti=tier.value,rg=reg?reg.value:'',any=false;
 cards.forEach(function(el){var ok=(!t||el.dataset.q.indexOf(t)>=0)&&(!c||el.dataset.cat===c)&&(!ti||el.dataset.tier===ti)&&(!rg||el.dataset.fda==='1');
  el.style.display=ok?'':'none';if(ok)any=true;});empty.hidden=any;}
[q,cat,tier,reg].filter(Boolean).forEach(function(el){el.addEventListener('input',flt);});
// stagger reveal
cards.forEach(function(el,i){el.style.animationDelay=Math.min(i*22,600)+'ms';});
