(function(){
var CFG=window.__TUTOR__||{compound:null,slug:null,base:""};
var S={open:false,healthOk:null,level:"intermediate",mode:"explain",depth:"balanced",busy:false,history:[]};
function esc(s){return (s||"").replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
function escA(s){return esc(s).replace(/"/g,"&quot;");}
// link the FIRST mention of each known mechanism to its concept page (display-only; runs on escaped text)
var _CMAP=window.__CONCEPTS__||[],_CSLUG={},_CRE=null;
(function(){var terms=[];for(var i=0;i<_CMAP.length;i++){var t=_CMAP[i][0];_CSLUG[t.toLowerCase()]=_CMAP[i][1];terms.push(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));}if(terms.length){try{_CRE=new RegExp("\\b("+terms.join("|")+")\\b","gi");}catch(e){_CRE=null;}}})();
function linkifyConcepts(t){if(!_CRE)return t;var seen={};return t.replace(_CRE,function(m,term){var k=term.toLowerCase(),slug=_CSLUG[k];if(!slug||seen[k])return term;seen[k]=1;return '<a class="clink" href="'+(CFG.base||"")+'concepts/'+slug+'.html" target="_blank" rel="noopener">'+term+'</a>';});}
function fmt(t){
  t=linkifyConcepts(esc(t))
   .replace(/\[(Established)\]/gi,'<span class="ct est">Established</span>')
   .replace(/\[(Evidence)\]/gi,'<span class="ct ev">Evidence</span>')
   .replace(/\[(Contested)\]/gi,'<span class="ct con">Contested</span>')
   .replace(/\[(Speculation|Speculative)\]/gi,'<span class="ct spec">Speculation</span>')
   .replace(/\[(\d+)\]/g,'<span class="cref">[$1]</span>')
   .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  // Display-only structuring of the model's NATURAL output (numbered steps, bullets, lead sentence).
  // Pure function of the accumulated text => streaming-idempotent; keys on nothing the prompt mandates.
  var blocks=t.split(/\n\n+/), out="", lead=true;
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i], lines=b.split(/\n/), ne=lines.filter(function(l){return l.trim();});
    if(ne.length && ne.every(function(l){return /^\s*[-*•]\s+/.test(l);})){        // bullet list
      out+='<ul class="tul">'+ne.map(function(l){return '<li>'+l.replace(/^\s*[-*•]\s+/,'')+'</li>';}).join('')+'</ul>';lead=false;continue;
    }
    if(ne.length>1 && ne.every(function(l){return /^\s*\d{1,2}\.\s+/.test(l);})){        // numbered list
      out+='<ol class="tol">'+ne.map(function(l){return '<li>'+l.replace(/^\s*\d{1,2}\.\s+/,'')+'</li>';}).join('')+'</ol>';lead=false;continue;
    }
    var m=b.match(/^\s*(\d{1,2})\.\s+([\s\S]*)$/);                                       // numbered step w/ body
    if(m){
      var body=m[2].split(/\n/), title=body.shift();
      out+='<div class="tstep"><p class="tstep-h"><span class="tstep-n">'+m[1]+'</span>'+title+'</p>'+(body.join("").trim()?'<p>'+body.join("<br>")+'</p>':'')+'</div>';lead=false;continue;
    }
    var p=b.replace(/\n/g,"<br>");
    out+=lead?('<p class="lead">'+p+'</p>'):('<p>'+p+'</p>');lead=false;
  }
  return out;
}
var fab=document.createElement("button");fab.id="tf";
fab.innerHTML='<span class="spark">&#10022;</span> Ask the tutor';
document.body.appendChild(fab);
var panel=document.createElement("div");panel.id="tp";
panel.innerHTML=
 '<div class="tp-head"><h3>Offline tutor</h3><span class="scope">'+(CFG.compound?escA(CFG.compound):"library")+'</span><button class="tp-x" title="close">&times;</button></div>'+
 '<div class="tp-opts">'+
 '<select class="lv"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option></select>'+
 '<select class="md"><option value="explain" selected>Explain</option><option value="socratic">Socratic</option><option value="quiz">Quiz me</option></select>'+
 '<select class="dp" title="answer depth"><option value="simple">Simple</option><option value="balanced" selected>Balanced</option><option value="deep">Deep dive</option></select>'+
 '</div><div class="tp-body" id="tpb"></div>'+
 '<div class="tp-foot"><div class="tp-in"><textarea rows="1" placeholder="Ask anything'+(CFG.compound?(" about "+escA(CFG.compound)):"")+'..."></textarea><button class="tp-send">Ask</button></div>'+
 '<div class="tp-dis">local Qwen &middot; grounded in your corpus &middot; certainty-labelled &middot; not medical advice</div></div>';
document.body.appendChild(panel);
var body=panel.querySelector("#tpb"),ta=panel.querySelector("textarea"),send=panel.querySelector(".tp-send");
panel.querySelector(".lv").onchange=function(e){S.level=e.target.value;};
panel.querySelector(".md").onchange=function(e){S.mode=e.target.value;};
panel.querySelector(".dp").onchange=function(e){S.depth=e.target.value;};
panel.querySelector(".tp-x").onclick=toggle;fab.onclick=toggle;
function toggle(){S.open=!S.open;panel.classList.toggle("open",S.open);fab.style.display=S.open?"none":"";if(S.open){if(S.healthOk===null)health();ta.focus();}}
function hint(h){var d=document.createElement("div");d.className="tp-hint";d.innerHTML=h;body.appendChild(d);}
function clearHints(){var hs=body.querySelectorAll(".tp-hint");for(var i=0;i<hs.length;i++)hs[i].remove();}
function health(){
  fetch("/api/health").then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(h){
    S.healthOk=h.qwen;
    if(!h.qwen){hint('The tutor server is up, but the <b>local Qwen model</b> is not answering on :8080. Start it (Agent Console / run-llama-server.sh), then reopen.');}
    else{var w=CFG.compound?(" about <b>"+escA(CFG.compound)+"</b>"):" about any compound in the library";hint("Ask me anything"+w+". I answer only from your local corpus, label how certain each claim is, and remember what I teach you &mdash; all offline.");}
  }).catch(function(){
    S.healthOk=false;send.disabled=true;
    if(location.protocol==="file:"){
      hint('This page is open as a plain <b>file</b>, so the tutor cannot run. To chat offline, double-click <b>Open Mechanism Library (AI Tutor).command</b> &mdash; it starts the local server and the tutor.');
    }else{
      hint('The <b>library</b> is fully browsable here. The <b>AI tutor</b> needs its model backend, which isn\'t attached to this hosted version yet &mdash; hosted AI is coming soon. For the live tutor now, use the desktop version.');
    }
  });
}
function addMsg(cls,html){var d=document.createElement("div");d.className="tmsg "+cls;d.innerHTML=html;body.appendChild(d);body.scrollTop=body.scrollHeight;return d;}
function meta(bot,sources,concepts,follows,grounding){
  if(grounding&&grounding.label){var gp=[];for(var k in grounding.by_type){gp.push(grounding.by_type[k]+" "+k);}
    var gc=grounding.label==="strong"?"gs-strong":(grounding.label==="moderate"?"gs-mod":"gs-thin");
    bot.insertAdjacentHTML("afterbegin",'<div class="tgnd '+gc+'">grounding: '+esc(grounding.label)+(gp.length?(" &middot; "+esc(gp.join(", "))):"")+"</div>");}
  if(sources&&sources.length){var s='<div class="tsrc">';for(var i=0;i<sources.length;i++){var c=sources[i];var lbl="["+c.n+"] "+esc(c.type);s+=c.url?('<a href="'+escA(c.url)+'" target="_blank" rel="noopener">'+lbl+"</a>"):("<span>"+lbl+"</span>");}s+="</div>";bot.insertAdjacentHTML("beforeend",s);}
  if(concepts&&concepts.length){var cc=[];for(var j=0;j<concepts.length;j++)cc.push(esc(concepts[j]));bot.insertAdjacentHTML("beforeend",'<div class="tnew">&#10022; learned: '+cc.join(" &middot; ")+"</div>");}
  if(follows&&follows.length){var f='<div class="tfu"><div class="tfu-h">Keep going &#8595;</div>';for(var m=0;m<follows.length;m++){f+='<button class="tfu-b" type="button">'+esc(follows[m])+"</button>";}f+="</div>";bot.insertAdjacentHTML("beforeend",f);
    var bs=bot.querySelectorAll(".tfu-b");for(var b=0;b<bs.length;b++){bs[b].onclick=function(){if(S.busy)return;ta.value=this.textContent;ask();};}}
}
function ask(){
  var q=ta.value.trim();if(!q||S.busy||S.healthOk===false)return;
  clearHints();addMsg("user",esc(q).replace(/\n/g,"<br>"));S.history.push({role:"user",content:q});
  ta.value="";ta.style.height="auto";S.busy=true;send.disabled=true;
  var bot=addMsg("bot",'<span class="tdot"></span>');var full="";var grounding=null;
  fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({question:q,level:S.level,mode:S.mode,depth:S.depth,compound:CFG.compound,slug:CFG.slug,history:S.history.slice(-4)})})
  .then(function(res){
    var reader=res.body.getReader(),dec=new TextDecoder(),buf="";
    function pump(){return reader.read().then(function(r){
      if(r.done)return;
      buf+=dec.decode(r.value,{stream:true});var idx;
      while((idx=buf.indexOf("\n\n"))>=0){
        var chunk=buf.slice(0,idx);buf=buf.slice(idx+2);
        var lines=chunk.split("\n"),line="";for(var i=0;i<lines.length;i++){if(lines[i].indexOf("data:")===0){line=lines[i];break;}}
        if(!line)continue;var o;try{o=JSON.parse(line.slice(5).trim());}catch(e){continue;}
        if(o.delta){full+=o.delta;bot.innerHTML=fmt(full);body.scrollTop=body.scrollHeight;}
        else if(o.error){bot.innerHTML='<p style="color:var(--pre)">'+esc(o.error)+"</p>";}
        else if(o.done){if(o.answer)full=o.answer;bot.innerHTML=fmt(full);meta(bot,o.sources,o.new_concepts,o.follow_ups,grounding||o.grounding);S.history.push({role:"assistant",content:full});}
        else if(o.grounding){grounding=o.grounding;}
      }
      return pump();
    });}
    return pump();
  }).catch(function(e){bot.innerHTML='<p style="color:var(--pre)">Could not reach the tutor: '+esc(String(e))+"</p>";})
  .then(function(){S.busy=false;send.disabled=false;body.scrollTop=body.scrollHeight;});
}
send.onclick=ask;
ta.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask();}});
ta.addEventListener("input",function(){ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,120)+"px";});
})();
