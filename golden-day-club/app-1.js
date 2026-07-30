'use strict';
const STORE_KEY='goldenDayClubData_v4',OLD_STORE_KEY='goldenDayClubData_v3',LEGACY_STORE_KEY='goldenDayClubData_v2',SESSION_KEY='goldenDayClubSession';
const makeMemoryStore=()=>{const data=new Map();return{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()}};
const safeStorage=name=>{try{const s=window[name];s.getItem('__gdc_probe__');return s}catch{return makeMemoryStore()}};
const localStore=safeStorage('localStorage'),sessionStore=safeStorage('sessionStorage');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const localDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const localTime=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const now=new Date(),today=localDate(now),currentTime=localTime(now);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const addDuration=(date,time,value,unit)=>{const d=new Date(`${date}T${time||'00:00'}:00`),v=Number(value||0);if(unit==='hours')d.setHours(d.getHours()+v);if(unit==='days')d.setDate(d.getDate()+v);if(unit==='weeks')d.setDate(d.getDate()+v*7);if(unit==='months')d.setMonth(d.getMonth()+v);return{date:localDate(d),time:localTime(d)}};
const diffDays=(a,b)=>Math.max(1,Math.ceil((new Date(`${b}T12:00:00`)-new Date(`${a}T12:00:00`))/86400000));
const dateTimeValue=(date,time='23:59')=>new Date(`${date}T${time}:00`).getTime();
const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const titleCase=s=>String(s||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

function seedDB(){
  const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return localDate(d)}, ahead=n=>{const d=new Date();d.setDate(d.getDate()+n);return localDate(d)};
  return{version:4,seeded:true,settings:{currency:'USD',defaultInterestRate:10,defaultFeeType:'flat',defaultFeeValue:3,defaultDurationValue:1,defaultDurationUnit:'days',openingCapital:3000},users:[
    {id:'u-admin',name:'System Administrator',username:'admin',password:'golden123',role:'admin',active:true,assignedGroupIds:[]},
    {id:'u-lender',name:'George Lender',username:'lender',password:'1234',role:'lender',active:true,assignedGroupIds:[]},
    {id:'u-mary',name:'Mary Atieno',username:'mary',password:'1234',role:'manager',active:true,assignedGroupIds:['g-market','g-women']}
  ],groups:[
    {id:'g-market',name:'Sunrise Market Traders',contact:'Jane Wanjiku'},
    {id:'g-boda',name:'Golden Riders Group',contact:'Peter Otieno'},
    {id:'g-women',name:'Hope Women Circle',contact:'Lucy Achieng'}
  ],borrowers:[
    {id:'b-anne',name:'Anne Njeri',phone:'+1 214-555-0142',groupId:'g-market'},
    {id:'b-david',name:'David Ouma',phone:'+1 214-555-0186',groupId:'g-boda'},
    {id:'b-ruth',name:'Ruth Moraa',phone:'+1 469-555-0114',groupId:'g-women'},
    {id:'b-peter',name:'Peter Kamau',phone:'+1 972-555-0173',groupId:'g-market'},
    {id:'b-grace',name:'Grace Akinyi',phone:'+1 682-555-0138',groupId:'g-women'},
    {id:'b-sam',name:'Samuel Kiptoo',phone:'+1 817-555-0192',groupId:'g-boda'}
  ],loans:[
    {id:'l1',borrowerId:'b-anne',principal:100,interestRate:10,interestAmount:10,feeType:'flat',feeValue:2,feeAmount:2,durationValue:12,durationUnit:'hours',dateGiven:ago(1),timeGiven:'08:00',dueDate:ago(1),dueTime:'20:00',notes:'Evening stock loan',createdBy:'u-lender',createdAt:`${ago(1)}T08:00`,payments:[],adjustments:[]},
    {id:'l2',borrowerId:'b-david',principal:250,interestRate:8,interestAmount:20,feeType:'percent',feeValue:2,feeAmount:5,durationValue:1,durationUnit:'weeks',dateGiven:ago(5),timeGiven:'09:15',dueDate:ahead(2),dueTime:'18:00',notes:'One-week fuel and repair loan',createdBy:'u-admin',createdAt:`${ago(5)}T09:15`,payments:[{id:'p1',amount:100,date:ago(1),time:'17:40',notes:'Partial cash payment',recordedBy:'u-mary'}],adjustments:[]},
    {id:'l3',borrowerId:'b-ruth',principal:150,interestRate:10,interestAmount:15,feeType:'flat',feeValue:5,feeAmount:5,durationValue:1,durationUnit:'weeks',dateGiven:ago(8),timeGiven:'10:00',dueDate:ago(1),dueTime:'18:00',notes:'Weekly produce loan',createdBy:'u-admin',createdAt:`${ago(8)}T10:00`,payments:[{id:'p2',amount:50,date:ago(2),time:'12:30',notes:'Partial transfer',recordedBy:'u-mary'}],adjustments:[]},
    {id:'l4',borrowerId:'b-peter',principal:80,interestRate:10,interestAmount:8,feeType:'flat',feeValue:2,feeAmount:2,durationValue:10,durationUnit:'hours',dateGiven:ago(3),timeGiven:'08:00',dueDate:ago(3),dueTime:'18:00',notes:'Same-day market float',createdBy:'u-lender',createdAt:`${ago(3)}T08:00`,payments:[{id:'p3',amount:90,date:ago(3),time:'17:10',notes:'Paid in full',recordedBy:'u-mary'}],adjustments:[]},
    {id:'l5',borrowerId:'b-grace',principal:300,interestRate:10,interestAmount:30,feeType:'percent',feeValue:1,feeAmount:3,durationValue:1,durationUnit:'weeks',dateGiven:ago(2),timeGiven:'11:30',dueDate:ahead(5),dueTime:'18:00',notes:'Household goods stock',createdBy:'u-admin',createdAt:`${ago(2)}T11:30`,payments:[],adjustments:[]},
    {id:'l6',borrowerId:'b-sam',principal:120,interestRate:7.5,interestAmount:9,feeType:'flat',feeValue:3,feeAmount:3,durationValue:8,durationUnit:'hours',dateGiven:today,timeGiven:'09:00',dueDate:today,dueTime:'19:00',notes:'Return by 7 PM',createdBy:'u-lender',createdAt:`${today}T09:00`,payments:[],adjustments:[]}
  ]};
}

