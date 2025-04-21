/* static/js/main.js */
/* Corrected and refined version - UNMINIFIED */
'use strict';

// Global Chart instance holders
let individualChartInstance = null;
let movingRangeChartInstance = null;
// Removed global fabric instance

// === DOMContentLoaded: Entry Point ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Initializing LSS Toolkit JS...");
    try {
        initializeBootstrapTooltips();
        initializeBootstrapToasts();
        initializeFabricCanvas('drawingCanvas');
        initializeCapabilityCalculator();
        initializePredictionForm();
        initializeDatasetAnalysis();
        initializeGenericForms();
        initializeFmeaRpnCalc();
        console.log("LSS Toolkit JS Initialized Successfully.");
    } catch (error) {
        console.error("Critical error during initialization:", error);
        showToast("Initialization error. Check console.", "danger"); // Use showToast if available
    }
});

// === Initialization Functions ===
function initializeBootstrapTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const list = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        list.forEach(el => new bootstrap.Tooltip(el)); console.log(`Init ${list.length} tooltips.`);
    } else console.warn("Bootstrap Tooltip not found.");
}
function initializeBootstrapToasts() {
    let container = document.getElementById('toastPlacement');
    if (!container && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        container = document.createElement('div'); container.id = 'toastPlacement';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3'; container.style.zIndex = '1090';
        document.body.appendChild(container); console.warn("Created missing toast container.");
    }
    if (container && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        container.addEventListener('hidden.bs.toast', e => e.target?.classList.contains('toast') && e.target.remove());
        console.log("Toast container listener initialized.");
    } else console.log("Toast container/component missing.");
}
function initializeFabricCanvas(id) {
    const el = document.getElementById(id); if (!el) return;
    if (typeof fabric === 'undefined') { showToast("Drawing library missing.", "warning"); return; }
    console.log("Init Fabric Canvas...");
    try {
        const fc = new fabric.Canvas(el.id, {backgroundColor:'rgb(240,240,240)',selection:true,renderOnAddRemove:false,stateful:false});
        document.getElementById('addRectButton')?.addEventListener('click', () => addShape(fc,'rect'));
        document.getElementById('addCircleButton')?.addEventListener('click', () => addShape(fc,'circle'));
        document.getElementById('addTextButton')?.addEventListener('click', () => addShape(fc,'text'));
        document.getElementById('loadSipocButton')?.addEventListener('click', () => loadSIPOCTemplate(fc));
        document.getElementById('saveCanvasButton')?.addEventListener('click', () => saveCanvas(fc));
        document.getElementById('loadCanvasButton')?.addEventListener('click', () => loadCanvas(fc));
        document.getElementById('zoomInButton')?.addEventListener('click', () => zoomCanvas(fc,1.1));
        document.getElementById('zoomOutButton')?.addEventListener('click', () => zoomCanvas(fc,0.9));
        document.getElementById('clearCanvasButton')?.addEventListener('click', () => clearCanvas(fc));
        document.getElementById('exportCanvasButton')?.addEventListener('click', () => exportCanvasImage(fc));
        loadCanvas(fc); attachCanvasKeyListener(fc);
    } catch (e) { console.error("Fabric init err:", e); showToast("Drawing tool init failed.", "danger"); }
}
function attachCanvasKeyListener(canvas) {
    if (!canvas) { console.warn("Canvas instance missing for key listener."); return; }
    if (window.canvasKeyListenerAttached) return; console.log("Attaching canvas key listener.");
    window.addEventListener('keydown', e => {
        const activeEl = document.activeElement; if(activeEl&&(activeEl.tagName==='INPUT'||activeEl.tagName==='TEXTAREA'||activeEl.isContentEditable)) return;
        if (e.key==='Delete'||e.key==='Backspace') {
            const obj=canvas.getActiveObject(), grp=canvas.getActiveObjects?.();
            if(obj||(grp&&grp.length>0)){ console.log("Del key pressed on canvas obj."); try{ if(grp&&grp.length>0) grp.forEach(o=>canvas.remove(o)); else if(obj) canvas.remove(obj); canvas.discardActiveObject(); canvas.requestRenderAll(); e.preventDefault(); } catch(err){ console.error("Canvas remove err:", err); }}
        }
    }); window.canvasKeyListenerAttached = true;
}
function initializeCapabilityCalculator(){ const f=document.getElementById('capabilityForm'); if(f){console.log("Init Analyze Cap Calc Form...");f.addEventListener('submit',handleCapabilitySubmit);} }
function initializePredictionForm(){ const f=document.getElementById('predictionForm'); if(f){console.log("Init Prediction Form...");f.addEventListener('submit',handlePredictionSubmit);} }
function initializeDatasetAnalysis() {
    const dsSel=document.getElementById('datasetSelect'), chartDsSel=document.getElementById('chartDatasetSelectInline');
    const loadBtn=document.getElementById('loadDatasetStatsButton'), typeSel=document.getElementById('chartTypeSelect'), genBtn=document.getElementById('generateChartButton');
    function syncUI(){const id=dsSel?.value??'';const en=id!=='';if(chartDsSel&&chartDsSel.value!==id)chartDsSel.value=id;[loadBtn,typeSel,genBtn,chartDsSel].forEach(el=>el?.toggleAttribute('disabled',!en));if(!en)resetAnalysisDisplays();}
    if(dsSel){console.log("Init Dataset Analysis UI...");dsSel.addEventListener('change',syncUI);syncUI();}else{[loadBtn,typeSel,genBtn,chartDsSel].forEach(el=>el?.setAttribute('disabled','true'));}
    if(chartDsSel)chartDsSel.addEventListener('change',()=>{if(dsSel&&dsSel.value!==chartDsSel.value){dsSel.value=chartDsSel.value;syncUI();}});
    if(loadBtn)loadBtn.addEventListener('click',handleLoadStats); if(genBtn)genBtn.addEventListener('click',handleGenerateChart);
}
function resetAnalysisDisplays() {
    ['basicStatsDisplay','statsErrorDisplay','controlChartContainerI','controlChartContainerMR','chartErrorDisplay','controlChartInfo','capabilityResults','capabilityError'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
    if(individualChartInstance){try{individualChartInstance.destroy();}catch(e){}individualChartInstance=null;} if(movingRangeChartInstance){try{movingRangeChartInstance.destroy();}catch(e){}movingRangeChartInstance=null;}
    const cm=document.getElementById('cap_mean');if(cm)cm.value='';const cs=document.getElementById('cap_std_dev');if(cs)cs.value=''; const cr=document.getElementById('capabilityResults');if(cr)cr.style.display='none';const ce=document.getElementById('capabilityError');if(ce)ce.style.display='none';
}
function initializeGenericForms() {
    console.log("Init generic form actions..."); const btns=document.querySelectorAll('button[data-action][data-form-type]');
    btns.forEach(b=>{const act=b.dataset.action,typ=b.dataset.formType;if(b.dataset.listenerAttached==='true')return;switch(act){case 'save':b.addEventListener('click',()=>saveGenericForm(typ));break;case 'load':b.addEventListener('click',()=>loadGenericForm(typ));break;case 'export':b.addEventListener('click',()=>exportGenericFormPDF(typ));break;default:console.warn(`Unknown action:${act}/${typ}`);break;}b.dataset.listenerAttached='true';}); console.log(`Listeners on ${btns.length} buttons.`);
}
function initializeFmeaRpnCalc() {
    const form=document.getElementById('fmeaForm'); if(!form)return; console.log("Init FMEA RPN calc..."); const tbody=form.querySelector('#fmeaTableBody');
    if(tbody){tbody.addEventListener('input',e=>{if(e.target?.classList.contains('fmea-calc'))calculateFmeaRpnForRow(e.target.closest('tr'));}); tbody.querySelectorAll('tr').forEach(r=>calculateFmeaRpnForRow(r));} else console.warn("FMEA tbody missing.");
}

// === Event Handlers ===
async function handleCapabilitySubmit(event) {
    event.preventDefault(); const form=event.target; const resDiv=document.getElementById('capabilityResults'),errDiv=document.getElementById('capabilityError'),sucDiv=document.getElementById('capabilitySuccessDisplay');
    if(!resDiv||!errDiv||!sucDiv){console.error("Cap display missing!");showToast("UI Error.","danger");return;} resDiv.style.display='none';errDiv.style.display='none';sucDiv.style.display='none';errDiv.textContent=''; resDiv.querySelectorAll('span[id^="result-"]').forEach(s=>s.textContent='...');
    const fd={mean:form.elements['mean']?.value,std_dev:form.elements['std_dev']?.value,lsl:form.elements['lsl']?.value,usl:form.elements['usl']?.value};
    if(fd.mean===''||fd.std_dev===''){resDiv.style.display='block';errDiv.textContent='Mean & Std Dev req.';errDiv.style.display='block';return;} if(isNaN(parseFloat(fd.std_dev))||parseFloat(fd.std_dev)<0){resDiv.style.display='block';errDiv.textContent='Std Dev must be >= 0.';errDiv.style.display='block';return;}
    showToast("Calculating...","info"); const result=await calculateCapability(fd); resDiv.style.display='block';
    if(result.error){errDiv.textContent=`Error: ${result.error}`;errDiv.style.display='block';sucDiv.style.display='none';showToast(`Calc Error: ${result.error}`,"danger");}
    else{errDiv.style.display='none';sucDiv.style.display='block';const fmt=v=>(v===Infinity||v===-Infinity)?'Infinite':(v!==null?v:'N/A'); document.getElementById('result-cp').textContent=fmt(result.cp);document.getElementById('result-cpk').textContent=fmt(result.cpk);showToast("Capability calculated.","success");}
}
async function handlePredictionSubmit(event) {
    event.preventDefault(); const form=event.target, resDiv=document.getElementById('predictionApiResult'); if(!resDiv){console.error("Predict div missing!");return;}
    resDiv.style.display='block';resDiv.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span> Predicting...';resDiv.className='api-result mt-auto alert alert-secondary';
    const fd={feature1:form.elements['feature1']?.value,feature2:form.elements['feature2']?.value};
    if(fd.feature1===''||fd.feature2===''){resDiv.innerHTML='<i class="bi bi-x-circle me-1"></i> Error: Both features required.';resDiv.classList.replace('alert-secondary','alert-danger');return;} if(isNaN(parseFloat(fd.feature1))||isNaN(parseFloat(fd.feature2))){resDiv.innerHTML='<i class="bi bi-x-circle me-1"></i> Error: Features must be numeric.';resDiv.classList.replace('alert-secondary','alert-danger');return;}
    try{const resp=await fetch('/predict_api',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(fd)});const res=await resp.json();if(!resp.ok)throw new Error(res.error||`Server Error: ${resp.status}`);if(res.prediction!==undefined){resDiv.innerHTML=`<i class="bi bi-check-circle me-1"></i> Predicted: ${parseFloat(res.prediction).toFixed(3)}`;resDiv.classList.replace('alert-secondary','alert-success');}else throw new Error(res.error||'Invalid response');}
    catch(e){console.error('Predict API Error:',e);resDiv.innerHTML=`<i class="bi bi-x-circle me-1"></i> Error: ${e.message}`;resDiv.classList.replace('alert-secondary','alert-danger');}
}
async function handleLoadStats() {
    const dsSel=document.getElementById('datasetSelect'); if(!dsSel)return; const sid=dsSel.value, sDisp=document.getElementById('basicStatsDisplay'), eDisp=document.getElementById('statsErrorDisplay'); if(!sid){showToast("Select dataset first.","warning");return;} if(!sDisp||!eDisp){console.error("Stats display missing!");return;}
    sDisp.style.display='none'; eDisp.style.display='none'; eDisp.textContent=''; sDisp.querySelectorAll('span[id^="stat-"]').forEach(s=>s.innerHTML='<span class="spinner-border spinner-border-sm"></span>'); sDisp.style.display='block';
    try{const resp=await fetch(`/get_dataset_stats/${sid}`);const stats=await resp.json(); if(!resp.ok||stats.error)throw new Error(stats.error||`Server Error: ${resp.status}`); sDisp.querySelectorAll('span[id^="stat-"]').forEach(s=>{const k=s.id.replace('stat-','');const v=stats[k];s.textContent=(v!==null&&v!==undefined)?(typeof v==='number'?v.toLocaleString(undefined,{maximumFractionDigits:4}):v):'N/A';}); const cm=document.getElementById('cap_mean'),cs=document.getElementById('cap_std_dev'); if(cm)cm.value=(stats.mean!==null&&stats.mean!==undefined)?stats.mean:''; if(cs)cs.value=(stats.std_dev!==null&&stats.std_dev!==undefined)?stats.std_dev:''; showToast("Stats loaded.","success");}
    catch(e){console.error('Load stats error:',e);eDisp.textContent=`Error loading stats: ${e.message}`;eDisp.style.display='block';sDisp.style.display='none'; const cm=document.getElementById('cap_mean'),cs=document.getElementById('cap_std_dev');if(cm)cm.value='';if(cs)cs.value=''; showToast(`Load stats failed: ${e.message}`,"danger");}
}
async function handleGenerateChart() {
    const dsSel=document.getElementById('datasetSelect'), ctSel=document.getElementById('chartTypeSelect'); const dsid=dsSel?.value, ct=ctSel?.value; const cI=document.getElementById('controlChartContainerI'),cMR=document.getElementById('controlChartContainerMR'); const canI=document.getElementById('controlChartCanvasI'),canMR=document.getElementById('controlChartCanvasMR'); const eDisp=document.getElementById('chartErrorDisplay'),cInfo=document.getElementById('controlChartInfo');
    if(!dsid||!ct){showToast('Select dataset & chart type.','warning');return;} if(!cI||!cMR||!canI||!canMR||!eDisp||!cInfo){console.error("Chart elements missing!");showToast("Chart UI Error.","danger");return;}
    cI.style.display='none';cMR.style.display='none';eDisp.style.display='none';cInfo.style.display='none'; if(individualChartInstance){try{individualChartInstance.destroy();}catch(e){}individualChartInstance=null;} if(movingRangeChartInstance){try{movingRangeChartInstance.destroy();}catch(e){}movingRangeChartInstance=null;}
    console.log(`Fetching I-MR chart for ${dsid}`); eDisp.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span> Generating charts...'; eDisp.className='alert alert-info mt-3'; eDisp.style.display='block';
    try{const resp=await fetch(`/get_control_chart_data/${dsid}?type=imr`);const chartResp=await resp.json();eDisp.style.display='none';if(!resp.ok||chartResp.error)throw new Error(chartResp.error||`Server Error: ${resp.status}`);if(!chartResp.individual_chart||!chartResp.moving_range_chart)throw new Error("Incomplete data."); console.log('I-MR data received'); cInfo.style.display='block'; const dsSub=dsid?dsid.substring(0,8):'Unk';
        cI.style.display='block';const ctxI=canI.getContext('2d'); individualChartInstance=new Chart(ctxI,{type:'line',data:chartResp.individual_chart,options:getChartOptions(`I Chart - ${dsSub}...`,'Value')});
        cMR.style.display='block';const ctxMR=canMR.getContext('2d'); movingRangeChartInstance=new Chart(ctxMR,{type:'line',data:chartResp.moving_range_chart,options:getChartOptions(`MR Chart - ${dsSub}...`,'Range',true)});
        showToast("I-MR charts generated.","success");
    }catch(e){console.error('Chart gen error:',e);eDisp.textContent=`Chart Error: ${e.message}`;eDisp.className='alert alert-danger mt-3';eDisp.style.display='block';cI.style.display='none';cMR.style.display='none';cInfo.style.display='none'; if(individualChartInstance){try{individualChartInstance.destroy();}catch(e){}individualChartInstance=null;}if(movingRangeChartInstance){try{movingRangeChartInstance.destroy();}catch(e){}movingRangeChartInstance=null;} showToast(`Chart gen failed: ${e.message}`,"danger");}
}
function getChartOptions(title,yLbl,y0=false){return{responsive:true,maintainAspectRatio:false,parsing:false,plugins:{title:{display:true,text:title,padding:{bottom:10}},legend:{position:'bottom',labels:{boxWidth:12,padding:10}},tooltip:{mode:'index',intersect:false,bodySpacing:4,padding:8}},scales:{x:{title:{display:true,text:'Timestamp/Index'},ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:15,padding:5}},y:{title:{display:true,text:yLbl},beginAtZero:y0,grace:'5%'}},animation:false,hover:{mode:'index',intersect:false},elements:{line:{borderWidth:1.5},point:{radius:2.5,hoverRadius:4}}};}

