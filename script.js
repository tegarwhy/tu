const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const d=(n,x=3)=>Number(n).toFixed(x).replace('.',',');
const rp=v=>'Rp '+Math.round(v*1e6).toLocaleString('id-ID');
const FMT={laptop:{harga:rp,ram:v=>`${v} GB`,ssd:v=>v>=1024?`${v} GB (${v/1024} TB)`:`${v} GB`,cpu:v=>`${v} Core`,baterai:v=>`${v} Wh`,berat:v=>`${d(v,2)} kg`},
smartphone:{harga:rp,ram:v=>`${v} GB`,storage:v=>`${v} GB`,kamera:v=>`${v} MP`,baterai:v=>`${v} mAh`,layar:v=>`${d(v,2)} inci`}};
const SHORT={harga:'Harga',ram:'RAM',ssd:'SSD',cpu:'Prosesor',baterai:'Baterai',berat:'Berat',storage:'Memori',kamera:'Kamera',layar:'Layar'};
const PAGES=[['rekomendasi','Rekomendasi'],['data','Manajemen Data Alternatif'],['matriks','Matriks & Perhitungan SAW'],['laporan','Laporan Hasil']];
const KEY='dss-data-v3';
const defaults=()=>({laptop:structuredClone(DATASET.laptop.data.alternatif),smartphone:structuredClone(DATASET.smartphone.data.alternatif)});
let db=null;try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!db||!db.laptop)db=defaults();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}};
const S={kat:'laptop',page:'rekomendasi',budget:'',sort:'skor',dir:-1,edit:null,w:{}};
const KR=()=>DATASET[S.kat].data.kriteria;
const fv=(c,v)=>FMT[S.kat][c](v);
const resetW=()=>{S.w={};KR().forEach(k=>S.w[k.kode]=k.bobot)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2200)};
const badge=k=>`<span class="px-1 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${k.tipe==='cost'?'bg-error-container text-on-error-container':'bg-primary-fixed text-on-primary-fixed'}">${k.tipe}</span>`;

function saw(){
 const kr=KR(),b=parseFloat(String(S.budget).replace(',','.'));
 const alt=db[S.kat].filter(a=>!b||a.harga<=b);
 const tot=kr.reduce((s,k)=>s+S.w[k.kode],0),w={},mx={},mn={};
 kr.forEach(k=>{w[k.kode]=tot?S.w[k.kode]/tot:0;const v=alt.map(a=>a[k.kode]);mx[k.kode]=Math.max(...v);mn[k.kode]=Math.min(...v)});
 const rows=alt.map(a=>{const r={},t={};let skor=0;kr.forEach(k=>{const x=a[k.kode];r[k.kode]=k.tipe==='benefit'?x/mx[k.kode]:mn[k.kode]/x;t[k.kode]=w[k.kode]*r[k.kode];skor+=t[k.kode]});return{...a,r,t,skor}});
 rows.sort((a,b)=>b.skor-a.skor).forEach((r,i)=>r.rank=i+1);
 return{rows,w,mx,mn,kr,tot,budget:b};
}
const best=(p,kr,n=1)=>[...kr].sort((a,b)=>p.t[b.kode]-p.t[a.kode]).slice(0,n);
const tbl=(h,body,cls='')=>`<div class="w-full overflow-x-auto"><table class="w-full text-left text-[12px] border-collapse ${cls}"><thead><tr class="bg-surface-container-high/60 text-[11px] font-semibold">${h.map(x=>`<th class="py-2 px-3 whitespace-nowrap">${x}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
const card=(t,c='')=>`<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden ${c}">${t}</div>`;
const td='py-2 px-3 whitespace-nowrap border-t border-surface-container';

