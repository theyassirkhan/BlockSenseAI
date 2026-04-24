import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { writeFileSync } from "fs";

const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
const W = 210;
const H = 297;
const M = 16; // margin

// ─── Colour palette ───────────────────────────────────────────────
const C = {
  bg:        [8,   6,  20],   // deep navy
  card:      [18,  14,  38],  // card bg
  cardBdr:   [50,  40,  90],  // card border sim
  purple:    [139, 92, 246],
  purpleD:   [109, 40, 217],
  blue:      [59, 130, 246],
  cyan:      [34, 211, 238],
  green:     [34, 197, 94],
  orange:    [249, 115, 22],
  red:       [239, 68,  68],
  yellow:    [234, 179, 8],
  white:     [255, 255, 255],
  gray:      [160, 160, 185],
  grayD:     [100,  95, 130],
};

// ─── Helpers ──────────────────────────────────────────────────────
function fill(r,g,b)  { doc.setFillColor(r,g,b); }
function stroke(r,g,b){ doc.setDrawColor(r,g,b); }
function txt(r,g,b)   { doc.setTextColor(r,g,b); }
function font(f,s,w)  { doc.setFont(f ?? "helvetica", w ?? "normal"); if(s) doc.setFontSize(s); }

function rect(x,y,w,h,style="F",rx=0){ doc.roundedRect(x,y,w,h,rx,rx,style); }
function bg(){ fill(...C.bg); rect(0,0,W,H,"F"); }

function gradBar(x,y,w,h,colorA,colorB){
  // simulate gradient with 30 thin slices
  for(let i=0;i<30;i++){
    const t=i/30;
    const r=Math.round(colorA[0]+(colorB[0]-colorA[0])*t);
    const g=Math.round(colorA[1]+(colorB[1]-colorA[1])*t);
    const b=Math.round(colorA[2]+(colorB[2]-colorA[2])*t);
    fill(r,g,b);
    doc.rect(x+w*i/30,y,w/30+0.5,h,"F");
  }
}

function pill(x,y,w,h,color,label,labelColor){
  fill(...color); rect(x,y,w,h,"F",h/2);
  txt(...(labelColor??C.white)); font(null,7,"bold");
  doc.text(label, x+w/2, y+h/2+2.5, {align:"center"});
}

function screenMock(x,y,w,h,title,items,accentColor){
  // phone bezel
  fill(...C.card); rect(x,y,w,h,"F",4);
  stroke(...C.cardBdr); doc.setLineWidth(0.3); rect(x,y,w,h,"S",4);
  // status bar
  fill(...accentColor); rect(x,y,w,7,"F",4);
  doc.setFillColor(accentColor[0],accentColor[1],accentColor[2],0.05);
  // title
  txt(...C.white); font(null,7,"bold");
  doc.text(title, x+w/2, y+5, {align:"center"});
  // items
  let iy = y+11;
  items.forEach(({label,val,bar,color})=>{
    if(bar){
      fill(...C.card); rect(x+3,iy,w-6,5,"F",2);
      fill(...(color??accentColor)); rect(x+3,iy,Math.max(2,(w-6)*bar),5,"F",2);
      txt(...C.white); font(null,5.5,"normal");
      doc.text(label,x+5,iy+3.5);
      doc.text(val,x+w-5,iy+3.5,{align:"right"});
    } else {
      txt(...C.grayD); font(null,5.5,"normal");
      doc.text(label,x+4,iy+3);
      txt(...C.white); font(null,6,"bold");
      doc.text(String(val),x+w-4,iy+3,{align:"right"});
      fill(...C.cardBdr); rect(x+3,iy+4.5,w-6,0.2,"F");
    }
    iy+=7;
  });
}

function statBox(x,y,w,h,icon,value,label,color){
  fill(...C.card); rect(x,y,w,h,"F",3);
  // accent left bar
  fill(...color); rect(x,y,2,h,"F",1);
  txt(...color); font(null,16,"bold");
  doc.text(icon, x+6, y+h/2+3);
  txt(...C.white); font(null,10,"bold");
  doc.text(value, x+22, y+h/2+1);
  txt(...C.gray); font(null,6,"normal");
  doc.text(label, x+22, y+h/2+6);
}

