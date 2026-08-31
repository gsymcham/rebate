const C=window.APP_CONFIG,S=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY),$=x=>document.getElementById(x);
let session=null,periods=[],programs=[],pid=null;
const money=x=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(+x||0);
const calc=p=>{let q=+p.qty_sold||0,u=Math.max(1,+p.units_required||1),r=+p.rebate_amount||0,price=+p.item_price||0;return{sales:q*price,qual:Math.floor(q/u),unmatched:q%u,due:Math.floor(q/u)*r}};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

async function boot(){let {data}=await S.auth.getSession();session=data.session;renderAuth();if(session)await loadPeriods()}
function renderAuth(){$("auth").classList.toggle("hidden",!!session);$("app").classList.toggle("hidden",!session);$("logout").classList.toggle("hidden",!session)}
$("login").onclick=async()=>{let {data,error}=await S.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)return $("msg").textContent=error.message;session=data.session;renderAuth();await loadPeriods()}
$("signup").onclick=async()=>{let {data,error}=await S.auth.signUp({email:$("email").value.trim(),password:$("password").value});if(error)return $("msg").textContent=error.message;session=data.session;$("msg").textContent=session?"Account created":"Check email if confirmation is enabled";renderAuth();if(session)await loadPeriods()}
$("logout").onclick=async()=>{await S.auth.signOut();session=null;renderAuth()}