/* ---------- Navigasi & bar ---------- */
function renderNav(){
 const h=PAGES.map(([id,l])=>`<button data-go="${id}" class="px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${S.page===id?'bg-primary-container text-on-primary':'text-on-surface-variant hover:bg-surface-container-high'}">${l}</button>`).join('');
 $('#nav').innerHTML=h;$('#navM').innerHTML=h;
 $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
}
function go(p){S.page=p;PAGES.forEach(([id])=>{const e=$('#p-'+id);e.classList.toggle('hidden',id!==p);e.classList.toggle('flex',id===p&&id==='matriks')});renderNav();render();scrollTo({top:0})}
function renderBar(r){
 $('#seg').innerHTML=Object.entries({laptop:['laptop_mac','Laptop'],smartphone:['smartphone','Smartphone']}).map(([k,[i,l]])=>`<button data-kat="${k}" class="px-4 py-1 rounded-lg text-[13px] font-semibold flex items-center gap-1 ${S.kat===k?'bg-primary-container text-on-primary shadow-sm':'text-on-surface-variant hover:text-on-surface'}"><span class="material-symbols-outlined text-[18px]">${i}</span>${l}${S.kat===k?' (Aktif)':''}</button>`).join('');
 $$('[data-kat]').forEach(b=>b.onclick=()=>{S.kat=b.dataset.kat;S.budget='';S.sort='skor';S.dir=-1;S.edit=null;$('#budget').value='';resetW();renderSliders();render()});
 const p=(i,t,c='')=>`<div class="flex items-center gap-1 px-2 py-1 bg-surface-container rounded-lg"><span class="material-symbols-outlined text-[16px] text-surface-tint">${i}</span><span class="text-[13px] font-semibold ${c}">${t}</span></div>`;
 $('#kpi').innerHTML=p('devices',`${r.rows.length} dari ${db[S.kat].length} Alternatif Dievaluasi`)+p('tune',`${r.kr.length} Kriteria Terbobot`)+p('functions',`Total Bobot W = ${d(r.tot?1:0,2)}`,'text-secondary')+(r.budget?p('payments',`Budget ≤ Rp ${d(r.budget,1)} Juta`):'');
}
function renderSliders(){
 $('#sliders').innerHTML=KR().map(k=>`<div class="flex flex-col gap-1"><div class="flex items-center justify-between"><div class="flex items-center gap-1"><span class="text-[13px] font-semibold">${SHORT[k.kode]} <span class="font-normal text-outline">(${k.nama.replace(/.*\(|\)/g,'')})</span></span>${badge(k)}</div><div class="text-[13px] font-semibold"><span id="v-${k.kode}"></span> <span id="w-${k.kode}" class="text-surface-tint"></span></div></div>
 <input type="range" min="0" max="5" value="${S.w[k.kode]}" data-k="${k.kode}" class="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary-container">
 <span class="text-[12px] text-outline">${k.tipe==='cost'?'Makin kecil nilainya, makin tinggi preferensi.':'Makin besar nilainya, makin tinggi preferensi.'}</span></div>`).join('');
 $$('[data-k]').forEach(i=>i.oninput=()=>{S.w[i.dataset.k]=+i.value;render()});
}