function sectionHeader(y,title,subtitle,color){
  gradBar(0,y,W,14,C.bg,[...color,0.3].slice(0,3));
  txt(...color); font(null,13,"bold");
  doc.text(title, M, y+9.5);
  if(subtitle){
    txt(...C.gray); font(null,7.5,"normal");
    doc.text(subtitle, M+doc.getTextWidth(title)+4, y+9.5);
  }
}

// ══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ══════════════════════════════════════════════════════════════════
bg();

// Full bleed gradient header
gradBar(0,0,W,110,C.bg,C.purpleD);
// decorative circles
doc.setFillColor(139,92,246,0.08); doc.circle(W-20,20,55,"F");
doc.setFillColor(59,130,246,0.06); doc.circle(W-5,80,40,"F");
doc.setFillColor(34,211,238,0.05); doc.circle(30,100,30,"F");

// Logo badge
fill(...C.purple); rect(M,18,18,18,"F",3);
txt(...C.white); font(null,12,"bold"); doc.text("BS",M+9,30,{align:"center"});

// Headline
txt(...C.white); font(null,28,"bold");
doc.text("BlockSense AI", M+24, 29);
txt(...C.cyan); font(null,10,"normal");
doc.text("Smart Society Management Platform", M+24, 37);

// Tagline
txt(...C.white); font(null,16,"bold");
const tag = "Your Society. Smarter. Safer. Simpler.";
doc.text(tag, W/2, 60, {align:"center"});
txt(...C.gray); font(null,9,"normal");
const sub = "An end-to-end digital platform connecting residents, RWA managers,\nguards, and vendors — all in one intelligent app.";
doc.text(sub, W/2, 70, {align:"center", lineHeightFactor:1.5});

// Three hero stat pills
const hpills = [
  {label:"Residents Connected", val:"500+", color:C.purple},
  {label:"Features Built-in",   val:"30+",  color:C.cyan},
  {label:"Time Saved / Month",  val:"40 hrs",color:C.green},
];
let hx = M;
hpills.forEach(p=>{
  fill(...p.color.map(v=>v*0.15)); rect(hx,83,55,14,"F",3);
  fill(...p.color); rect(hx,83,2,14,"F",3);
  txt(...p.color); font(null,11,"bold"); doc.text(p.val,hx+8,91);
  txt(...C.gray); font(null,6,"normal"); doc.text(p.label,hx+8,96);
  hx+=58;
});

// ── Resident screen mock ──
screenMock(M, 108, 52, 72, "Resident Portal", [
  {label:"Pending Dues", val:"₹4,200"},
  {label:"Water Level",  val:"78%", bar:0.78, color:C.blue},
  {label:"Active Alerts",val:"2 warnings"},
  {label:"Visitors Today",val:"3 expected"},
  {label:"Service Req.", val:"1 open"},
], C.purple);

// ── RWA screen mock ──
screenMock(M+58, 108, 52, 72, "RWA Dashboard", [
  {label:"Total Residents",val:"248 units"},
  {label:"Collection",val:"₹1.8L", bar:0.72, color:C.green},
  {label:"Open Requests",val:"7 pending"},
  {label:"Staff on Duty",val:"12 active"},
  {label:"Alerts",val:"3 unread"},
], C.blue);

// ── Guard screen mock ──
screenMock(M+116, 108, 52, 72, "Guard Post", [
  {label:"Inside Now",val:"14 visitors"},
  {label:"Today Total",val:"31 entries"},
  {label:"Pass Scan",val:"Instant verify"},
  {label:"Walk-in",val:"Quick log"},
  {label:"Photo Capture",val:"Evidence"},
], C.cyan);

// Quote strip
fill(...C.purple.map(v=>Math.round(v*0.15))); rect(0,186,W,18,"F");
txt(...C.purple); font(null,9,"bold");
doc.text('"', M, 198);
txt(...C.white); font(null,8.5,"normal");
doc.text("Designed for Indian residential societies — from single towers to large gated communities.", M+5, 198);

// Bottom section: For whom
txt(...C.white); font(null,10,"bold"); doc.text("Perfect for", M, 215);
txt(...C.gray); font(null,8,"normal"); doc.text("Apartment complexes · Gated communities · Housing societies · Township projects", M, 222);