async function loadPeriods(){let {data,error}=await S.from("rebate_periods").select("*").order("start_date",{ascending:false});if(error)return alert(error.message);periods=data||[];$("period").innerHTML=periods.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.start_date} - ${p.end_date})</option>`).join("");if(!periods.length){pid=null;programs=[];renderPrograms();return}pid=periods.some(p=>p.id===pid)?pid:periods[0].id;$("period").value=pid;await loadPrograms()}
$("period").onchange=async e=>{pid=e.target.value;await loadPrograms()}
$("newPeriod").onclick=()=>{$("periodName").value="";$("periodStart").value="";$("periodEnd").value="";$("periodDlg").showModal()}
$("savePeriod").onclick=async e=>{e.preventDefault();let p={user_id:session.user.id,name:$("periodName").value.trim(),start_date:$("periodStart").value,end_date:$("periodEnd").value};if(!p.name||!p.start_date||!p.end_date)return alert("Complete all fields");let {error}=await S.from("rebate_periods").insert(p);if(error)return alert(error.message);$("periodDlg").close();await loadPeriods()}

async function loadPrograms(){let {data,error}=await S.from("rebate_programs").select("*").eq("period_id",pid).order("plu");if(error)return alert(error.message);programs=data||[];renderPrograms()}
function renderPrograms(){let tq=0,ts=0,tr=0;$("body").innerHTML=programs.map(p=>{let c=calc(p);tq+=+p.qty_sold||0;ts+=c.sales;tr+=c.due;return `<tr><td>${esc(p.plu)}</td><td>${esc(p.description)}</td><td>${esc(p.size_pack)}</td><td>${esc(p.scan_program)}</td><td>${money(p.rebate_amount)}</td><td>${p.start_date}</td><td>${p.end_date}</td><td>${p.units_required}</td><td>${p.qty_sold}</td><td>${money(p.item_price)}</td><td>${money(c.sales)}</td><td>${c.qual}</td><td>${c.unmatched}</td><td><b>${money(c.due)}</b></td><td><button class="ghost" onclick="editProgram('${p.id}')">Edit</button> <button class="danger" onclick="deleteProgram('${p.id}')">Delete</button></td></tr>`}).join("");$("sPrograms").textContent=programs.length;$("sQty").textContent=tq;$("sSales").textContent=money(ts);$("sRebate").textContent=money(tr)}

$("newProgram").onclick=()=>{if(!pid)return alert("Create a rebate period first");$("programTitle").textContent="Add rebate program";$("programId").value="";["plu","desc","size","scan","notes"].forEach(x=>$(x).value="");$("rebate").value=0;$("units").value=1;$("qty").value=0;$("price").value=0;let p=periods.find(x=>x.id===pid);$("start").value=p.start_date;$("end").value=p.end_date;$("programDlg").showModal()}
window.editProgram=id=>{let p=programs.find(x=>x.id===id);$("programTitle").textContent="Edit rebate program";$("programId").value=p.id;$("plu").value=p.plu;$("desc").value=p.description;$("size").value=p.size_pack||"";$("scan").value=p.scan_program||"";$("rebate").value=p.rebate_amount;$("start").value=p.start_date;$("end").value=p.end_date;$("units").value=p.units_required;$("qty").value=p.qty_sold;$("price").value=p.item_price;$("notes").value=p.notes||"";$("programDlg").showModal()}
$("saveProgram").onclick=async e=>{e.preventDefault();let p={user_id:session.user.id,period_id:pid,plu:$("plu").value.trim(),description:$("desc").value.trim(),size_pack:$("size").value.trim(),scan_program:$("scan").value.trim(),rebate_amount:+$("rebate").value||0,start_date:$("start").value,end_date:$("end").value,units_required:+$("units").value||1,qty_sold:+$("qty").value||0,item_price:+$("price").value||0,notes:$("notes").value.trim(),updated_at:new Date().toISOString()};if(!p.plu||!p.description||!p.start_date||!p.end_date)return alert("PLU, description and dates are required");let id=$("programId").value,res=id?await S.from("rebate_programs").update(p).eq("id",id):await S.from("rebate_programs").insert(p);if(res.error)return alert(res.error.message);$("programDlg").close();await loadPrograms()}
window.deleteProgram=async id=>{let p=programs.find(x=>x.id===id);if(!confirm(`Delete PLU ${p.plu}?`))return;let {error}=await S.from("rebate_programs").delete().eq("id",id);if(error)return alert(error.message);await loadPrograms()}

function safeSheetName(name){
  return String(name||"Sheet").replace(/[\\/*?:[\]]/g,"_").slice(0,31);
}
function compactName(v){
  return String(v||"").trim().replace(/[^A-Za-z0-9]+/g,"").slice(0,16) || "Program";
}
function monthYear(period){
  if(!period) return "Program";
  const d = new Date(period.start_date + "T00:00:00");
  return d.toLocaleDateString("en-US",{month:"short",year:"numeric"});
}
function fullMonthYear(period){
  if(!period) return "PROGRAM";
  const d = new Date(period.start_date + "T00:00:00");
  return d.toLocaleDateString("en-US",{month:"long",year:"numeric"}).toUpperCase();
}
function excelDate(v){
  if(!v) return "";
  const [y,m,d]=v.split("-");
  return `${m}/${d}/${y}`;
}
function addReportHeader(ws, period){
  ws.mergeCells("A1:D3");
  ws.getCell("A1").value = "TC'S LIQUOR\nYORKVILLE, IL";
  ws.getCell("A1").alignment = {vertical:"middle",horizontal:"center",wrapText:true};
  ws.getCell("A1").font = {bold:true,size:18,color:{argb:"FF8A1538"}};
  ws.getCell("A1").fill = {type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2EF"}};

  ws.mergeCells("E1:L3");
  ws.getCell("E1").value = "Cross Merchandising Redemption Report";
  ws.getCell("E1").font = {bold:true,size:24,color:{argb:"FFFFFFFF"}};
  ws.getCell("E1").alignment = {vertical:"middle",horizontal:"center"};
  ws.getCell("E1").fill = {type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};

  ws.mergeCells("A4:B4"); ws.getCell("A4").value = "TC's Liquor";
  ws.mergeCells("A5:B5"); ws.getCell("A5").value = "1955 South Bridge Street";
  ws.mergeCells("A6:B6"); ws.getCell("A6").value = "Yorkville, IL 60560";
  ws.mergeCells("C4:D4"); ws.getCell("C4").value = "Phone: (331) 207-8942";
  ws.mergeCells("C5:D5"); ws.getCell("C5").value = "Email: TcLiquorYorkville@gmail.com";
  for(let r=4;r<=6;r++) for(let c=1;c<=4;c++) ws.getCell(r,c).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2EF"}};

  ws.mergeCells("E4:L6");
  ws.getCell("E4").value = `${fullMonthYear(period)} PROGRAM`;
  ws.getCell("E4").font = {bold:true,size:20,color:{argb:"FFFFFFFF"}};
  ws.getCell("E4").alignment = {vertical:"middle",horizontal:"center"};
  ws.getCell("E4").fill = {type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};

  [1,2,3].forEach(r=>ws.getRow(r).height=25);
  [4,5,6].forEach(r=>ws.getRow(r).height=22);
}
function styleHeaderRow(row){
  row.eachCell(cell=>{
    cell.font={bold:true,color:{argb:"FFFFFFFF"}};
    cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};
    cell.alignment={vertical:"middle",horizontal:"center",wrapText:true};
    cell.border={top:{style:"thin",color:{argb:"FFB7D6D2"}},left:{style:"thin",color:{argb:"FFB7D6D2"}},bottom:{style:"thin",color:{argb:"FFB7D6D2"}},right:{style:"thin",color:{argb:"FFB7D6D2"}}};
  });
}
function borderRange(ws, fromRow, toRow, fromCol, toCol){
  for(let r=fromRow;r<=toRow;r++) for(let c=fromCol;c<=toCol;c++){
    ws.getCell(r,c).border={top:{style:"thin",color:{argb:"FFB7D6D2"}},left:{style:"thin",color:{argb:"FFB7D6D2"}},bottom:{style:"thin",color:{argb:"FFB7D6D2"}},right:{style:"thin",color:{argb:"FFB7D6D2"}}};
  }
}
function addSummarySheet(wb, period){
  const name=`Rebate Summary ${monthYear(period)}`;
  const ws=wb.addWorksheet(safeSheetName(name),{views:[{state:"frozen",ySplit:13}]});
  addReportHeader(ws,period);

  const totals=programs.reduce((a,p)=>{const c=calc(p);a.qty+=+p.qty_sold||0;a.sales+=c.sales;a.qual+=c.qual;a.due+=c.due;return a},{qty:0,sales:0,qual:0,due:0});

  ws.mergeCells("A8:D8"); ws.getCell("A8").value="REBATE SUMMARY";
  ws.getCell("A8").font={bold:true,color:{argb:"FFFFFFFF"}};
  ws.getCell("A8").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};

  const metrics=[
    ["Total Programs",programs.length],
    ["Total Qty Sold",totals.qty],
    ["Total Sales",totals.sales],
    ["Total Qualifying Rebates",totals.qual],
    ["TOTAL REBATE DUE FROM SUPPLIER",totals.due]
  ];
  metrics.forEach((m,i)=>{
    const r=9+i; ws.mergeCells(r,1,r,3); ws.getCell(r,1).value=m[0]; ws.getCell(r,4).value=m[1];
    ws.getCell(r,1).font={bold:i===4}; ws.getCell(r,4).font={bold:true,size:i===4?16:11};
    if(i===2||i===4) ws.getCell(r,4).numFmt='$#,##0.00';
    if(i===4){for(let c=1;c<=4;c++){ws.getCell(r,c).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0B7A46"}};ws.getCell(r,c).font={bold:true,color:{argb:"FFFFFFFF"},size:c===4?16:11};}}
  });
  borderRange(ws,8,13,1,4);

  ws.mergeCells("F8:L8"); ws.getCell("F8").value="Notes";
  ws.getCell("F8").font={bold:true}; ws.getCell("F8").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2EF"}};
  ws.mergeCells("F9:L13"); borderRange(ws,8,13,6,12);

  ws.mergeCells("A15:L15"); ws.getCell("A15").value="REBATE SUMMARY DETAILS";
  ws.getCell("A15").font={bold:true,color:{argb:"FFFFFFFF"}};
  ws.getCell("A15").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};

  const headers=["PLU","Scan Program","Description","Size / Pack","Units Required","Rebate Amount","Start Date","End Date","Qty Sold","Sales Total","Qualifying Rebates","Total Rebate Due"];
  const hr=ws.getRow(16); headers.forEach((h,i)=>hr.getCell(i+1).value=h); styleHeaderRow(hr); hr.height=34;

  programs.slice().sort((a,b)=>String(a.plu).localeCompare(String(b.plu),undefined,{numeric:true})).forEach((p,i)=>{
    const c=calc(p),r=17+i;
    const vals=[p.plu,p.scan_program||"",p.description,p.size_pack||"",+p.units_required,+p.rebate_amount,excelDate(p.start_date),excelDate(p.end_date),+p.qty_sold,c.sales,c.qual,c.due];
    vals.forEach((v,j)=>ws.getCell(r,j+1).value=v);
    ws.getCell(r,6).numFmt='$#,##0.00'; ws.getCell(r,10).numFmt='$#,##0.00'; ws.getCell(r,12).numFmt='$#,##0.00';
    ws.getCell(r,12).font={bold:true,color:{argb:"FF087A3E"}};
  });
  const tr=17+programs.length;
  ws.getCell(tr,8).value="TOTALS"; ws.getCell(tr,9).value=totals.qty; ws.getCell(tr,10).value=totals.sales; ws.getCell(tr,11).value=totals.qual; ws.getCell(tr,12).value=totals.due;
  for(let c=1;c<=12;c++){ws.getCell(tr,c).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2EF"}};ws.getCell(tr,c).font={bold:true};}
  ws.getCell(tr,10).numFmt='$#,##0.00'; ws.getCell(tr,12).numFmt='$#,##0.00'; ws.getCell(tr,12).font={bold:true,color:{argb:"FF087A3E"}};
  borderRange(ws,16,tr,1,12);

  [10,28,30,16,14,14,13,13,12,15,16,17].forEach((w,i)=>ws.getColumn(i+1).width=w);
  ws.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9};
  ws.headerFooter.oddFooter="Page &P of &N";
  return ws;
}
function addPLUSheet(wb,p,period){
  const c=calc(p);
  const tab=`${p.plu}_${monthYear(period).replace(" ","")}`;
  const ws=wb.addWorksheet(safeSheetName(tab));
  addReportHeader(ws,period);

  ws.mergeCells("A8:F8"); ws.getCell("A8").value=`PLU ${p.plu} - ${p.description}`;
  ws.getCell("A8").font={bold:true,color:{argb:"FFFFFFFF"},size:14};
  ws.getCell("A8").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};

  const info=[
    ["PLU",p.plu],["Description",p.description],["Size / Pack",p.size_pack||""],["Scan Program",p.scan_program||""],
    ["Rebate Amount",+p.rebate_amount],["Program Period",`${excelDate(p.start_date)} - ${excelDate(p.end_date)}`]
  ];
  info.forEach((x,i)=>{let r=9+i;ws.getCell(r,1).value=x[0];ws.getCell(r,1).font={bold:true};ws.getCell(r,1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFE0F2EF"}};ws.mergeCells(r,2,r,6);ws.getCell(r,2).value=x[1];});
  ws.getCell(13,2).numFmt='$#,##0.00'; borderRange(ws,9,14,1,6);

  const hdr=["Date / Period","Product Code (PLU)","Qty Sold","Item Price (Each)","Sales Price (Total)","Notes"];
  const hrow=ws.getRow(16);hdr.forEach((h,i)=>hrow.getCell(i+1).value=h);styleHeaderRow(hrow);
  const sr=17; [period.name,p.plu,+p.qty_sold,+p.item_price,c.sales,p.notes||""].forEach((v,i)=>ws.getCell(sr,i+1).value=v);
  ws.getCell(sr,4).numFmt='$#,##0.00';ws.getCell(sr,5).numFmt='$#,##0.00';borderRange(ws,16,17,1,6);

  ws.mergeCells("A19:C19");ws.getCell("A19").value="SALES & REBATE SUMMARY";ws.getCell("A19").font={bold:true,color:{argb:"FFFFFFFF"}};ws.getCell("A19").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0F6D73"}};
  const sum=[["Total Qty Sold",+p.qty_sold],["Units Required per Rebate",+p.units_required],["Qualifying Rebates Earned",c.qual],["Rebate Amount per Qualifying Purchase",+p.rebate_amount],["TOTAL REBATE DUE",c.due]];
  sum.forEach((x,i)=>{let r=20+i;ws.mergeCells(r,1,r,2);ws.getCell(r,1).value=x[0];ws.getCell(r,3).value=x[1];if(i>=3)ws.getCell(r,3).numFmt='$#,##0.00';if(i===4){for(let col=1;col<=3;col++){ws.getCell(r,col).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0B7A46"}};ws.getCell(r,col).font={bold:true,color:{argb:"FFFFFFFF"},size:col===3?15:11};}}});
  borderRange(ws,19,24,1,3);

  [20,28,14,18,20,32].forEach((w,i)=>ws.getColumn(i+1).width=w);
  ws.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:1,paperSize:9};
}
$("export").onclick=async()=>{
  if(!programs.length)return alert("No programs to export");
  const period=periods.find(x=>x.id===pid);
  const wb=new ExcelJS.Workbook();
  wb.creator="Rebate Tracker";
  wb.created=new Date();
  addSummarySheet(wb,period);
  programs.slice().sort((a,b)=>String(a.plu).localeCompare(String(b.plu),undefined,{numeric:true})).forEach(p=>addPLUSheet(wb,p,period));
  const buffer=await wb.xlsx.writeBuffer();
  const filename=`Rebate_Summary_${monthYear(period).replace(" ","_")}.xlsx`;
  saveAs(new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),filename);
};
boot();