function migrateLegacy(old){
  const fresh=seedDB(),settings={...fresh.settings,...(old.settings||{})};
  const loans=(old.loans||[]).map(l=>{const principal=Number(l.principal||0),profit=Number(l.profit||0),days=diffDays(l.dateGiven,l.dueDate);return{...l,interestRate:Number(l.interestRate??(principal?profit/principal*100:0)),interestAmount:Number(l.interestAmount??profit),feeType:l.feeType||'flat',feeValue:Number(l.feeValue||0),feeAmount:Number(l.feeAmount||0),durationValue:Number(l.durationValue||days),durationUnit:l.durationUnit||'days',timeGiven:l.timeGiven||'09:00',dueTime:l.dueTime||'18:00',createdAt:l.createdAt||`${l.dateGiven}T${l.timeGiven||'09:00'}`,adjustments:l.adjustments||[],payments:(l.payments||[]).map(p=>({...p,time:p.time||'12:00'}))}});
  const mappedUsers=(old.users||[]).map(u=>({...u,role:u.role==='collector'?'manager':u.role==='viewer'?'manager':u.role,assignedGroupIds:u.assignedGroupIds||(u.username==='mary'?['g-market','g-women']:[])}));
  if(!mappedUsers.some(u=>u.role==='lender'))mappedUsers.push(fresh.users.find(u=>u.role==='lender'));
  return{version:4,seeded:old.seeded!==false,settings,users:mappedUsers.length?mappedUsers:fresh.users,groups:old.groups||[],borrowers:old.borrowers||[],loans};
}
let db;
try{const v4=localStore.getItem(STORE_KEY),v3=localStore.getItem(OLD_STORE_KEY),v2=localStore.getItem(LEGACY_STORE_KEY);db=v4?JSON.parse(v4):v3?migrateLegacy(JSON.parse(v3)):v2?migrateLegacy(JSON.parse(v2)):seedDB()}catch{db=seedDB()}
function normalizeDB(){const d=seedDB();db.version=4;db.settings={...d.settings,...(db.settings||{})};db.users=(db.users||d.users).map(u=>({...u,role:u.role==='collector'?'manager':u.role==='viewer'?'manager':u.role,assignedGroupIds:u.assignedGroupIds||[]}));if(!db.users.some(u=>u.role==='lender'))db.users.push(d.users.find(u=>u.role==='lender'));db.groups=db.groups||[];db.borrowers=db.borrowers||[];db.loans=(db.loans||[]).map(l=>{const principal=Number(l.principal||0),legacyProfit=Number(l.profit||0);return{...l,interestRate:Number(l.interestRate??(principal?legacyProfit/principal*100:0)),interestAmount:Number(l.interestAmount??legacyProfit),feeType:l.feeType||'flat',feeValue:Number(l.feeValue||0),feeAmount:Number(l.feeAmount||0),durationValue:Number(l.durationValue||diffDays(l.dateGiven,l.dueDate)),durationUnit:l.durationUnit||'days',timeGiven:l.timeGiven||'09:00',dueTime:l.dueTime||'18:00',createdAt:l.createdAt||`${l.dateGiven}T${l.timeGiven||'09:00'}`,payments:(l.payments||[]).map(p=>({...p,time:p.time||'12:00'})),adjustments:l.adjustments||[]}})}
normalizeDB();localStore.setItem(STORE_KEY,JSON.stringify(db));
let currentUser=null;
const save=()=>{localStore.setItem(STORE_KEY,JSON.stringify(db));render()};
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:db.settings.currency||'USD',maximumFractionDigits:2}).format(Number(n||0));
const pct=n=>`${Number(n||0).toFixed(1).replace(/\.0$/,'')}%`;
const getBorrower=id=>db.borrowers.find(x=>x.id===id),getGroup=id=>db.groups.find(x=>x.id===id),getUser=id=>db.users.find(x=>x.id===id);
const totalPaid=l=>(l.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0);
const totalDue=l=>Number(l.principal||0)+Number(l.interestAmount||0)+Number(l.feeAmount||0);
const allocation=l=>{let rem=totalPaid(l);const feePaid=Math.min(rem,Number(l.feeAmount||0));rem-=feePaid;const interestPaid=Math.min(rem,Number(l.interestAmount||0));rem-=interestPaid;const principalPaid=Math.min(rem,Number(l.principal||0));return{feePaid,interestPaid,principalPaid,feeOutstanding:Math.max(0,Number(l.feeAmount||0)-feePaid),interestOutstanding:Math.max(0,Number(l.interestAmount||0)-interestPaid),principalOutstanding:Math.max(0,Number(l.principal||0)-principalPaid)}};
const balance=l=>Math.max(0,totalDue(l)-totalPaid(l));
const loanStatus=l=>{if(balance(l)<=.005)return'paid';const due=dateTimeValue(l.dueDate,l.dueTime);const n=Date.now();if(due<n)return'overdue';if(l.dueDate===today)return'due';return'active'};
const isAdmin=()=>currentUser?.role==='admin',isLender=()=>currentUser?.role==='lender',isManager=()=>currentUser?.role==='manager';
const canOriginate=()=>isAdmin()||isLender(),canCollect=()=>isAdmin()||isLender()||isManager(),canManagePeople=()=>isAdmin()||isLender();
const scopeGroupIds=()=>isManager()?new Set(currentUser.assignedGroupIds||[]):new Set(db.groups.map(g=>g.id));
const scopedGroups=()=>db.groups.filter(g=>scopeGroupIds().has(g.id));
const scopedBorrowers=()=>db.borrowers.filter(b=>scopeGroupIds().has(b.groupId));
const scopedLoans=()=>db.loans.filter(l=>{const b=getBorrower(l.borrowerId);return b&&scopeGroupIds().has(b.groupId)});
const canAccessLoan=l=>scopedLoans().some(x=>x.id===l.id);
const settlementDate=l=>{if(balance(l)>.005)return null;let running=0;for(const p of [...l.payments].sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))){running+=Number(p.amount);if(running+0.005>=totalDue(l))return `${p.date}T${p.time||'23:59'}`}return null};
const calcTerms=(principal,rate,feeType,feeValue)=>{principal=Number(principal||0);rate=Number(rate||0);feeValue=Number(feeValue||0);const interest=principal*rate/100,fee=feeType==='percent'?principal*feeValue/100:feeValue;return{interest:Number(interest.toFixed(2)),fee:Number(fee.toFixed(2)),total:Number((principal+interest+fee).toFixed(2))}};