const roles = [
  {icon:"🏠", title:"Residents",   desc:"Pay dues, track utilities,\nlog complaints, manage visitors"},
  {icon:"🏢", title:"RWA Managers",desc:"Monitor everything,\nmanage staff, generate reports"},
  {icon:"🛡️", title:"Security Guards",desc:"Log entries, verify pass codes,\nmanage walk-ins"},
  {icon:"🔧", title:"Vendors",      desc:"Receive work orders,\nupdate job status"},
];
let rx2=M;
roles.forEach(r=>{
  fill(...C.card); rect(rx2,228,42,34,"F",3);
  txt(...C.white); font(null,11,"bold"); doc.text(r.icon,rx2+21,240,{align:"center"});
  txt(...C.cyan); font(null,7,"bold"); doc.text(r.title,rx2+21,246,{align:"center"});
  txt(...C.gray); font(null,5.8,"normal"); doc.text(r.desc,rx2+21,252,{align:"center",lineHeightFactor:1.4});
  rx2+=44.5;
});

// Footer
fill(...C.card); rect(0,267,W,30,"F");
txt(...C.purple); font(null,8,"bold"); doc.text("BlockSense AI", M, 278);
txt(...C.gray); font(null,7,"normal");
doc.text("The future of society management is here.", M, 284);
txt(...C.gray); doc.text("© 2025 BlockSense AI · All Rights Reserved", W-M, 278, {align:"right"});
txt(...C.grayD); font(null,6.5,"normal");
doc.text("Available on Web & Mobile  ·  Powered by Convex + Claude AI", W-M, 284, {align:"right"});

// ══════════════════════════════════════════════════════════════════
// PAGE 2 — RESIDENT FEATURES
// ══════════════════════════════════════════════════════════════════
doc.addPage();
bg();

// Header band
gradBar(0,0,W,16,[...C.bg],[...C.purple]);
txt(...C.white); font(null,13,"bold"); doc.text("For Residents", M, 11);
txt(...C.gray); font(null,7.5,"normal"); doc.text("Everything a resident needs — in one tap", M+60, 11);

// Intro
txt(...C.gray); font(null,8,"normal");
doc.text("BlockSense gives every resident a personal portal to manage their society life — from paying maintenance dues\nto pre-registering guests, all accessible from their phone in seconds.", M, 26, {lineHeightFactor:1.5});

// ── Feature blocks (2×4 grid) ──
const resFeatures = [
  {
    icon:"💳", title:"Smart Payments",
    color:C.green,
    points:["Pay maintenance online", "See payment history", "UPI QR code checkout", "Overdue reminders"],
    mock:[{label:"March 2025",val:"₹3,500 ✓"},{label:"February",val:"₹3,500 ✓"},{label:"January",val:"₹3,500 ✓"}]
  },
  {
    icon:"💧", title:"Utility Dashboard",
    color:C.blue,
    points:["Water tank levels live", "Power & gas monitoring", "Daily consumption stats", "Shortage alerts"],
    mock:[{label:"Water Tank A", val:"82%", bar:0.82,color:C.blue},{label:"Power Today",val:"12 kWh",bar:0.5,color:C.yellow},{label:"Gas Pressure",val:"Normal",bar:0.9,color:C.green}]
  },
  {
    icon:"👥", title:"Visitor Pre-registration",
    color:C.cyan,
    points:["Generate 6-digit pass code", "Guard verifies at gate", "WhatsApp share link", "See visitor log"],
    mock:[{label:"Priya Sharma",val:"Pass: 472819"},{label:"Delivery - Zomato",val:"Pass: 381047"},{label:"Cousin Visit",val:"Pass: 209341"}]
  },
  {
    icon:"🚗", title:"Vehicle Management",
    color:C.orange,
    points:["Register car / bike / other", "Assign parking slot", "Society record kept", "Easy update / remove"],
    mock:[{label:"KA05MN2341",val:"Car · Slot B4"},{label:"KA01AB9988",val:"Bike · Open"},{label:"Add vehicle",val:"+ Register"}]
  },
  {
    icon:"📋", title:"Service Requests",
    color:C.purple,
    points:["Submit maintenance requests", "Track status live", "Get closure notification", "Attach photos"],
    mock:[{label:"Plumbing - Kitchen",val:"In Progress"},{label:"Lift Issue",val:"Resolved ✓"},{label:"Painting",val:"Scheduled"}]
  },
  {
    icon:"⚠️", title:"Complaints Portal",
    color:C.red,
    points:["File anonymous complaints", "Choose severity level", "Track RWA response", "Escalation option"],
    mock:[{label:"Noise - Block B",val:"Under Review"},{label:"Parking violation",val:"Resolved ✓"},{label:"Billing dispute",val:"Open"}]
  },
  {
    icon:"📢", title:"Notices & Broadcasts",
    color:C.yellow,
    points:["Society announcements", "Emergency broadcasts", "Event notifications", "Never miss updates"],
    mock:[{label:"AGM Meeting",val:"15 Apr · 6 PM"},{label:"Water Cut",val:"Tomorrow 9 AM"},{label:"Diwali Event",val:"20 Apr"}]
  },
  {
    icon:"🤖", title:"AI Chat Assistant",
    color:C.purple,
    points:["Ask anything in plain English", "Live context: dues, water, alerts", "Instant smart answers", "Available 24 × 7"],
    mock:[{label:"'My dues?'",val:"₹4,200 pending"},{label:"'Water level?'",val:"Tank A: 78%"},{label:"'Any alerts?'",val:"2 active"}]
  },
];

