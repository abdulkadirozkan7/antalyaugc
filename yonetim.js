const SEK={restoran:'Restoran & Kafe',guzellik:'Kuaför & Güzellik',otel:'Otel & Turizm',magaza:'Butik & Mağaza',saglik:'Klinik & Sağlık',gida:'Gıda & Market',hizmet:'Yerel Hizmetler',eticaret:'E-ticaret',egitim:'Eğitim & Kurs',emlak:'Emlak & İnşaat',oto:'Oto Servis'};
const DEF={ayarlar:{logo:'',telefon:'905422184841',instagram:'',tiktok:'',youtube:'',linkedin:''},fiyatlar:{tek:'',uclu:'',aylik:'',birim:''},videolar:[]};
const $=s=>document.querySelector(s);
if(top!==self)top.location=self.location;
const store=()=>localStorage.getItem('ugc_gh')?localStorage:sessionStorage;
let cfg=JSON.parse(localStorage.getItem('ugc_gh')||sessionStorage.getItem('ugc_gh')||'null'),data=null,page=null;
const B='main';
const toast=(m,bad)=>{const t=$('#toast');t.textContent=m;t.classList.toggle('bad',!!bad);t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),bad?6000:3500)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=s=>{const b=new TextEncoder().encode(s);let x='';for(let i=0;i<b.length;i+=32768)x+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(x)};
const dec=b=>new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const fileB64=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(f)});
const siteUrl=()=>`https://${cfg.o}.github.io/${cfg.r}/`;
const api=async(path,opt={})=>{
  const r=await fetch(`https://api.github.com/repos/${cfg.o}/${cfg.r}${path}`,{...opt,headers:{Authorization:'Bearer '+cfg.t,Accept:'application/vnd.github+json',...(opt.body?{'Content-Type':'application/json'}:{})}});
  if(r.status===404)return null;
  const j=r.status===204?{}:await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.message||('Hata '+r.status));
  return j;
};
const cp=p=>p.split('/').map(encodeURIComponent).join('/');
const getFile=p=>api(`/contents/${cp(p)}?ref=${B}&t=${Date.now()}`);
const putFile=(p,content,message,sha)=>api(`/contents/${cp(p)}`,{method:'PUT',body:JSON.stringify({message,content,branch:B,...(sha?{sha}:{})})});
const delFile=async(p,message)=>{const f=await getFile(p);if(f)await api(`/contents/${cp(p)}`,{method:'DELETE',body:JSON.stringify({message,sha:f.sha,branch:B})})};
const dirty=on=>$('#save').classList.toggle('on',on);