/* ---------- Halaman ---------- */
function pgRekom(r){
 $('#sigma').innerHTML=r.tot?`Σ W = 1,00 (Valid)`:`Semua bobot 0`;
 r.kr.forEach(k=>{$('#v-'+k.kode).textContent=`Nilai ${S.w[k.kode]} / 5`;$('#w-'+k.kode).textContent=`(w: ${d(r.w[k.kode],2)})`});
 if(!r.rows.length){$('#top3').innerHTML=card('<p class="p-6">Tidak ada produk di bawah budget itu. Naikkan batas budget.</p>');$('#tabel').innerHTML='';return}
 const col=['bg-amber-500 text-white','bg-slate-300 text-on-surface','bg-amber-700/70 text-white'];
 $('#top3').innerHTML=`<div class="flex items-center gap-2 mb-1"><span class="w-2.5 h-6 bg-primary rounded-full"></span><h2 class="font-head font-bold text-[28px] text-primary">Top 3 Pilihan Terbaik</h2></div><p class="text-on-surface-variant mb-4">Diurutkan berdasarkan skor preferensi SAW sesuai prioritas yang kamu atur.</p>
 <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">${r.rows.slice(0,3).map((p,i)=>{const [b1]=best(p,r.kr);return`<div class="bg-surface-container-lowest rounded-xl p-4 shadow-${i?'sm':'md'} flex flex-col justify-between ${i?'':'bg-gradient-to-b from-amber-50/60 to-white'}"><div>
 <div class="flex items-center justify-between mb-2"><span class="px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${col[i]}"><span class="material-symbols-outlined text-[14px]">${i?'military_tech':'workspace_premium'}</span>Peringkat ${p.rank}</span><span class="px-1 py-0.5 rounded bg-surface-container text-[11px] font-semibold">Unggul: ${SHORT[b1.kode]}</span></div>
 <h3 class="font-head font-bold text-[22px]">${p.nama}</h3><p class="text-[12px] text-on-surface-variant mb-4">${p.ket||''}${p.ket?' · ':''}${d(p.skor*100,1)}% dari skor ideal</p>
 <div class="bg-surface-container-low p-2 rounded-lg mb-4"><div class="text-[11px] text-on-surface-variant font-semibold">Skor Preferensi (V)</div><div class="font-head font-extrabold text-[30px] text-primary leading-none">${d(p.skor)}</div><div class="h-2 bg-surface-container-highest rounded-full mt-2 overflow-hidden"><div class="h-full bg-primary" style="width:${p.skor*100}%"></div></div></div>
 ${r.kr.map((k,j)=>`<div class="flex justify-between py-1 px-1 rounded text-[12px] ${j%2?'':'bg-surface-container-low/60'}"><span class="text-on-surface-variant">${SHORT[k.kode]}:</span><b>${fv(k.kode,p[k.kode])}</b></div>`).join('')}</div>
 <button data-det="${p.id}" class="mt-4 w-full py-1 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1 ${i?'bg-surface-container hover:bg-surface-container-high':'bg-primary text-on-primary hover:bg-primary-container'}"><span class="material-symbols-outlined text-[16px]">visibility</span>Detail Perhitungan</button></div>`}).join('')}</div>`;
 const hd=[['rank','Rank'],['nama','Produk'],...r.kr.map(k=>[k.kode,SHORT[k.kode]]),['skor','Skor SAW (V)']];
 const rows=[...r.rows].sort((a,b)=>{const x=S.sort==='nama'?a.nama.localeCompare(b.nama):(S.sort==='rank'?a.rank-b.rank:a[S.sort]-b[S.sort]);return S.dir*x*(S.sort==='rank'?-1:1)});
 $('#tabel').innerHTML=card(`<div class="p-4 bg-surface-container-low"><h3 class="font-head font-semibold text-[18px] text-primary">Tabel Peringkat Lengkap</h3><span class="text-[12px] text-on-surface-variant">${r.rows.length} alternatif. Klik judul kolom untuk mengurutkan.</span></div>`+
 tbl(hd.map(([k,l])=>`<button data-sort="${k}" class="font-semibold uppercase tracking-wide">${l}${S.sort===k?(S.dir<0?' ▼':' ▲'):''}</button>`).concat('Aksi'),
 rows.map(p=>`<tr class="hover:bg-surface-container-low ${p.rank===1?'bg-amber-50/40':''}"><td class="${td} text-center"><span class="inline-flex w-6 h-6 rounded-full items-center justify-center font-bold ${p.rank<=3?col[p.rank-1]:'bg-surface-container-high'}">${p.rank}</span></td><td class="${td} font-semibold text-primary">${p.nama}${p.ket?`<span class="block font-normal text-on-surface-variant text-[11px]">${p.ket}</span>`:''}</td>${r.kr.map(k=>`<td class="${td}">${fv(k.kode,p[k.kode])}</td>`).join('')}<td class="${td}"><div class="flex items-center gap-1"><b>${d(p.skor)}</b><div class="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden"><div class="h-full bg-surface-tint" style="width:${p.skor*100}%"></div></div></div></td><td class="${td}"><button data-det="${p.id}" class="text-surface-tint font-semibold">Normalisasi ›</button></td></tr>`).join('')));
 $$('[data-sort]').forEach(b=>b.onclick=()=>{S.dir=S.sort===b.dataset.sort?-S.dir:-1;S.sort=b.dataset.sort;render()});
 $$('[data-det]').forEach(b=>b.onclick=()=>detail(+b.dataset.det,r));
}
function detail(id,r){
 const p=r.rows.find(x=>x.id===id);
 $('#mbox').innerHTML=`<div class="flex justify-between items-start"><div><h3 class="font-head font-bold text-[22px]">${p.nama}</h3><p class="text-on-surface-variant">${p.ket?p.ket+' · ':''}Peringkat ${p.rank} dari ${r.rows.length} · Skor V = <b class="text-primary">${d(p.skor)}</b></p>${p.sumber?`<p class="text-[12px] text-outline">Sumber data: ${p.sumber}</p>`:''}</div><button id="mx" class="text-[22px] leading-none px-2">×</button></div>
 <div class="mt-4">${tbl(['Kriteria','Nilai','Tipe','R (normalisasi)','Bobot w','w × R'],r.kr.map(k=>`<tr><td class="${td} font-semibold">${SHORT[k.kode]}</td><td class="${td}">${fv(k.kode,p[k.kode])}</td><td class="${td}">${badge(k)}</td><td class="${td}">${k.tipe==='benefit'?`${p[k.kode]} / ${r.mx[k.kode]}`:`${r.mn[k.kode]} / ${p[k.kode]}`} = <b>${d(p.r[k.kode])}</b></td><td class="${td}">${d(r.w[k.kode],2)}</td><td class="${td}">${d(p.t[k.kode])}</td></tr>`).join('')+`<tr class="bg-surface-container-low font-bold"><td class="${td}" colspan="5">Total skor V</td><td class="${td}">${d(p.skor)}</td></tr>`)}</div>`;
 $('#modal').classList.replace('hidden','flex');$('#mx').onclick=()=>$('#modal').classList.replace('flex','hidden');
}
$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.replace('flex','hidden')};