let gx=M, gy=38, gi=0;
resFeatures.forEach(f=>{
  const bw=84, bh=58;
  fill(...C.card); rect(gx,gy,bw,bh,"F",3);
  fill(...f.color.map(v=>Math.round(v*0.18))); rect(gx,gy,bw,10,"F",3);
  txt(...f.color); font(null,10,"bold"); doc.text(f.icon+" "+f.title, gx+4, gy+7.5);
  // points
  f.points.forEach((p,pi)=>{
    txt(...C.gray); font(null,6,"normal");
    fill(...f.color); doc.circle(gx+5, gy+15+pi*7, 1,"F");
    doc.text(p, gx+8, gy+16.5+pi*7);
  });
  gi++;
  if(gi%2===0){ gx=M; gy+=62; } else { gx+=88; }
});

// bottom promo
fill(...C.purple.map(v=>Math.round(v*0.2))); rect(M,gy+4,W-2*M,18,"F",3);
txt(...C.white); font(null,8.5,"bold"); doc.text("✦  One app. Every resident need. Zero paperwork.", W/2, gy+14, {align:"center"});

// ══════════════════════════════════════════════════════════════════
// PAGE 3 — RWA MANAGEMENT
// ══════════════════════════════════════════════════════════════════
doc.addPage();
bg();

gradBar(0,0,W,16,C.bg,C.blue);
txt(...C.white); font(null,13,"bold"); doc.text("For RWA Managers", M, 11);
txt(...C.gray); font(null,7.5,"normal"); doc.text("Total visibility. Zero guesswork.", M+73, 11);

txt(...C.gray); font(null,8,"normal");
doc.text("BlockSense gives RWA committees a real-time command centre — manage residents, staff, utilities,\npayments, and complaints from a single dashboard with AI-powered insights.", M, 26, {lineHeightFactor:1.5});

// Dashboard overview mock (wide)
fill(...C.card); rect(M,34,W-2*M,52,"F",3);
gradBar(M,34,W-2*M,10,C.card,C.blue);
txt(...C.white); font(null,8,"bold"); doc.text("RWA Dashboard — Live Overview", M+6, 41);
txt(...C.grayD); font(null,6,"normal"); doc.text("Society: Greenview Heights  ·  Block A  ·  April 2025", W-M-4, 41,{align:"right"});

// stat cards row
const stats=[
  {v:"248",l:"Residents",c:C.purple},
  {v:"₹1.8L",l:"Collected",c:C.green},
  {v:"7",l:"Open Requests",c:C.orange},
  {v:"3",l:"Active Alerts",c:C.red},
  {v:"12",l:"Staff on Duty",c:C.cyan},
];
let sx=M+4;
stats.forEach(s=>{
  fill(...s.c.map(v=>Math.round(v*0.15))); rect(sx,46,30,16,"F",2);
  fill(...s.c); rect(sx,46,2,16,"F",1);
  txt(...s.c); font(null,10,"bold"); doc.text(s.v,sx+6,54.5);
  txt(...C.gray); font(null,5.5,"normal"); doc.text(s.l,sx+6,59);
  sx+=32.5;
});