async function loadData(){
  const f=await getFile('data/site.json');
  data=f?JSON.parse(dec(f.content)):structuredClone(DEF);
  data.ayarlar={...DEF.ayarlar,...data.ayarlar};data.fiyatlar={...DEF.fiyatlar,...data.fiyatlar};data.videolar=data.videolar||[];
  document.querySelectorAll('[data-f]').forEach(i=>{const[a,b]=i.dataset.f.split('.');i.value=data[a][b]??''});
  renderList();renderLogo();
}
async function saveData(msg){
  const f=await getFile('data/site.json');
  await putFile('data/site.json',enc(JSON.stringify(data,null,2)+'\n'),msg||'Panel: site verisi güncellendi',f&&f.sha);
  dirty(false);
}
function renderList(){
  const L=$('#vList'),v=data.videolar;
  $('#vCount').textContent=v.length?'('+v.length+')':'';
  if(!v.length){L.innerHTML='<div class="empty">Henüz video yok. Yukarıdan ilkini ekle.</div>';return}
  const opts=s=>Object.entries(SEK).map(([k,n])=>`<option value="${k}"${k===s?' selected':''}>${n}</option>`).join('');
  L.innerHTML=v.map((x,i)=>`<div class="vrow" data-i="${i}">
    <div class="th"${x.poster?` style="background-image:url('${esc(siteUrl()+x.poster)}')"`:''}></div>
    <div class="f">
      <input class="in" data-e="isletme" value="${esc(x.isletme)}" placeholder="İşletme adı">
      <select class="in" data-e="sektor">${opts(x.sektor)}</select>
      <div class="acts">
        <label class="chk"><input type="checkbox" data-e="anasayfa"${x.anasayfa?' checked':''}>Ana sayfa</label>
        <button class="btn btn-line btn-sm btn-icon" data-a="up" type="button" aria-label="Yukarı"${i?'':' disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
        <button class="btn btn-line btn-sm btn-icon" data-a="down" type="button" aria-label="Aşağı"${i<v.length-1?'':' disabled'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>
        <a class="btn btn-line btn-sm" href="${esc(siteUrl()+x.src)}" target="_blank" rel="noopener">İzle</a>
        <button class="btn btn-line btn-sm" data-a="del" type="button" style="color:var(--red)">Sil</button>
      </div>
    </div></div>`).join('');
}
$('#vList').addEventListener('input',e=>{
  const row=e.target.closest('.vrow'),k=e.target.dataset.e;if(!row||!k)return;
  data.videolar[+row.dataset.i][k]=e.target.type==='checkbox'?e.target.checked:e.target.value;dirty(true);
});
$('#vList').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;
  const i=+b.closest('.vrow').dataset.i,v=data.videolar;
  if(b.dataset.a==='up'){[v[i-1],v[i]]=[v[i],v[i-1]];renderList();dirty(true)}
  if(b.dataset.a==='down'){[v[i+1],v[i]]=[v[i],v[i+1]];renderList();dirty(true)}
  if(b.dataset.a==='del'){
    if(!confirm(`"${v[i].isletme||'Bu video'}" silinsin mi? Bu işlem geri alınamaz.`))return;
    b.disabled=true;b.textContent='Siliniyor…';
    try{
      const x=v[i];v.splice(i,1);await saveData('Panel: video silindi');
      await delFile(x.src,'Panel: video dosyası silindi');if(x.poster)await delFile(x.poster,'Panel: kapak silindi');
      renderList();toast('Video silindi');
    }catch(err){toast('Silinemedi: '+err.message,1);await loadData()}
  }
});
$('#vSektor').innerHTML=Object.entries(SEK).map(([k,n])=>`<option value="${k}">${n}</option>`).join('');
$('#vFile').addEventListener('change',e=>{
  const f=e.target.files[0];$('#drop').classList.toggle('has',!!f);
  $('#dropT').textContent=f?f.name:'Video seç';
  $('#dropS').textContent=f?(f.size/1048576).toFixed(1)+' MB':'Telefonundan ya da bilgisayarından';
});
const poster=f=>new Promise(ok=>{
  const v=document.createElement('video'),u=URL.createObjectURL(f);v.muted=true;v.playsInline=true;v.preload='auto';v.src=u;
  const done=x=>{URL.revokeObjectURL(u);ok(x)};
  v.onloadeddata=()=>{v.currentTime=Math.min(1,(v.duration||2)/3)};
  v.onseeked=()=>{const w=540,h=Math.round(w*v.videoHeight/v.videoWidth)||960,c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(v,0,0,w,h);done(c.toDataURL('image/jpeg',.75).split(',')[1])};
  v.onerror=()=>done(null);setTimeout(()=>done(null),15000);
});
const slug=s=>(s||'video').toLowerCase().replace(/[çÇ]/g,'c').replace(/[ğĞ]/g,'g').replace(/[ıİ]/g,'i').replace(/[öÖ]/g,'o').replace(/[şŞ]/g,'s').replace(/[üÜ]/g,'u').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'video';
$('#vUp').addEventListener('click',async()=>{
  const f=$('#vFile').files[0],isl=$('#vIsletme').value.trim();
  if(!f)return toast('Önce bir video seç',1);
  if(!isl)return toast('İşletme adını yaz',1);
  const ext0=(f.name.split('.').pop()||'').toLowerCase();
  if(!['mp4','mov','webm','m4v'].includes(ext0)||!/^video\//.test(f.type||'video/'))return toast('Sadece MP4, MOV veya WEBM video yükleyebilirsin',1);
  if(f.size>95*1048576)return toast('Video 95 MB\'tan büyük. Sıkıştırıp tekrar dene.',1);
  if(f.size>40*1048576&&!confirm('Video '+(f.size/1048576).toFixed(0)+' MB. Büyük videolar sitede geç açılır, 720p ve 40 MB altı önerilir. Yine de yükleyeyim mi?'))return;
  const btn=$('#vUp'),pg=$('#prog'),bar=pg.querySelector('i');btn.disabled=true;pg.classList.remove('hidden');
  const step=(p,t)=>{bar.style.width=p+'%';btn.textContent=t};
  try{
    const base='videos/'+slug(isl)+'-'+Date.now().toString(36),ext=ext0==='m4v'?'mp4':ext0;
    step(10,'Kapak hazırlanıyor…');const pb=await poster(f);
    let posterPath='';if(pb){step(20,'Kapak yükleniyor…');posterPath=base+'.jpg';await putFile(posterPath,pb,'Panel: kapak eklendi')}
    step(35,'Video hazırlanıyor…');const vb=await fileB64(f);
    step(55,'Video yükleniyor… (büyük videolarda 1–2 dk sürebilir)');await putFile(base+'.'+ext,vb,'Panel: video eklendi: '+isl);
    step(85,'Siteye ekleniyor…');
    data.videolar.unshift({isletme:isl,sektor:$('#vSektor').value,anasayfa:$('#vAna').checked,src:base+'.'+ext,poster:posterPath});
    await saveData('Panel: video listesi güncellendi');
    step(100,'Tamam');renderList();
    $('#vFile').value='';$('#vIsletme').value='';$('#vFile').dispatchEvent(new Event('change'));
    toast('Video yüklendi. 1–2 dakika içinde sitede görünür.');
  }catch(err){toast('Yüklenemedi: '+err.message,1)}
  btn.disabled=false;btn.textContent='Yükle ve yayınla';setTimeout(()=>{pg.classList.add('hidden');bar.style.width=0},800);
});
document.querySelectorAll('[data-f]').forEach(i=>i.addEventListener('input',()=>{const[a,b]=i.dataset.f.split('.');data[a][b]=i.value.trim();dirty(true)}));
$('#saveBtn').addEventListener('click',async()=>{
  const b=$('#saveBtn');b.disabled=true;b.textContent='Yayınlanıyor…';
  try{await saveData();toast('Kaydedildi. 1–2 dakika içinde sitede görünür.')}catch(err){toast('Kaydedilemedi: '+err.message,1)}
  b.disabled=false;b.textContent='Yayınla';
});
document.querySelectorAll('#tabs button').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===t));
  document.querySelectorAll('main > section').forEach(s=>s.classList.toggle('hidden',s.dataset.p!==t.dataset.t));
  if(t.dataset.t==='sayfalar'&&!$('#pSel').dataset.ok)loadPages();
}));
async function loadPages(){
  const list=await api(`/contents/?ref=${B}`);
  const names={'index.html':'Ana sayfa'};
  $('#pSel').innerHTML=(list||[]).filter(f=>f.name.endsWith('.html')&&f.name!=='yonetim.html').map(f=>`<option value="${esc(f.path)}">${esc(names[f.name]||f.name.replace('.html','').replace(/-/g,' '))}</option>`).join('');
  $('#pSel').dataset.ok=1;
}
$('#pLoad').addEventListener('click',async()=>{
  const p=$('#pSel').value;if(!p)return;
  try{const f=await getFile(p);page={path:p,sha:f.sha};$('#pCode').value=dec(f.content);$('#pName').textContent=$('#pSel').selectedOptions[0].textContent;$('#pEdit').classList.remove('hidden');$('#fCount').textContent=''}catch(err){toast('Açılamadı: '+err.message,1)}
});
$('#pSel').addEventListener('change',()=>{$('#pView').href=siteUrl()+($('#pSel').value==='index.html'?'':$('#pSel').value.replace('.html',''))});
$('#fFind').addEventListener('input',()=>{const q=$('#fFind').value;const n=q?$('#pCode').value.split(q).length-1:0;$('#fCount').textContent=q?n+' yerde bulundu':''});
$('#fGo').addEventListener('click',()=>{
  const q=$('#fFind').value,r=$('#fRep').value;if(!q)return;
  const n=$('#pCode').value.split(q).length-1;if(!n)return toast('Bu yazı sayfada bulunamadı',1);
  $('#pCode').value=$('#pCode').value.split(q).join(r);$('#fCount').textContent=n+' yer değişti, kaydetmeyi unutma';
});
$('#pSave').addEventListener('click',async()=>{
  if(!page)return;const b=$('#pSave');b.disabled=true;b.textContent='Kaydediliyor…';
  try{const f=await getFile(page.path);await putFile(page.path,enc($('#pCode').value),'Panel: '+page.path+' düzenlendi',f&&f.sha);toast('Sayfa kaydedildi. 1–2 dakika içinde yayında.')}catch(err){toast('Kaydedilemedi: '+err.message,1)}
  b.disabled=false;b.textContent='Sayfayı kaydet ve yayınla';
});
addEventListener('beforeunload',e=>{if($('#save').classList.contains('on')){e.preventDefault();e.returnValue=''}});
async function start(){
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
  $('#siteLink').href=siteUrl();
  try{await loadData()}catch(err){toast('Veri alınamadı: '+err.message,1)}
}
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target;$('#loginErr').textContent='';
  cfg={o:f.o.value.trim(),r:f.r.value.trim(),t:f.t.value.trim()};
  if(!cfg.t){$('#loginErr').textContent='Anahtarı yapıştır';return}
  try{const r=await api('');if(!r)throw new Error('Repo bulunamadı ya da anahtarın bu repoya izni yok');if(r.permissions&&!r.permissions.push)throw new Error('Anahtarın yazma izni yok (Contents: Read and write)');(f.rem.checked?localStorage:sessionStorage).setItem('ugc_gh',JSON.stringify(cfg));f.t.value='';start()}
  catch(err){$('#loginErr').textContent=err.message.includes('Bad credentials')?'Anahtar hatalı ya da süresi dolmuş':err.message}
});
$('#logout').addEventListener('click',()=>{localStorage.removeItem('ugc_gh');sessionStorage.removeItem('ugc_gh');location.replace(location.pathname)});
if(cfg)start();