function pgData(){
 const kr=KR(),e=S.edit!==null?db[S.kat].find(a=>a.id===S.edit):null;
 $('#p-data').innerHTML=`<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"><div class="lg:col-span-4">${card(`<form id="fm" class="p-6 flex flex-col gap-3"><div class="font-head font-semibold text-[18px] text-primary">${e?'Ubah':'Tambah'} Alternatif ${S.kat==='laptop'?'Laptop':'Smartphone'}</div>
 <label class="text-[13px] font-semibold">Nama produk<input name="nama" required value="${e?e.nama:''}" class="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-lg font-medium"></label>
 ${kr.map(k=>`<label class="text-[13px] font-semibold">${k.nama}<input name="${k.kode}" type="number" step="any" min="0" required value="${e?e[k.kode]:''}" class="w-full mt-1 px-3 py-2 bg-surface-container-low rounded-lg font-medium"></label>`).join('')}
 <div class="flex gap-2"><button class="flex-1 py-2 rounded-lg bg-primary text-on-primary font-semibold">${e?'Simpan Perubahan':'Tambah Data'}</button>${e?'<button type="button" id="bc" class="px-4 py-2 rounded-lg bg-surface-container font-semibold">Batal</button>':''}</div>
 <button type="button" id="bd" class="text-[12px] text-error font-semibold text-left">Kembalikan data bawaan</button></form>`)}</div>
 <div class="lg:col-span-8">${card(`<div class="p-4 bg-surface-container-low font-head font-semibold text-[18px] text-primary">Data Alternatif (${db[S.kat].length})</div>`+tbl(['Produk',...kr.map(k=>SHORT[k.kode]),'Aksi'],db[S.kat].map(a=>`<tr class="hover:bg-surface-container-low"><td class="${td} font-semibold">${a.nama}</td>${kr.map(k=>`<td class="${td}">${fv(k.kode,a[k.kode])}</td>`).join('')}<td class="${td}"><button data-ed="${a.id}" class="text-surface-tint font-semibold mr-3">Ubah</button><button data-del="${a.id}" class="text-error font-semibold">Hapus</button></td></tr>`).join('')))}</div></div>`;
 $('#fm').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target),o={nama:f.get('nama').trim()};kr.forEach(k=>o[k.kode]=+f.get(k.kode));
  if(kr.some(k=>k.tipe==='cost'&&o[k.kode]<=0))return toast('Nilai kriteria cost harus lebih dari 0');
  if(e)Object.assign(e,o);else db[S.kat].push({id:Math.max(0,...db[S.kat].map(a=>a.id))+1,...o});
  S.edit=null;save();toast(e?'Data diperbarui':'Data ditambahkan');render()};
 if(e)$('#bc').onclick=()=>{S.edit=null;render()};
 $('#bd').onclick=()=>{if(confirm('Kembalikan semua data ke bawaan?')){db=defaults();save();S.edit=null;render()}};
 $$('[data-ed]').forEach(b=>b.onclick=()=>{S.edit=+b.dataset.ed;render();scrollTo({top:0})});
 $$('[data-del]').forEach(b=>b.onclick=()=>{if(db[S.kat].length<=2)return toast('Minimal 2 alternatif');if(confirm('Hapus data ini?')){db[S.kat]=db[S.kat].filter(a=>a.id!==+b.dataset.del);save();render()}});
}