// mini bar chart — payments
txt(...C.gray); font(null,6,"normal"); doc.text("Monthly Collection (₹)",M+6,71);
const months=["Nov","Dec","Jan","Feb","Mar","Apr"];
const vals=[0.6,0.75,0.65,0.85,0.78,0.92];
months.forEach((m,i)=>{
  const bh=vals[i]*14;
  fill(...C.blue); rect(M+8+i*13,82-bh,9,bh,"F",1);
  txt(...C.grayD); font(null,5,"normal"); doc.text(m,M+8+i*13+4.5,84,{align:"center"});
});
// collection pie simulation
txt(...C.gray); font(null,6,"normal"); doc.text("Status Split",M+100,71);
const slices=[{pct:0.72,c:C.green,l:"Paid 72%"},{pct:0.18,c:C.yellow,l:"Pending 18%"},{pct:0.1,c:C.red,l:"Overdue 10%"}];
let angle=0;
slices.forEach(s=>{
  fill(...s.c);
  doc.ellipse(M+118,77,10,8,"F"); // simplified
  txt(...C.gray); font(null,5,"normal"); doc.text("●"+s.l,M+100,76+slices.indexOf(s)*4.5);
});

// ── Feature grid ──
const rwaFeatures = [
  {icon:"🏘️",title:"Resident Management",color:C.purple,points:["Full resident directory","Flat ownership tracking","CSV bulk import","Search & filter"]},
  {icon:"👷",title:"Staff & Shifts",color:C.blue,points:["Schedule weekly shifts","Mark attendance daily","Role-based staff list","Leave management"]},
  {icon:"🔧",title:"Vendor Control",color:C.orange,points:["Vendor database","Assign work orders","Track job completion","Rating & reviews"]},
  {icon:"💰",title:"Payments Engine",color:C.green,points:["Collect maintenance dues","UPI QR generation","Defaulter tracking","Export statements"]},
  {icon:"🔔",title:"Alerts System",color:C.red,points:["Real-time utility alerts","Custom thresholds","Critical vs info tiers","Push notifications"]},
  {icon:"📡",title:"Broadcast Centre",color:C.cyan,points:["Society-wide notices","Emergency messages","Targeted by block","Delivery confirmed"]},
  {icon:"📊",title:"Reports & Analytics",color:C.yellow,points:["AI-generated narrative","Monthly PDF report","Utility KPI trends","Payment analytics"]},
  {icon:"🤝",title:"Complaints Management",color:C.red,points:["View all complaints","Respond inline","Update status","Escalation tracking"]},
];

let rgx=M, rgy=93, rgi=0;
rwaFeatures.forEach(f=>{
  const bw=84, bh=46;
  fill(...C.card); rect(rgx,rgy,bw,bh,"F",3);
  fill(...f.color.map(v=>Math.round(v*0.18))); rect(rgx,rgy,bw,9,"F",3);
  txt(...f.color); font(null,8.5,"bold"); doc.text(f.icon+" "+f.title,rgx+4,rgy+6.8);
  f.points.forEach((p,pi)=>{
    fill(...f.color); doc.circle(rgx+5,rgy+13+pi*7,1,"F");
    txt(...C.gray); font(null,5.8,"normal"); doc.text(p,rgx+8,rgy+14.5+pi*7);
  });
  rgi++;
  if(rgi%2===0){ rgx=M; rgy+=50; } else { rgx+=88; }
});

// promo strip
fill(...C.blue.map(v=>Math.round(v*0.2))); rect(M,rgy+4,W-2*M,18,"F",3);
txt(...C.white); font(null,8.5,"bold"); doc.text("✦  From 18 management modules to one unified command centre.", W/2,rgy+14,{align:"center"});

// ══════════════════════════════════════════════════════════════════
// PAGE 4 — UTILITIES + AI
// ══════════════════════════════════════════════════════════════════
doc.addPage();
bg();

