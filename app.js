(()=>{'use strict';
const DBNAME='atlas-notes-v1',VERSION=1,APPVER='0.2';let db=null,editingId=null,draftPhotos=[],previewURLs=[],busy=false,prepared=null,toastTimer=null;
const $=id=>document.getElementById(id),uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),html=(s)=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DBNAME,VERSION);request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains('notes'))database.createObjectStore('notes',{keyPath:'id'});if(!database.objectStoreNames.contains('photos'))database.createObjectStore('photos',{keyPath:'id'});if(!database.objectStoreNames.contains('batches'))database.createObjectStore('batches',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function fromStore(name,method,args){return new Promise((resolve,reject)=>{const tx=db.transaction(name,method==='put'||method==='delete'?'readwrite':'readonly');const req=tx.objectStore(name)[method](...args);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.onabort=()=>reject(tx.error);});}
const get=(name,key)=>fromStore(name,'get',[key]),all=name=>fromStore(name,'getAll',[]),put=(name,obj)=>fromStore(name,'put',[obj]),del=(name,key)=>fromStore(name,'delete',[key]);
async function deleteNote(id){const note=await get('notes',id);if(!note)return;return new Promise((resolve,reject)=>{const tx=db.transaction(['notes','photos'],'readwrite');for(const pid of note.photoIds||[])tx.objectStore('photos').delete(pid);tx.objectStore('notes').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function confirmAction(title,message,confirmLabel='Continue'){return new Promise(resolve=>{const d=$('confirmDialog');$('dialogTitle').textContent=title;$('dialogMessage').textContent=message;$('dialogConfirm').textContent=confirmLabel;const listener=()=>{d.removeEventListener('close',listener);resolve(d.returnValue==='confirm');};d.addEventListener('close',listener);d.showModal();});}
function setPage(page){document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===page+'Page'));document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));const titles={capture:['Capture now.','Organize later.','Notes and photos stay on this device until you prepare a transfer to your Windows app.'],outbox:['Your notes.','Ready to transfer.','Review what you have captured. Nothing is uploaded or synced automatically.'],transfer:['Your notes.','Head to Windows.','Export the saved notes as a package you can move using a USB file-sharing workflow.']};const [a,b,c]=titles[page];$('pageTitle').innerHTML=html(a)+'<br/><em>'+html(b)+'</em>';$('pageDescription').textContent=c;window.scrollTo({top:0,behavior:'instant'});refresh();}
function formatDate(iso){try{return new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch{return iso}}
function bytes(n){return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.ceil(n/1024)+' KB'}
async function refresh(){if(!db)return;const ns=(await all('notes')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$('tabCount').textContent=ns.length;$('outboxCount').textContent=ns.length;$('transferNoteCount').textContent=ns.length;$('transferPhotoCount').textContent=ns.reduce((n,x)=>n+(x.photoIds||[]).length,0);$('outboxSubtitle').textContent=ns.length+' note'+(ns.length===1?'':'s')+' waiting for transfer';$('prepareBtn').disabled=!ns.length||busy;renderOutbox(ns);await updateClearableSummary(ns);}
function renderOutbox(notes){const el=$('outboxList');el.textContent='';if(!notes.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='No saved notes yet. Capture your first observation to start.';el.appendChild(empty);return;}for(const n of notes){const card=document.createElement('article');card.className='saved-note';const top=document.createElement('div');top.className='saved-note-head';const title=document.createElement('strong');title.textContent=n.title||'Untitled note';const pill=document.createElement('span');pill.className='chip';pill.textContent='Unassigned';top.append(title,pill);card.appendChild(top);const meta=document.createElement('div');meta.className='note-meta';meta.textContent=formatDate(n.createdAt)+'  ·  '+(n.photoIds||[]).length+' photo(s)';card.append(meta);if(n.body){const p=document.createElement('p');p.textContent=n.body.length>200?n.body.slice(0,200)+'…':n.body;card.appendChild(p);}const actions=document.createElement('div');actions.className='saved-actions';const edit=document.createElement('button');edit.className='mini-btn';edit.textContent='Edit';edit.onclick=()=>editNote(n.id);const remove=document.createElement('button');remove.className='mini-btn danger';remove.textContent='Delete';remove.onclick=async()=>{if(await confirmAction('Delete this note?','This removes the note and its photos from your iPhone. It cannot be undone.')){await deleteNote(n.id);await refresh();notify('Note removed');}};actions.append(edit,remove);card.appendChild(actions);el.appendChild(card);}}
function revokePreview(){for(const u of previewURLs)URL.revokeObjectURL(u);previewURLs=[];}
function renderPhotos(){revokePreview();const el=$('photoPreview');el.textContent='';$('draftPhotoCount').textContent=draftPhotos.length;for(const photo of draftPhotos){const wrap=document.createElement('div');wrap.className='photo-tile';const img=document.createElement('img');img.alt=photo.name||'Photo';const url=URL.createObjectURL(photo.blob);previewURLs.push(url);img.src=url;const remove=document.createElement('button');remove.type='button';remove.ariaLabel='Remove photo';remove.textContent='×';remove.onclick=()=>{draftPhotos=draftPhotos.filter(p=>p.id!==photo.id);renderPhotos();};wrap.append(img,remove);el.appendChild(wrap);}}
async function addPhotos(files){if(!files.length)return;for(const f of files){if(!f.type.startsWith('image/')&&!/\.(heic|heif|jpg|jpeg|png|webp)$/i.test(f.name)){notify('Only image files are supported');continue;}if(f.size>30*1024*1024){notify('Photo exceeds the 30 MB per-photo limit');continue;}if(draftPhotos.length>=20){notify('Maximum 20 photos per note');break;}draftPhotos.push({id:uuid(),name:f.name||'photo',type:f.type||'application/octet-stream',blob:f});}renderPhotos();$('takePhoto').value='';$('choosePhotos').value='';}
function clearEditor(){editingId=null;$('noteTitle').value='';$('noteBody').value='';draftPhotos=[];$('formHeading').textContent='New note';$('saveNoteBtn').innerHTML='Save note <span aria-hidden="true">→</span>';$('cancelEdit').classList.add('hidden');$('editingHint').textContent='You can assign this to a project after importing it on Windows.';renderPhotos();}
async function editNote(id){const note=await get('notes',id);if(!note)return;editingId=id;$('noteTitle').value=note.title;$('noteBody').value=note.body;draftPhotos=[];for(const pid of note.photoIds||[]){const p=await get('photos',pid);if(p)draftPhotos.push(p);}renderPhotos();$('formHeading').textContent='Edit note';$('saveNoteBtn').textContent='Save changes';$('cancelEdit').classList.remove('hidden');$('editingHint').textContent='If you edit this note after exporting, it will not be cleared with the previous batch.';setPage('capture');}
async function saveNote(e){e.preventDefault();if(busy)return;const title=$('noteTitle').value.trim(),body=$('noteBody').value.trim();if(!body&&!title&&!draftPhotos.length){notify('Add some text or a photo before saving');return;}busy=true;$('saveNoteBtn').disabled=true;try{const old=editingId?await get('notes',editingId):null;const id=editingId||uuid(),note={id,title:title|| (body?body.slice(0,48):'Photo note'),body,createdAt:old?.createdAt||now(),updatedAt:now(),photoIds:draftPhotos.map(p=>p.id)};await new Promise((resolve,reject)=>{const tx=db.transaction(['notes','photos'],'readwrite');tx.objectStore('notes').put(note);for(const p of draftPhotos)tx.objectStore('photos').put({id:p.id,name:p.name,type:p.type,blob:p.blob,noteId:id});for(const pid of (old?.photoIds||[])){if(!note.photoIds.includes(pid))tx.objectStore('photos').delete(pid)}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});clearEditor();await refresh();notify(old?'Changes saved on iPhone':'Note saved on iPhone');setPage('outbox');}catch(err){console.error(err);notify('Could not save. Check iPhone storage.');}finally{busy=false;$('saveNoteBtn').disabled=false;}}
function selectedQuality(){return document.querySelector('input[name="quality"]:checked')?.value||'optimized'}
function onQuality(){document.querySelectorAll('.quality-choice').forEach(el=>el.classList.toggle('selected',!!el.querySelector('input:checked')));prepared=null;$('preparedActions').classList.add('hidden');$('exportStatus').textContent='';}
async function optimizeImage(photo){const blob=photo.blob;if(!blob.type.startsWith('image/'))return{blob,name:photo.name,mode:'original'};let url=URL.createObjectURL(blob);try{let img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);const packed=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.79));canvas.width=1;canvas.height=1;if(!packed)throw new Error('JPEG not supported');return{blob:packed,name:photo.name.replace(/\.[^.]+$/,'')+'.jpg',mode:'optimized'};}catch(e){return{blob,name:photo.name,mode:'original-fallback'};}finally{URL.revokeObjectURL(url);}}
async function sha(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes instanceof Uint8Array?bytes:bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
// This migration recognizes an export made with v0.1; it never deletes anything.
async function migrateExistingExports(){
  const marker=await get('batches','clear-feature-v02-initialized');
  if(marker)return;
  const existing=await get('batches','last-export');
  if(!existing){
    const older=(await all('batches')).filter(b=>Array.isArray(b.notes)&&b.notes.length&&b.id!=='last-export').sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const b=older[0];
    if(b)await put('batches',{id:'last-export',batchId:b.id,fileName:b.fileName||'Previous Atlas Notes ZIP',createdAt:b.createdAt,notes:b.notes.map(n=>({id:n.id,updatedAt:n.updatedAt})),legacy:true});
  }
  await put('batches',{id:'clear-feature-v02-initialized',createdAt:now()});
}
async function updateClearableSummary(notes){
  const batch=await get('batches','last-export');
  const el=$('clearSummary'),button=$('clearTransferredBtn');
  if(!batch||!Array.isArray(batch.notes)||!batch.notes.length){el.textContent='No exported batch is waiting to be cleared. Share or download a transfer ZIP first.';button.disabled=true;return;}
  const snapshot=new Map(batch.notes.map(n=>[n.id,n.updatedAt]));
  const eligible=notes.filter(n=>snapshot.get(n.id)===n.updatedAt);
  const changed=notes.filter(n=>snapshot.has(n.id)&&snapshot.get(n.id)!==n.updatedAt);
  el.textContent='';
  const title=document.createElement('strong');title.textContent=eligible.length+' unchanged note'+(eligible.length===1?'':'s')+' from the last export';el.appendChild(title);
  const detail=document.createElement('span');detail.textContent='Package: '+(batch.fileName||'Atlas Notes ZIP')+'. '+(changed.length?changed.length+' edited note(s) will be kept. ':'')+'Any newer notes will also be kept.';el.appendChild(detail);
  button.disabled=!eligible.length||busy;
}
async function markExportedBatch(){
  if(!prepared)return;
  const b=await get('batches',prepared.batchId);
  if(!b)throw Error('The transfer snapshot is missing. Prepare the ZIP again.');
  await put('batches',{id:'last-export',batchId:prepared.batchId,fileName:prepared.name,createdAt:now(),notes:b.notes.map(n=>({id:n.id,updatedAt:n.updatedAt})),legacy:false});
  $('clearStatus').textContent='';
  await refresh();
}
async function clearTransferredNotes(){
  if(busy)return;
  const batch=await get('batches','last-export');
  if(!batch||!Array.isArray(batch.notes)||!batch.notes.length){notify('Export notes before clearing');return;}
  const notes=await all('notes');
  const current=new Map(notes.map(n=>[n.id,n]));
  const eligible=batch.notes.filter(n=>current.get(n.id)?.updatedAt===n.updatedAt);
  if(!eligible.length){notify('No unchanged exported notes to clear');await refresh();return;}
  const photoCount=eligible.reduce((count,n)=>count+(current.get(n.id)?.photoIds?.length||0),0);
  const message='ONLY proceed if you have imported "'+(batch.fileName||'the Atlas ZIP')+'" into Windows Atlas and verified its notes and photos.\n\nDelete '+eligible.length+' note(s) and '+photoCount+' photo(s) from this iPhone? Notes added or edited since export will be kept. This cannot be undone.';
  const confirmed=await confirmAction('Clear transferred notes?',message,'Clear notes');
  if(!confirmed)return;
  busy=true;$('clearTransferredBtn').disabled=true;
  try{
    // The version is checked INSIDE the same IndexedDB transaction that deletes
    // each note and its photos, preventing a concurrent edit from being lost.
    const result=await new Promise((resolve,reject)=>{
      const tx=db.transaction(['notes','photos','batches'],'readwrite');
      const noteStore=tx.objectStore('notes'),photoStore=tx.objectStore('photos');
      let deletedNotes=0,deletedPhotos=0;
      for(const snapshot of batch.notes){
        const req=noteStore.get(snapshot.id);
        req.onsuccess=()=>{
          const note=req.result;
          if(!note||note.updatedAt!==snapshot.updatedAt)return;
          for(const pid of note.photoIds||[]){photoStore.delete(pid);deletedPhotos++;}
          noteStore.delete(note.id);deletedNotes++;
        };
      }
      // This is the last-export pointer; older exported batches do NOT become
      // eligible for deletion after the user clears the current batch.
      tx.objectStore('batches').delete('last-export');
      tx.oncomplete=()=>resolve({deletedNotes,deletedPhotos});
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||new Error('Clear transaction aborted'));
    });
    if(prepared?.batchId===batch.batchId){prepared=null;$('preparedActions').classList.add('hidden');}
    $('clearStatus').textContent='Cleared '+result.deletedNotes+' transferred note(s) and '+result.deletedPhotos+' photo(s). New or edited notes were kept.';
    notify(result.deletedNotes+' transferred note(s) cleared');
  }catch(err){console.error(err);$('clearStatus').textContent='Could not clear notes. Please retry.';notify('Could not clear notes');}
  finally{busy=false;await refresh();}
}
async function prepareTransfer(){if(busy)return;const notes=(await all('notes')).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));if(!notes.length){notify('No notes to export');return;}busy=true;$('prepareBtn').disabled=true;$('exportStatus').textContent='Preparing photos and checking data…';$('preparedActions').classList.add('hidden');await new Promise(r=>setTimeout(r,25));try{const quality=selectedQuality(),batchId=uuid(),entries=[],manifestNotes=[],versions=[];let total=0;for(const note of notes){const attachments=[];for(const pid of note.photoIds||[]){const photo=await get('photos',pid);if(!photo)throw Error('A saved photo is missing. Cannot safely export this note.');const transformed=quality==='optimized'?await optimizeImage(photo):{blob:photo.blob,name:photo.name,mode:'original'};const filename=(transformed.name||'image').replace(/[^a-zA-Z0-9._-]/g,'_');const ext=filename.includes('.')?filename.slice(filename.lastIndexOf('.')):'.bin';const path='photos/'+note.id+'/'+photo.id+ext;const data=new Uint8Array(await transformed.blob.arrayBuffer());total+=data.byteLength;if(total>90*1024*1024)throw Error('Package would exceed 90 MB. Try fewer photos or optimized quality.');entries.push({name:path,data});attachments.push({id:photo.id,originalName:photo.name,path,mimeType:transformed.blob.type||photo.type,bytes:data.byteLength,sha256:await sha(data),quality:transformed.mode});}
manifestNotes.push({id:note.id,title:note.title,body:note.body,createdAt:note.createdAt,updatedAt:note.updatedAt,attachments});versions.push({id:note.id,updatedAt:note.updatedAt});}
const manifest={format:'atlas-notes-transfer',schemaVersion:1,applicationVersion:APPVER,batchId,exportedAt:now(),photoQuality:quality,notes:manifestNotes};entries.unshift({name:'manifest.json',data:new TextEncoder().encode(JSON.stringify(manifest,null,2))});const zip=AtlasZip.make(entries);const hash=await sha(zip);const name='AtlasNotes_'+new Date().toISOString().slice(0,10)+'_'+batchId.slice(0,8)+'.zip';await put('batches',{id:batchId,createdAt:now(),archiveSha256:hash,notes:versions,fileName:name});prepared={blob:new Blob([zip],{type:'application/zip'}),name,batchId,hash};$('preparedActions').classList.remove('hidden');$('exportStatus').textContent='ZIP ready ('+bytes(zip.length)+'). Use Share to Files or Download ZIP. Notes remain on your phone.';notify('Transfer ZIP prepared');}catch(err){console.error(err);$('exportStatus').textContent=err.message||'Could not prepare transfer';notify('Transfer preparation failed');}finally{busy=false;$('prepareBtn').disabled=false;}}
async function downloadPrepared(){if(!prepared)return;const url=URL.createObjectURL(prepared.blob);const a=document.createElement('a');a.href=url;a.download=prepared.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);try{await markExportedBatch();$('exportStatus').textContent='ZIP download requested. Verify the Windows import before using Clear Transferred Notes.';}catch(e){console.error(e);notify('Unable to record this export; notes were kept');}}
async function sharePrepared(){if(!prepared)return;const f=new File([prepared.blob],prepared.name,{type:'application/zip'});try{if(!navigator.share||navigator.canShare&&!navigator.canShare({files:[f]}))throw Error('Sharing this ZIP is not supported here');await navigator.share({files:[f],title:'Atlas Notes transfer'});await markExportedBatch();$('exportStatus').textContent='Transfer package shared. Verify the notes and photos in Windows Atlas before clearing from this phone.';}catch(e){if(e.name!=='AbortError'){notify('Share unavailable; try Download ZIP instead');}}}
async function init(){try{db=await openDB();$('noteForm').addEventListener('submit',saveNote);$('takePhoto').addEventListener('change',e=>addPhotos([...e.target.files]));$('choosePhotos').addEventListener('change',e=>addPhotos([...e.target.files]));$('cancelEdit').addEventListener('click',clearEditor);document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));document.querySelectorAll('input[name="quality"]').forEach(i=>i.addEventListener('change',onQuality));$('prepareBtn').addEventListener('click',prepareTransfer);$('sharePrepared').addEventListener('click',sharePrepared);$('downloadPrepared').addEventListener('click',downloadPrepared);$('clearTransferredBtn').addEventListener('click',clearTransferredNotes);await migrateExistingExports();await refresh();if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('Offline setup failed:',err));}if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}catch(err){console.error(err);$('intro').insertAdjacentHTML('afterend','<div class="tip warn"><span class="tip-icon">!</span><p>Private storage is unavailable. Try installing the app from Safari rather than private browsing.</p></div>');document.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=true);}}
window.AtlasNotesDebug={all,put,get,prepareTransfer,markExportedBatch,clearTransferredNotes,refresh};document.addEventListener('DOMContentLoaded',init);
})();