function pgMatriks(r){
 if(!r.rows.length){$('#p-matriks').innerHTML=card('<p class="p-6">Tidak ada data untuk dihitung.</p>');return}
 const kr=r.kr,rows=[...r.rows].sort((a,b)=>a.id-b.id);
 const sec=(t,s,body)=>card(`<div class="p-4 bg-surface-container-low"><h3 class="font-head font-semibold text-[18px] text-primary">${t}</h3><span class="text-[12px] text-on-surface-variant">${s}</span></div>${body}`);
 const heat=v=>`style="background:rgba(15,76,129,${(v*0.28).toFixed(2)})"`;
 $('#p-matriks').innerHTML=
 sec('1. Bobot Kriteria','Bobot mentah dinormalisasi agar total = 1,00',tbl(['Kriteria','Tipe','Nilai (0-5)','Bobot w','Max','Min'],kr.map(k=>`<tr><td class="${td} font-semibold">${SHORT[k.kode]}</td><td class="${td}">${badge(k)}</td><td class="${td}">${S.w[k.kode]} / 5</td><td class="${td}">${d(r.w[k.kode],2)}</td><td class="${td}">${fv(k.kode,r.mx[k.kode])}</td><td class="${td}">${fv(k.kode,r.mn[k.kode])}</td></tr>`).join('')))+
 sec('2. Matriks Keputusan (X)','Nilai asli setiap alternatif',tbl(['Alternatif',...kr.map(k=>SHORT[k.kode])],rows.map(p=>`<tr><td class="${td} font-semibold">${p.nama}</td>${kr.map(k=>`<td class="${td}">${fv(k.kode,p[k.kode])}</td>`).join('')}</tr>`).join('')))+
 sec('3. Matriks Normalisasi (R)','Benefit: x / max. Cost: min / x. Warna lebih pekat = nilai lebih baik',tbl(['Alternatif',...kr.map(k=>SHORT[k.kode])],rows.map(p=>`<tr><td class="${td} font-semibold">${p.nama}</td>${kr.map(k=>`<td class="${td}" ${heat(p.r[k.kode])}>${d(p.r[k.kode])}</td>`).join('')}</tr>`).join('')))+
 sec('4. Nilai Terbobot dan Skor Akhir (V)','V = Σ (w × R), diurutkan dari peringkat terbaik',tbl(['Rank','Alternatif',...kr.map(k=>`${SHORT[k.kode]} (w=${d(r.w[k.kode],2)})`),'Skor V'],r.rows.map(p=>`<tr class="${p.rank===1?'bg-amber-50/40':''}"><td class="${td} font-bold">${p.rank}</td><td class="${td} font-semibold">${p.nama}</td>${kr.map(k=>`<td class="${td}">${d(p.t[k.kode])}</td>`).join('')}<td class="${td} font-bold text-primary">${d(p.skor)}</td></tr>`).join('')));
}