gradBar(0,0,W,16,C.bg,C.cyan);
txt(...C.white); font(null,13,"bold"); doc.text("Smart Utilities & AI Intelligence", M, 11);
txt(...C.gray); font(null,7.5,"normal"); doc.text("Powered by Claude AI", M+92, 11);

txt(...C.gray); font(null,8,"normal");
doc.text("BlockSense monitors every utility in your society — water, power, gas, sewage, waste, garbage — in real time,\nwith AI that predicts problems before they happen.", M, 26, {lineHeightFactor:1.5});

// Utility tiles row
const utils=[
  {icon:"💧",label:"Water",   color:C.blue,   stats:"Tank levels · Daily KL · Tanker orders"},
  {icon:"⚡",label:"Power",   color:C.yellow,  stats:"kWh usage · Peak load · Outage alerts"},
  {icon:"🔥",label:"Gas",     color:C.green,   stats:"Pressure · Daily m³ · Leak detection"},
  {icon:"🌊",label:"Sewage",  color:C.orange,  stats:"Flow rate · Block alerts · Maintenance"},
  {icon:"♻️",label:"Waste",   color:C.purple,  stats:"Dry/wet split · Block leaderboard · Logs"},
  {icon:"🚛",label:"Garbage", color:C.grayD,   stats:"Collection days · Missed pickups · Alerts"},
];
let ux=M;
utils.forEach(u=>{
  fill(...u.color.map(v=>Math.round(v*0.15))); rect(ux,34,27,30,"F",3);
  fill(...u.color); rect(ux,34,27,6,"F",3);
  txt(...C.white); font(null,11,"bold"); doc.text(u.icon,ux+13.5,41,{align:"center"});
  txt(...u.color); font(null,6.5,"bold"); doc.text(u.label,ux+13.5,48,{align:"center"});
  txt(...C.grayD); font(null,5,"normal");
  u.stats.split("·").forEach((s,si)=>{
    doc.text("·"+s.trim(),ux+3,52+si*4);
  });
  ux+=29.5;
});

// ── AI Features section ──
sectionHeader(72,"AI-Powered Intelligence","Backed by Claude — Anthropic's advanced AI",C.purple);

const aiFeats=[
  {
    title:"🤖 Resident AI Chat",
    color:C.purple,
    desc:"Every resident gets an AI assistant that answers questions in plain English. Ask about your dues, water level, alerts, or anything — get instant, accurate answers pulled from live society data.",
    demo:['"What is my outstanding balance?" → ₹4,200 for March due in 3 days.',
          '"Is water available?" → Tank A: 82%, Tank B: 61% — sufficient for 3 days.',
          '"Any alerts I should know?" → 2 active: power surge warning, sewage blockage.']
  },
  {
    title:"📊 AI Monthly Reports",
    color:C.cyan,
    desc:"Generate a full PDF monthly report with an AI-written executive narrative. Covers utility consumption, payment health, open requests, alerts, and forward-looking recommendations — ready in 15 seconds.",
    demo:["Executive summary written in plain English by Claude AI.",
          "KPI table: water, power, payments, alerts, service requests.",
          "Automatically emailed to RWA committee on demand."]
  },
  {
    title:"🔮 Predictive Tanker Orders",
    color:C.blue,
    desc:"BlockSense AI analyses 30 days of water consumption data and tank levels to predict when tankers need to be ordered — before you run out. Alerts are sent proactively, not reactively.",
    demo:["Scans all blocks nightly at 12:30 AM automatically.",
          "Factors in usage rate, current level, last delivery date.",
          "Sends tanker order alert 48 hours before predicted shortage."]
  },
  {
    title:"⚡ Anomaly Detection",
    color:C.orange,
    desc:"Hourly scans detect abnormal utility readings — sudden spikes in power, pressure drops in gas, unusually high water usage — and raise alerts instantly so issues are fixed before they escalate.",
    demo:["Runs every hour across all society blocks.",
          "Compares readings against rolling 7-day baseline.",
          "Raises critical or warning alert with specific details."]
  },
];