// === API Call Functions ===
async function calculateCapability(fd){console.log('API Call:/calculate_capability_api',fd);try{const r=await fetch('/calculate_capability_api',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(fd)});const d=await r.json();if(!r.ok&&!d.error)return{error:`Server Error: ${r.status}`};return d;}catch(e){console.error('Cap API Fetch Err:',e);return{error:`Network error: ${e.message}`};}}

// === Generic Form Handling ===
function saveGenericForm(typ){const f=document.getElementById(`${typ}Form`);if(!f){console.error(`Save Err: Form ${typ}Form miss.`);showToast(`Save Error: Form not found.`,"danger");return;} const d={};const fd=new FormData(f);fd.forEach((v,k)=>{const e=f.elements[k];if(e?.closest('tbody'))return;if(e?.type==='radio'){if(e.checked)d[k]=v;}else if(e?.type==='checkbox')d[k]=e.checked;else d[k]=v;});if(typ==='fmea'||typ==='controlPlan'){const tD=[];const tb=f.querySelector('tbody');tb?.querySelectorAll('tr').forEach(r=>{const rD={};let hD=false;r.querySelectorAll('input,textarea,select').forEach(i=>{if(i.name){const k=i.name.replace(/_\d+$/,'');const v=i.type==='checkbox'?i.checked:i.value;rD[k]=v;if(v&&String(v).trim()!=='')hD=true;}});if(hD)tD.push(rD);});d[`${typ}_table`]=tD;console.log(`Extracted ${tD.length} rows for ${typ}`);}try{localStorage.setItem(`form_${typ}`,JSON.stringify(d));showToast(`${typ.replace(/([A-Z])/g,' $1')} saved.`, "success");console.log(`Saved ${typ}:`,d);}catch(e){console.error("LS Save Err:",e);showToast(`Save Fail. Storage full?`,"danger");}}
function loadGenericForm(typ){const f=document.getElementById(`${typ}Form`);if(!f){console.error(`Load Err: Form ${typ}Form miss.`);showToast(`Load Error: Form not found.`,"danger");return;}try{const sD=JSON.parse(localStorage.getItem(`form_${typ}`)||'{}');if(Object.keys(sD).length===0){showToast(`No saved data for ${typ}.`,"info");f.reset();if(f.querySelector('tbody'))f.querySelector('tbody').innerHTML='';return;}console.log(`Loading ${typ}:`,sD);f.reset();Object.keys(sD).forEach(k=>{if(k.endsWith('_table'))return;const els=f.elements[k];if(!els)return;if(els instanceof RadioNodeList||(els.nodeName==='INPUT'&&els.type==='radio')){Array.from(els).forEach(i=>{if(i.type==='radio')i.checked=(i.value===sD[k]);});}else{const i=els;if(i.type==='checkbox')i.checked=sD[k]===true||sD[k]==='on';else if(i.value!==undefined)i.value=sD[k]||'';}});if(typ==='fmea'||typ==='controlPlan'){const tD=sD[`${typ}_table`],tb=f.querySelector('tbody');if(tD&&tb&&Array.isArray(tD)&&tD.length>0){console.log(`Loading ${tD.length} rows.`);tb.innerHTML='';const expInp=getExpectedTableInputs(typ);tD.forEach((rD,rIdx)=>{const nR=document.createElement('tr');expInp.forEach(inf=>{const c=document.createElement('td');let i;if(info.type==='textarea'){i=document.createElement('textarea');i.rows="2";}else{i=document.createElement('input');i.type=info.type;if(info.type==='number'){if(info.min!==undefined)i.min=info.min;if(info.max!==undefined)i.max=info.max;i.classList.add('text-center');}}i.name=`${info.baseName}_${rIdx+1}`;i.className='form-control form-control-sm';if(info.readOnly)i.readOnly=true;if(info.calcClass)i.classList.add(info.calcClass);i.value=rD[info.baseName]||'';c.appendChild(i);nR.appendChild(c);});tb.appendChild(nR);if(typ==='fmea')calculateFmeaRpnForRow(nR);});}else if(tb)tb.innerHTML=(tD?'<tr><td colspan="100%" class="text-danger small fst-italic">Err loading table</td></tr>':'');}showToast(`${typ.replace(/([A-Z])/g,' $1')} loaded.`,"info");}catch(e){console.error("LS Load Err:",e);showToast("Load Failed. Check console.","danger");}}
function getExpectedTableInputs(typ){if(typ==='fmea')return [{baseName:'fmea_step',type:'textarea'},{baseName:'fmea_mode',type:'textarea'},{baseName:'fmea_effect',type:'textarea'},{baseName:'fmea_sev',type:'number',min:1,max:10,calcClass:'fmea-calc'},{baseName:'fmea_cause',type:'textarea'},{baseName:'fmea_occ',type:'number',min:1,max:10,calcClass:'fmea-calc'},{baseName:'fmea_control',type:'textarea'},{baseName:'fmea_det',type:'number',min:1,max:10,calcClass:'fmea-calc'},{baseName:'fmea_rpn',type:'number',readOnly:true,calcClass:'fmea-rpn'},{baseName:'fmea_action',type:'textarea'}];if(typ==='controlPlan')return [{baseName:'cp_step',type:'textarea'},{baseName:'cp_ctq',type:'textarea'},{baseName:'cp_spec',type:'text'},{baseName:'cp_measure_method',type:'text'},{baseName:'cp_sample_size',type:'text'},{baseName:'cp_frequency',type:'text'},{baseName:'cp_control_method',type:'text'},{baseName:'cp_reaction',type:'textarea'}];return[];}
async function exportGenericFormPDF(typ){ // Changed to async for server-side export
    const form=document.getElementById(`${typ}Form`); if(!form){showToast(`Export Err: Form missing.`,"danger");return;} const sD=JSON.parse(localStorage.getItem(`form_${typ}`)||'{}'); if(Object.keys(sD).length===0){showToast("No saved data.", "warning");return;} const titleEl=form.closest('.form-section,.card')?.querySelector('h2,h3,h4,h5'); const fTitle=titleEl?.textContent.trim()||typ.replace(/([A-Z])/g,' $1');
    if(typ==='projectCharter'){console.log("Exporting Charter via server...");showToast("Generating Charter PDF...","info");try{const resp=await fetch('/export/project_charter/pdf',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/pdf'},body:JSON.stringify(sD)});if(!resp.ok){let msg=`Server Error: ${resp.status}`;try{const errD=await resp.json();msg=errD.message||msg;}catch(e){}throw new Error(msg);} const blob=await resp.blob();const fnHdr=resp.headers.get('Content-Disposition');let fn=`${typ}_export.pdf`;if(fnHdr){const m=fnHdr.match(/filename="?([^"]+)"?/);if(m&&m[1])fn=m[1];} const lnk=document.createElement('a');lnk.href=window.URL.createObjectURL(blob);lnk.download=fn;document.body.appendChild(lnk);lnk.click();document.body.removeChild(lnk);window.URL.revokeObjectURL(lnk.href); showToast("Charter PDF generated.","success");}catch(e){console.error("Charter PDF Export Err:",e);showToast(`PDF Export Failed: ${e.message}`,"danger");}return;}
    if(typeof jspdf==='undefined'||typeof jspdf.jsPDF==='undefined'){showToast('jsPDF lib missing.','danger');return;}const{jsPDF}=jspdf; const orient=(typ==='sipoc'||typ==='fmea'||typ==='controlPlan')?'l':'p'; const doc=new jsPDF({orientation:orient,unit:'mm',format:'a4'}); const hasAT=typeof doc.autoTable==='function'; console.log(`Exporting ${typ} PDF (Client)`);showToast(`Generating PDF...`,"info"); const m={top:15,right:15,bottom:20,left:15}; const uW=doc.internal.pageSize.width-m.left-m.right; let y=m.top;const lSp=5,pad=2,vInd=3;
    function checkPB(cY,n=lSp){if(cY+n>(doc.internal.pageSize.height-m.bottom)){doc.addPage();addFtr(doc,doc.internal.getCurrentPageInfo().pageNumber);return m.top;}return cY;} function addT(txt,x,cY,o={}){const sz=o.fontSize||9,st=o.fontStyle||'normal',mW=o.maxWidth||uW;doc.setFontSize(sz);doc.setFont(undefined,st);const lns=doc.splitTextToSize(String(txt),mW);const h=doc.getTextDimensions(lns).h;cY=checkPB(cY,h);doc.text(lns,x,cY,o);return cY+h;} function addFtr(pdf,pN,pC){const fY=pdf.internal.pageSize.height-(m.bottom/2);pdf.setFontSize(8);pdf.setTextColor(150);pdf.text(`Page ${pN}${pC?' of '+pC:''}`,pdf.internal.pageSize.width/2,fY,{align:'center'});pdf.text(`Generated: ${new Date().toLocaleDateString()}`,m.left,fY);pdf.text(`LSS Toolkit`,pdf.internal.pageSize.width-m.right,fY,{align:'right'});pdf.setTextColor(0);}
    doc.setFontSize(14);y=addT(fTitle,m.left,y,{fontSize:14,fontStyle:'bold'});doc.setLineWidth(0.2);doc.line(m.left,y+1,doc.internal.pageSize.width-m.right,y+1);y+=lSp;
    if(typ==='sipoc'){if(!hasAT){showToast("SIPOC PDF requires AutoTable.","warning");return;}doc.setFontSize(9);y=addT(`Process: ${sD['sipoc_process_name']||'N/A'}`,m.left,y);y-=lSp*0.5;y=addT(`Scope: ${sD['sipoc_scope']||'N/A'}`,m.left,y);y-=lSp*0.5;y=addT(`Date: ${sD['sipoc_date']||'N/A'}`,m.left,y);y+=pad*2;const hs=['Suppliers','Inputs','Processes','Outputs','Customers'],ks=['suppliers_list','inputs_list','processes_list','outputs_list','customers_list'];const cols=ks.map(k=>(sD[k]||'').split('\n').map(l=>l.trim()).filter(l=>l));const maxR=Math.max(0,...cols.map(c=>c.length));const body=Array.from({length:maxR},(_,i)=>cols.map(c=>c[i]||''));try{doc.autoTable({startY:y,head:[hs],body:body,theme:'grid',headStyles:{fillColor:[0,51,102],textColor:255,fontStyle:'bold',halign:'center',fontSize:9,cellPadding:2},bodyStyles:{fontSize:8,cellPadding:1.5,valign:'top',overflow:'linebreak'},margin:{left:m.left,right:m.right},didDrawPage:(data)=>{addFtr(doc,data.pageNumber);}});y=doc.autoTable.previous.finalY?doc.autoTable.previous.finalY+10:y+20;}catch(e){console.error("SIPOC AutoTable Err:",e);y=addT("[Table Err]",m.left,y,{textColor:'red'});}}
    else if((typ==='fmea'||typ==='controlPlan')&&hasAT){y+=2;const tD=sD[`${typ}_table`],tE=form.querySelector('table');if(tD&&tE&&Array.isArray(tD)&&tD.length>0){y=checkPB(y,20);const hs=[],exp=getExpectedTableInputs(typ);tE.querySelectorAll('thead th').forEach(th=>hs.push(th.textContent.trim()));const body=tD.map(r=>exp.map(inf=>r[inf.baseName]?.toString()||''));try{doc.autoTable({startY:y,head:[hs],body:body,theme:'grid',headStyles:{fillColor:[60,60,60],textColor:255,fontSize:7,fontStyle:'bold',halign:'center',cellPadding:1.5},bodyStyles:{fontSize:6.5,cellPadding:1,overflow:'linebreak'},margin:{left:m.left,right:m.right},didDrawPage:(data)=>{addFtr(doc,data.pageNumber);}});y=doc.autoTable.previous.finalY?doc.autoTable.previous.finalY+10:y+20;}catch(e){console.error("AutoTable Err:",e);y=addT("[Table Err]",m.left,y,{textColor:'red'});}}else if(tD?.length===0){y=addT("[No table data]",m.left,y,{fontStyle:'italic',textColor:150});y+=pad;}}
    else if(typ==='fmea'||typ==='controlPlan'){y+=5;y=addT("[Table requires AutoTable plugin]",m.left,y);y+=pad;console.warn("AutoTable missing.");}
    else{form.querySelectorAll('input:not([type=radio]):not([type=button]):not([type=submit]),textarea,select,input[type=radio]:checked').forEach(fInp=>{if(fInp.closest('tbody'))return;const k=fInp.name;if(!k||k.endsWith('_table'))return;let lbl="Lbl err";try{const lEl=form.querySelector(`label[for="${fInp.id}"]`)||fInp.closest('.mb-3,.form-group')?.querySelector('label');if(lEl)lbl=lEl.textContent.trim().replace('*','').replace(':','');}catch(e){}let v=sD[k];if(fInp.type==='checkbox')v=sD[k]?'Yes':'No';v=v?.toString()||'(empty)';y=checkPB(y,lSp*1.5);y=addT(`${lbl}:`,m.left,y,{fontSize:9,fontStyle:'bold'});y-=lSp*0.4;y=addT(v,m.left+vInd,y,{fontSize:9,fontStyle:'normal',maxWidth:uW-vInd});y+=pad;});}
    const pC=doc.internal.getNumberOfPages?doc.internal.getNumberOfPages():1;for(let i=1;i<=pC;i++){doc.setPage(i);addFtr(doc,i,pC);} try{const sT=fTitle.replace(/[^a-z0-9_\-\s]/gi,'').replace(/\s+/g,'_')||typ;const tS=new Date().toISOString().split('T')[0];doc.save(`${sT}_export_${tS}.pdf`);console.log(`${typ} exported.`);showToast(`Exported ${fTitle}`,"success");}catch(e){console.error("PDF Save Err:",e);showToast("PDF Export Failed.","danger");}
}

// === FMEA Specific Helpers ===
function calculateFmeaRpnForRow(rowEl){if(!rowEl)return;const s=rowEl.querySelector('[name^="fmea_sev_"]'),o=rowEl.querySelector('[name^="fmea_occ_"]'),d=rowEl.querySelector('[name^="fmea_det_"]'),rpn=rowEl.querySelector('[name^="fmea_rpn_"]');if(s&&o&&d&&rpn){const sV=parseInt(s.value)||0,oV=parseInt(o.value)||0,dV=parseInt(d.value)||0;rpn.value=(sV>0&&oV>0&&dV>0&&sV<=10&&oV<=10&&dV<=10)?(sV*oV*dV):'';}}

// === Fabric.js Canvas Functions ===
function addShape(c,t){if(!c)return;let s;const l=50+Math.random()*50,o=50+Math.random()*50;try{switch(t){case 'rect':s=new fabric.Rect({left:l,top:o,fill:'rgba(63,81,181,0.7)',width:120,height:70,stroke:'#3F51B5',originX:'left',originY:'top'});break;case 'circle':s=new fabric.Circle({left:l+100,top:o+50,fill:'rgba(255,87,34,0.7)',radius:40,stroke:'#FF5722',originX:'left',originY:'top'});break;case 'text':const v=prompt("Enter text:","Sample");if(v)s=new fabric.Textbox(v,{left:l,top:o+100,fontSize:20,width:150,originX:'left',originY:'top'});break;default:return;}if(s){c.add(s);c.setActiveObject(s);c.requestRenderAll();}}catch(e){console.error("Fabric add Err:",e);showToast("Canvas error.","danger");}}
function loadSIPOCTemplate(c){if(!c)return;const x=50,y=50,sp=60,w=120,h=45,T=['Suppliers','Inputs','Process','Outputs','Customers'],C=['#FFF9C4','#FFCDD2','#C8E6C9','#B2EBF2','#D1C4E9'];if(!confirm("Clear canvas?"))return;try{clearCanvas(c,false);T.forEach((tt,i)=>{const r=new fabric.Rect({left:x,top:y+i*sp,fill:C[i],width:w,height:h,stroke:'#9E9E9E',selectable:false,evented:false,rx:5,ry:5});const t=new fabric.Textbox(tt,{left:x+w/2,top:y+i*sp+h/2,fontSize:14,fw:'500',fill:'#424242',width:w-10,textAlign:'center',originX:'center',originY:'center',sel:false,evt:false});c.add(r,t);const p=new fabric.Textbox('Details...',{left:x+w+20,top:y+i*sp,width:250,height:h,fontSize:12,fill:'#616161',originX:'left',originY:'top',pad:5});c.add(p);});c.requestRenderAll();showToast("SIPOC loaded.","info");}catch(e){console.error("SIPOC Load Err:",e);showToast("Template load fail.","danger");}}
function saveCanvas(c){if(!c)return;try{localStorage.setItem('fabricCanvasData_LSS',JSON.stringify(c.toJSON()));showToast('Canvas saved!','success');}catch(e){console.error("Canvas Save Err:",e);showToast(e.name==='QuotaExceededError'?'Storage full.':'Save failed.','danger');}}
function loadCanvas(c){if(!c)return;try{const d=localStorage.getItem('fabricCanvasData_LSS');if(d){c.clear();c.loadFromJSON(JSON.parse(d),()=>{c.renderAll();showToast("Canvas loaded.","info");});}else{c.clear();c.backgroundColor='rgb(240,240,240)';c.renderAll();}}catch(e){console.error("Canvas Load Err:",e);showToast("Load failed.","danger");c.clear();c.backgroundColor='rgb(240,240,240)';c.renderAll();}}
function zoomCanvas(c,f){if(!c)return;try{let z=c.getZoom()*f;z=Math.max(0.1,Math.min(z,10));const ct=c.getCenter();c.zoomToPoint(new fabric.Point(ct.left,ct.top),z);}catch(e){console.error("Zoom err:",e);}}
function clearCanvas(c,conf=true){if(!c)return;const ok=conf?confirm("Clear canvas?"):true;if(ok){try{c.clear();c.backgroundColor='rgb(240,240,240)';c.setZoom(1);c.absolutePan({x:0,y:0});c.renderAll();showToast("Canvas cleared.","info");}catch(e){console.error("Clear err:",e);showToast("Clear failed.","danger");}}}
function exportCanvasImage(c){if(!c)return;try{const u=c.toDataURL({format:'png',multiplier:1.5});const l=document.createElement('a');const t=new Date().toISOString().split('T')[0];l.download=`lss_canvas_${t}.png`;l.href=u;document.body.appendChild(l);l.click();document.body.removeChild(l);showToast("Canvas exported.","success");}catch(e){console.error("Export err:",e);showToast("Export failed.","danger");}}

// === Utility Functions ===
function showToast(msg,typ='info'){console.log(`Toast (${typ}): ${msg}`);const tp=document.getElementById('toastPlacement');if(tp&&typeof bootstrap!=='undefined'&&bootstrap.Toast){const tid=`toast-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;let bg='bg-primary',tc='text-white';switch(typ.toLowerCase()){case'success':bg='bg-success';break;case'danger':bg='bg-danger';break;case'warning':bg='bg-warning';tc='text-dark';break;case'info':bg='bg-info';tc='text-dark';break;case'secondary':bg='bg-secondary';break;}const ht=`<div id="${tid}" class="toast align-items-center ${tc} ${bg} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000"><div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close ${tc==='text-white'?'btn-close-white':''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>`;tp.insertAdjacentHTML('beforeend',ht);const tel=document.getElementById(tid);if(tel){try{new bootstrap.Toast(tel).show();}catch(e){console.error("Toast show err:",e,tel);}}}else console.warn("Toast container/Bootstrap missing.");}
// --- End of File ---