function pgLaporan(r){
 if(r.rows.length<2){$('#p-laporan').innerHTML=card('<p class="p-6">Perlu minimal 2 alternatif untuk membuat laporan.</p>');return}
 const [a,b]=r.rows,kr=r.kr,pri=[...kr].sort((x,y)=>r.w[y.kode]-r.w[x.kode]).filter(k=>r.w[k.kode]>0).slice(0,2).map(k=>SHORT[k.kode]).join(' dan ');
 const bs=best(a,kr,2).map(k=>`${SHORT[k.kode]} (${fv(k.kode,a[k.kode])})`).join(' serta ');
 $('#p-laporan').innerHTML=card(`<div class="p-6 flex flex-col gap-4"><div class="flex justify-between items-start gap-4 flex-wrap"><div><h2 class="font-head font-bold text-[28px] text-primary">Laporan Hasil Rekomendasi ${S.kat==='laptop'?'Laptop':'Smartphone'}</h2><p class="text-on-surface-variant">Metode SAW · ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · ${r.rows.length} alternatif${r.budget?` · Budget ≤ Rp ${d(r.budget,1)} Juta`:''}</p></div>
 <div class="np flex gap-2"><button id="rp" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">print</span>Cetak / Simpan PDF</button><button id="rc" class="px-4 py-2 rounded-lg bg-surface-container font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">download</span>Unduh CSV</button></div></div>
 <div class="p-4 bg-primary-fixed rounded-xl"><div class="font-semibold text-on-primary-fixed">Rekomendasi utama: ${a.nama} (skor ${d(a.skor)})</div><p class="mt-1 text-on-primary-fixed">Dengan prioritas utama pada ${pri||'seluruh kriteria'}, ${a.nama} menempati peringkat 1. Keunggulannya paling terlihat pada ${bs}. Selisih skor dengan peringkat 2 (${b.nama}) adalah ${d(a.skor-b.skor)}.</p></div>
 <div><div class="font-semibold mb-2">Parameter bobot</div>${tbl(['Kriteria','Tipe','Nilai','Bobot w'],kr.map(k=>`<tr><td class="${td}">${k.nama}</td><td class="${td}">${badge(k)}</td><td class="${td}">${S.w[k.kode]} / 5</td><td class="${td}">${d(r.w[k.kode],2)}</td></tr>`).join(''))}</div>
 <div><div class="font-semibold mb-2">5 peringkat teratas</div>${tbl(['Rank','Produk',...kr.map(k=>SHORT[k.kode]),'Skor V'],r.rows.slice(0,5).map(p=>`<tr><td class="${td} font-bold">${p.rank}</td><td class="${td} font-semibold">${p.nama}</td>${kr.map(k=>`<td class="${td}">${fv(k.kode,p[k.kode])}</td>`).join('')}<td class="${td} font-bold text-primary">${d(p.skor)}</td></tr>`).join(''))}</div></div>`);
 $('#rp').onclick=()=>print();$('#rc').onclick=()=>csv(r);
}
function csv(r){
 const q=v=>`"${String(v).replace(/"/g,'""')}"`,L=[['Rank','Produk',...r.kr.map(k=>k.nama),'Skor SAW'].map(q).join(',')];
 r.rows.forEach(p=>L.push([p.rank,p.nama,...r.kr.map(k=>fv(k.kode,p[k.kode])),d(p.skor)].map(q).join(',')));
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'}));a.download=`hasil-saw-${S.kat}.csv`;a.click();toast('File CSV diunduh');
}

function render(){
 const r=saw();renderBar(r);
 ({rekomendasi:pgRekom,data:pgData,matriks:pgMatriks,laporan:pgLaporan}[S.page])(r);
}
$('#budget').oninput=e=>{S.budget=e.target.value;render()};
$('#btnHitung').onclick=()=>{render();$('#top3').scrollIntoView({behavior:'smooth'});toast('Perhitungan SAW diperbarui')};
$('#btnReset').onclick=()=>{S.budget='';$('#budget').value='';S.sort='skor';S.dir=-1;resetW();renderSliders();render();toast('Bobot dikembalikan ke default')};
$('#btnExport').onclick=()=>csv(saw());
$('#btnPdf').onclick=()=>{go('laporan');setTimeout(()=>print(),300)};
resetW();renderSliders();go('rekomendasi');