let ay=90;
aiFeats.forEach((f,fi)=>{
  const isRight = fi%2===1;
  const ax = isRight ? W/2+4 : M;
  const aw = W/2-M-4;
  fill(...f.color.map(v=>Math.round(v*0.12))); rect(ax,ay,aw,46,"F",3);
  fill(...f.color); rect(ax,ay,2,46,"F",1);
  txt(...f.color); font(null,8,"bold"); doc.text(f.title,ax+6,ay+7);
  txt(...C.gray); font(null,6,"normal");
  const lines = doc.splitTextToSize(f.desc,aw-10);
  doc.text(lines,ax+6,ay+13,{lineHeightFactor:1.45});
  f.demo.forEach((d,di)=>{
    fill(...f.color.map(v=>Math.round(v*0.5))); doc.circle(ax+7,ay+30+di*5,1,"F");
    txt(...C.grayD); font(null,5.5,"normal"); doc.text(d,ax+10,ay+31.5+di*5);
  });
  if(fi%2===1) ay+=50;
});

// ── Guard section ──
sectionHeader(ay+4,"Guard Post","Physical security made digital",C.green);
fill(...C.card); rect(M,ay+20,W-2*M,44,"F",3);
const guardFeats=[
  {icon:"📋",t:"Today's Log",d:"Real-time list of all visitors with check-in/out times and pass codes."},
  {icon:"🚶",t:"Walk-in Entry",d:"Instantly log unannounced visitors with name, phone, and destination flat."},
  {icon:"🔢",t:"Pass Code Scan",d:"Residents share a 6-digit code; guard verifies in one tap. No calls needed."},
  {icon:"📸",t:"Photo Evidence",d:"Capture visitor photo directly from the guard's device camera."},
];
let gfx=M+4;
guardFeats.forEach(g=>{
  fill(...C.green.map(v=>Math.round(v*0.15))); rect(gfx,ay+23,40,36,"F",3);
  txt(...C.white); font(null,9,"bold"); doc.text(g.icon,gfx+20,ay+32,{align:"center"});
  txt(...C.green); font(null,6.5,"bold"); doc.text(g.t,gfx+20,ay+39,{align:"center"});
  txt(...C.gray); font(null,5.5,"normal");
  const gl=doc.splitTextToSize(g.d,36);
  doc.text(gl,gfx+3,ay+45,{lineHeightFactor:1.35});
  gfx+=44;
});

// ══════════════════════════════════════════════════════════════════
// PAGE 5 — WHY BLOCKSENSE + CALL TO ACTION
// ══════════════════════════════════════════════════════════════════
doc.addPage();
bg();

gradBar(0,0,W,16,C.bg,C.purple);
txt(...C.white); font(null,13,"bold"); doc.text("Why BlockSense AI?", M, 11);
txt(...C.gray); font(null,7.5,"normal"); doc.text("The smarter choice for modern societies", M+60, 11);

// Before / After comparison
txt(...C.white); font(null,10,"bold"); doc.text("Life Before vs After BlockSense", W/2, 28, {align:"center"});

const comparisons=[
  {before:"📞 Call guard to check if visitor arrived",  after:"📱 Resident gets notified automatically"},
  {before:"🗂️  Paper maintenance register at office",   after:"💻 Digital log, searchable in seconds"},
  {before:"🚶 Walk to RWA office to pay dues",          after:"💳 Pay via UPI in the app, anywhere"},
  {before:"📣 Announcements on WhatsApp groups",        after:"📡 Official broadcasts with read receipt"},
  {before:"❓ No idea when water tanker is needed",      after:"🔮 AI predicts and alerts 48 hrs ahead"},
  {before:"📊 Manual Excel reports every month",        after:"🤖 One-click AI report generated in 15s"},
  {before:"📋 Paper complaint register, no tracking",   after:"⚠️  Digital complaint, tracked till closure"},
  {before:"📲 Multiple WhatsApp groups chaos",          after:"✅ One app for everyone, one source of truth"},
];

comparisons.forEach((c,i)=>{
  const cy = 34 + i*15;
  const isEven=i%2===0;
  fill(isEven?18:22, isEven?14:18, isEven?38:44); rect(M,cy,W-2*M,13,"F",2);
  // before
  fill(239,68,68,0.15); rect(M,cy,85,13,"F");
  txt(239,68,68); font(null,6.5,"normal"); doc.text("✗  "+c.before, M+3, cy+8);
  // after
  fill(34,197,94,0.15); rect(M+89,cy,W-2*M-89,13,"F");
  txt(34,197,94); doc.text("✓  "+c.after, M+92, cy+8);
  // divider
  fill(...C.cardBdr); rect(M+87,cy,2,13,"F");
  txt(...C.grayD); font(null,5.5,"bold"); doc.text("→",M+87.5,cy+7.5);
});

