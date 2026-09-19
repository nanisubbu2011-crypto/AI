const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state=JSON.parse(localStorage.getItem('ct_state')||'{"attempts":0,"correct":0,"topics":["Calculus","Algebra","Physics"]}');
const save=()=>localStorage.setItem('ct_state',JSON.stringify(state));
let mode='Tutor';

// If CalcTutor is hosted on Vercel, leave this as-is and the frontend will use /api/chat.
// If the frontend is hosted on GitHub Pages, set window.CALCTUTOR_API_URL in index.html
// to your deployed backend URL, for example https://your-project.vercel.app/api/chat
const API_URL=window.CALCTUTOR_API_URL || (location.hostname.endsWith('vercel.app') ? '/api/chat' : 'YOUR_BACKEND_URL/api/chat');

function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(t){let x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}
function page(p){$$('.page').forEach(x=>x.classList.toggle('active',x.id===p));$$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===p));scrollTo(0,0)}
$$('[data-page]').forEach(x=>x.onclick=()=>page(x.dataset.page));
$$('.mode').forEach(x=>x.onclick=()=>{$$('.mode').forEach(y=>y.classList.remove('active'));x.classList.add('active');mode=x.dataset.mode;$('#modeText').textContent='Mode: '+mode});
function msg(type,t){let d=document.createElement('div');d.className='msg';d.innerHTML=type==='bot'?`<i>C</i><div><b>CalcTutor</b><p>${esc(t).replace(/\n/g,'<br>')}</p></div>`:`<div><p>${esc(t)}</p></div>`;$('#chat').appendChild(d);$('#chat').scrollTop=$('#chat').scrollHeight}
function setBusy(b){$('#send').disabled=b;$('#send').textContent=b?'…':'➤';$('#prompt').disabled=b}
async function askAI(text,imageDataUrl=null){
  if(API_URL.includes('YOUR_BACKEND_URL')) throw new Error('Connect your backend first. Deploy the included Vercel backend, then set CALCTUTOR_API_URL for a GitHub Pages frontend.');
  const body={message:text,mode};
  if(imageDataUrl) body.image=imageDataUrl;
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||`Backend error (${r.status})`);
  return data.answer||'The AI returned no answer.';
}
async function send(){
  let q=$('#prompt').value.trim();if(!q)return;
  msg('user',q);$('#prompt').value='';setBusy(true);
  try{msg('bot',await askAI(q));}
  catch(e){msg('bot','⚠️ '+e.message);}
  finally{setBusy(false)}
}
$('#send').onclick=send;
$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
$$('.chip').forEach(x=>x.onclick=()=>{$('#prompt').value=x.textContent;send()});
$('#add').onclick=()=>page('scanner');
$('#choose').onclick=()=>$('#image').click();
$('#image').onchange=()=>{let f=$('#image').files[0];if(!f)return;if(f.size>8*1024*1024){toast('Image must be under 8 MB');$('#image').value='';return}$('#preview').src=URL.createObjectURL(f);$('#preview').classList.remove('hidden');$('#drop').classList.add('hidden');$('#scanBtns').classList.remove('hidden')};
$('#remove').onclick=()=>{$('#image').value='';$('#preview').classList.add('hidden');$('#drop').classList.remove('hidden');$('#scanBtns').classList.add('hidden');$('#scanResult').classList.add('hidden')};
$('#analyze').onclick=async()=>{let f=$('#image').files[0];if(!f)return;let reader=new FileReader();reader.onload=async()=>{setScanBusy(true);$('#scanResult').classList.remove('hidden');$('#scanResult').innerHTML='<b>Analyzing…</b><br>CalcTutor is reading the image and solving it.';try{let a=await askAI('Solve the uploaded question. First transcribe the problem if readable, then give a rigorous step-by-step solution. State the final answer clearly. If the image is unclear, say exactly what is unreadable.',reader.result);$('#scanResult').innerHTML='<b>AI Solution</b><p>'+esc(a).replace(/\n/g,'<br>')+'</p>';msg('bot',a)}catch(e){$('#scanResult').innerHTML='<b>⚠️ '+esc(e.message)+'</b>'}finally{setScanBusy(false)}};reader.readAsDataURL(f)};
function setScanBusy(b){$('#analyze').disabled=b;$('#analyze').textContent=b?'Analyzing…':'Analyze';}

const bank=[['If f(x)=x²+2x, find f′(3).',['5','6','8','10'],2],['Evaluate ∫₀¹ 2x dx.',['0','1/2','1','2'],2],['If a+b=10 and ab=21, find a²+b².',['42','58','79','100'],1],['In SHM, acceleration is proportional to…',['velocity','displacement','time','frequency'],1],['If x+y=5 and xy=6, find x³+y³.',['17','35','53','65'],2]];
function practice(){let arr=[...bank].sort(()=>Math.random()-.5);$('#questions').innerHTML=arr.map((q,i)=>`<div class="question"><h3>${i+1}. ${q[0]}</h3>${q[1].map((o,j)=>`<button class="option" data-i="${i}" data-a="${j}">${esc(o)}</button>`).join('')}</div>`).join('');$$('.option').forEach(b=>b.onclick=()=>{let c=b.parentElement;if(c.dataset.done)return;c.dataset.done=1;let q=arr[+b.dataset.i];if(+b.dataset.a===q[2]){b.classList.add('correct');state.correct++;toast('Correct ✓')}else{b.classList.add('wrong');c.querySelectorAll('.option')[q[2]].classList.add('correct');toast('Answer checked')}state.attempts++;save();progress()})}
$('#newSet').onclick=practice;practice();
function library(){$('#topics').innerHTML=state.topics.map((t,i)=>`<div class="topicitem"><span>📘 ${esc(t)}</span><button data-i="${i}">Delete</button></div>`).join('')||'<p>No saved topics.</p>';$$('.topicitem button').forEach(b=>b.onclick=()=>{state.topics.splice(+b.dataset.i,1);save();library()})}
$('#saveTopic').onclick=()=>{let v=$('#topic').value.trim();if(!v)return;state.topics.unshift(v);$('#topic').value='';save();library();toast('Topic saved')};library();
function progress(){let a=state.attempts,c=state.correct,p=a?Math.round(c/a*100):0;$('#attempts').textContent=a;$('#correct').textContent=c;$('#accuracyNum').textContent=p+'%';$('#bar').style.width=p+'%';$('#accuracy').textContent=a?`${p}% accuracy across ${a} attempted questions.`:'Start solving to build your stats.'}
progress();
$('#reset').onclick=()=>{if(confirm('Reset local progress?')){state.attempts=0;state.correct=0;state.topics=[];save();library();progress();toast('Reset complete')}};
$('#theme').onclick=()=>document.body.classList.toggle('light');