function renderLogo(){
  const p=data.ayarlar.logo,box=$('#logoPrev');
  $('#logoDel').classList.toggle('hidden',!p);
  if(p){box.textContent='';const i=new Image();i.src=siteUrl()+p+'?v='+Date.now();i.style.cssText='height:30px;width:auto;max-width:180px;object-fit:contain';box.appendChild(i)}
  else box.innerHTML='antalya<b style="color:var(--red)">ugc</b>';
}
$('#logoFile').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  const ext=(f.name.split('.').pop()||'').toLowerCase();
  if(!['png','svg','webp','jpg','jpeg'].includes(ext))return toast('PNG, SVG, WEBP veya JPG seç',1);
  if(f.size>500*1024)return toast('Logo 500 KB\'tan küçük olmalı',1);
  if(ext==='svg'){const t=await f.text();if(/<script|on\w+\s*=|javascript:|<foreignObject/i.test(t))return toast('Bu SVG içinde kod var, güvenlik için kabul edilmedi',1)}
  try{
    toast('Logo yükleniyor…');
    const old=data.ayarlar.logo,path='assets/logo-'+Date.now().toString(36)+'.'+(ext==='jpeg'?'jpg':ext);
    await putFile(path,await fileB64(f),'Panel: logo yüklendi');
    data.ayarlar.logo=path;await saveData('Panel: logo güncellendi');
    if(old)await delFile(old,'Panel: eski logo silindi').catch(()=>{});
    const box=$('#logoPrev');box.textContent='';const i=new Image();i.src=URL.createObjectURL(f);i.style.cssText='height:30px;width:auto;max-width:180px;object-fit:contain';box.appendChild(i);
    $('#logoDel').classList.remove('hidden');
    toast('Logo yüklendi. 1–2 dakika içinde sitede görünür.');
  }catch(err){toast('Logo yüklenemedi: '+err.message,1)}
});
$('#logoDel').addEventListener('click',async()=>{
  if(!confirm('Logo kaldırılsın, yazı logoya dönülsün mü?'))return;
  try{const old=data.ayarlar.logo;data.ayarlar.logo='';await saveData('Panel: logo kaldırıldı');if(old)await delFile(old,'Panel: logo silindi').catch(()=>{});renderLogo();toast('Yazı logoya dönüldü')}catch(err){toast('Olmadı: '+err.message,1)}
});