// Trust signals
sectionHeader(162,"Trusted. Secure. Always On.",null,C.green);
const trust=[
  {icon:"🔒",t:"Bank-grade Security",d:"All data encrypted at rest\nand in transit via HTTPS."},
  {icon:"⚡",t:"Real-time Sync",d:"Convex database ensures\nall users see live data."},
  {icon:"📱",t:"Works Offline",d:"PWA caches key pages.\nWorks with poor network."},
  {icon:"🌐",t:"Web + Mobile",d:"Full-featured on both\nbrowser and mobile."},
  {icon:"☁️", t:"Zero Maintenance",d:"Cloud-hosted. No servers\nto manage or update."},
];
let tx=M;
trust.forEach(t=>{
  fill(...C.card); rect(tx,172,34,32,"F",3);
  txt(...C.white); font(null,10,"bold"); doc.text(t.icon,tx+17,181,{align:"center"});
  txt(...C.cyan); font(null,6.5,"bold"); doc.text(t.t,tx+17,187,{align:"center"});
  txt(...C.gray); font(null,5.5,"normal"); doc.text(t.d,tx+17,193,{align:"center",lineHeightFactor:1.4});
  tx+=36.5;
});

// Testimonials (fictional but illustrative)
sectionHeader(210,"What Our Users Say",null,C.purple);
const testimonials=[
  {name:"Ramesh K., RWA Chairman",text:"\"We eliminated 3 WhatsApp groups, 2 Excel sheets, and a paper register. BlockSense replaced all of them.\""},
  {name:"Priya M., Resident",text:"\"I can pay dues, check water levels, and pre-register my guests — all from my phone. It just works.\""},
  {name:"Suresh G., Security Guard",text:"\"Scanning pass codes takes 2 seconds. No more calling residents to verify visitors. Huge time saver.\""},
];
let tey=220;
testimonials.forEach((t,i)=>{
  fill(...C.card); rect(M,tey,W-2*M,16,"F",3);
  fill(...C.purple); rect(M,tey,2,16,"F",1);
  txt(...C.white); font(null,6.5,"normal");
  doc.text(t.text, M+6, tey+6.5, {maxWidth:W-2*M-30});
  txt(...C.purple); font(null,6,"bold"); doc.text("— "+t.name, W-M-4, tey+12, {align:"right"});
  tey+=19;
});

// ── Final CTA ──
gradBar(0,260,W,37,C.purpleD,C.blue);
// decorative
doc.setFillColor(255,255,255,0.03); doc.circle(W-15,265,25,"F");
doc.setFillColor(255,255,255,0.03); doc.circle(W+5,285,35,"F");

txt(...C.white); font(null,14,"bold"); doc.text("Ready to transform your society?", W/2, 273, {align:"center"});
txt(220,210,255); font(null,8,"normal");
doc.text("Join hundreds of societies already running smarter with BlockSense AI.", W/2, 280, {align:"center"});

// CTA pills
fill(255,255,255); rect(W/2-38,283,36,10,"F",5);
txt(...C.purpleD); font(null,7,"bold"); doc.text("Get Started Free", W/2-20, 289.5);

fill(255,255,255,0.15); rect(W/2+2,283,36,10,"F",5);
stroke(255,255,255); doc.setLineWidth(0.3); rect(W/2+2,283,36,10,"S",5);
txt(...C.white); font(null,7,"bold"); doc.text("Book a Demo", W/2+20, 289.5);

txt(200,190,255); font(null,6.5,"normal");
doc.text("© 2025 BlockSense AI  ·  Confidential Sales Document", W/2, 295, {align:"center"});

// ── Write output ──
const out = doc.output("arraybuffer");
writeFileSync("BlockSense_AI_Sales_Deck.pdf", Buffer.from(out));
console.log("✅  BlockSense_AI_Sales_Deck.pdf generated successfully.");
