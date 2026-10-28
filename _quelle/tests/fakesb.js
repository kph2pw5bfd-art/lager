
// Minimaler In-Memory-Ersatz für supabase-js, nur für Tests
(function(){
const T={docs:[],profiles:[{id:"u1",name:"Jürgen Hartmann",email:"j@x",role:"admin",active:true,created_at:"2026-10-28"}]};
window.__T=T;
function Q(tab){this.tab=tab;this.f=[];this.op="select";this.cols=null;this.rng=null;this.one=0;this.payload=null}
Q.prototype.select=function(c){if(this.op==="select")this.op="select";this.cols=c;return this};
Q.prototype.eq=function(k,v){this.f.push(r=>r[k]===v);return this};
Q.prototype.in=function(k,v){this.f.push(r=>v.includes(r[k]));return this};
Q.prototype.order=function(){return this};
Q.prototype.range=function(a,b){this.rng=[a,b];return this};
Q.prototype.limit=function(){return this};
Q.prototype.single=function(){this.one=1;return this};
Q.prototype.maybeSingle=function(){this.one=2;return this};
Q.prototype.upsert=function(p){this.op="upsert";this.payload=p;return this};
Q.prototype.delete=function(){this.op="delete";return this};
Q.prototype.then=function(res,rej){return Promise.resolve(this.run()).then(res,rej)};
Q.prototype.run=function(){const t=T[this.tab];
 if(window.__offline)return{data:null,error:{message:"Failed to fetch"}};
 if(this.op==="upsert"){const p=JSON.parse(JSON.stringify(this.payload));const i=t.findIndex(r=>r.col===p.col&&r.id===p.id);if(i>=0)t[i]=p;else t.push(p);return{data:this.one?p:[p],error:null}}
 let rows=t.filter(r=>this.f.every(f=>f(r)));
 if(this.op==="delete"){T[this.tab]=t.filter(r=>!rows.includes(r));return{data:null,error:null}}
 if(this.rng)rows=rows.slice(this.rng[0],this.rng[1]+1);rows=JSON.parse(JSON.stringify(rows));
 if(this.one)return{data:rows[0]||null,error:null};return{data:rows,error:null}};
const client={from:t=>new Q(t),
 rpc:async(fn,a)=>{if(window.__offline)return{data:null,error:{message:"Failed to fetch"}};if(fn==="doc_update"){const r=T.docs.find(x=>x.col===a.p_col&&x.id===a.p_id);if(!r)return{data:null,error:{message:"Eintrag nicht gefunden"}};r.data={...r.data,...a.p_patch};return{data:JSON.parse(JSON.stringify(r.data)),error:null}}return{data:null,error:null}},
 channel:()=>{const ch={on(){return ch},subscribe(cb){setTimeout(()=>cb&&cb("SUBSCRIBED"),10);return ch},state:"joined"};return ch},getChannels:()=>[],
 auth:{getSession:async()=>({data:{session:{user:{id:"u1",email:"j@x"}}}}),onAuthStateChange(){},signOut:async()=>({})}};
window.supabase={createClient:()=>client};
})();
