// Test-Server: App-Anfragen -> echte Postgres-Datenbank mit den Regeln aus datenbank.sql + rechte.sql
const {execFileSync,execFile}=require("child_process");const fs=require("fs");
const PSQL=["-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A","-v","ON_ERROR_STOP=1"];
const lit=v=>{v=String(v);let t="zq";while(v.includes("$"+t+"$"))t+="x";return "$"+t+"$"+v+"$"+t+"$"};
function psql(db,sql){return new Promise(res=>{const p=execFile("psql",[...PSQL,"-d",db],{maxBuffer:64e6},(err,out,errs)=>res({out:out.trim(),err:err?(errs||String(err)).trim():null}));p.stdin.end(sql)})}
function asUser(uid,q){return "begin;\nset local role authenticated;\nselect set_config('request.jwt.claim.sub',"+lit(uid)+",true) as x \\gset\n"+q+";\ncommit;\n"}
function setupDb(db,seed){execFileSync("psql",[...PSQL,"-d","postgres","-c","drop database if exists "+db]);execFileSync("psql",[...PSQL,"-d","postgres","-c","create database "+db]);
 const run=sql=>execFileSync("psql",[...PSQL,"-d",db],{input:sql});
 try{run("create role anon nologin; create role authenticated nologin;")}catch(e){}
 run(fs.readFileSync("/home/postgres/pgt/mock.sql","utf8").replace("create role anon nologin; create role authenticated nologin;",""));
 run(fs.readFileSync("/home/claude/gh/datenbank.sql","utf8"));seed.pre&&run(seed.pre);run(fs.readFileSync("/home/claude/gh/rechte.sql","utf8"));seed.post&&run(seed.post)}
function makeSrv(db,pages,LAT){
 const cond=f=>f.length?" where "+f.map(([ty,k,v])=>ty==="eq"?k+"::text="+lit(v):k+"::text in ("+v.map(lit).join(",")+")").join(" and "):"";
 async function bc(ev){for(const pg of pages){let send=true;
   if(ev.table==="docs"&&ev.eventType!=="DELETE"){const r=await psql(db,asUser(pg.uid,"select public.can_read("+lit(ev.new.col)+","+lit(JSON.stringify(ev.new.data))+"::jsonb)"));send=r.out.split("\n").pop()==="t"}
   if(send)pg.page.evaluate(x=>window.__rt&&window.__rt(x),ev).catch(()=>{})}}
 return async function srv(uid,q){await new Promise(r=>setTimeout(r,LAT||0));
  if(q.rpc){const a=q.a;let sql;
   if(q.rpc==="doc_update")sql="select public.doc_update("+lit(a.p_col)+","+lit(a.p_id)+","+lit(JSON.stringify(a.p_patch))+"::jsonb)";
   else if(q.rpc==="admin_set_user")sql="select public.admin_set_user("+lit(a.p_id)+"::uuid,"+(a.p_active?"true":"false")+","+lit(a.p_role)+")";
   else if(q.rpc==="set_my_name")sql="select public.set_my_name("+lit(a.p_name)+")";else return{data:null,error:null};
   const r=await psql(db,asUser(uid,sql));if(r.err)return{data:null,error:{message:r.err.replace(/^.*ERROR:\s*/s,"").split("\n")[0]}};
   if(q.rpc==="doc_update"){const d=JSON.parse(r.out.split("\n").pop());bc({table:"docs",eventType:"UPDATE",new:{col:a.p_col,id:a.p_id,data:d}});return{data:d,error:null}}
   if(q.rpc==="admin_set_user")bc({table:"profiles",eventType:"UPDATE",new:{}});return{data:null,error:null}}
  const t="public."+q.tab;let sql;
  if(q.op==="upsert"){const p=q.payload;sql="with x as (insert into public.docs(col,id,data,updated_at) values ("+lit(p.col)+","+lit(p.id)+","+lit(JSON.stringify(p.data))+"::jsonb,now()) on conflict (col,id) do update set data=excluded.data,updated_at=now() returning col,id,data) select coalesce(jsonb_agg(x),'[]'::jsonb) from x"}
  else if(q.op==="delete")sql="with x as (delete from "+t+cond(q.f)+" returning col,id) select coalesce(jsonb_agg(x),'[]'::jsonb) from x";
  else sql="select coalesce(jsonb_agg(x),'[]'::jsonb) from (select * from "+t+cond(q.f)+" order by 1"+(q.rng?" offset "+q.rng[0]+" limit "+(q.rng[1]-q.rng[0]+1):"")+") x";
  const r=await psql(db,asUser(uid,sql));if(r.err)return{data:null,error:{message:r.err.replace(/^.*ERROR:\s*/s,"").split("\n")[0]}};
  const rows=JSON.parse(r.out.split("\n").pop()||"[]");
  if(q.op==="upsert"){bc({table:"docs",eventType:"UPDATE",new:rows[0]});return{data:q.one?rows[0]:rows,error:null}}
  if(q.op==="delete"){rows.forEach(o=>bc({table:"docs",eventType:"DELETE",old:o}));return{data:null,error:null}}
  return q.one?{data:rows[0]||null,error:null}:{data:rows,error:null}}}
async function openPage(b,uid,srv,pages){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.addInitScript(u=>{window.__UID=u},uid);
 await ctx.exposeFunction("__srv",q=>srv(uid,q));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(__dirname+"/fakesb2.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 const p=await ctx.newPage();p.__errs=[];p.on("pageerror",e=>p.__errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/404|Failed to load/.test(m.text()))p.__errs.push("console: "+m.text())});
 pages.push({uid,page:p});await p.goto("https://app.test/");await p.waitForTimeout(1500);await p.mouse.click(200,420);await p.waitForTimeout(400);return p}
module.exports={setupDb,makeSrv,openPage,psql,asUser,lit};
