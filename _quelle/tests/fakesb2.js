// Gemeinsame Fake-Datenbank für mehrere Browserfenster (Daten liegen im Testprogramm)
(function(){
const U=window.__UID;let RT=[];
function Q(tab){this.tab=tab;this.f=[];this.op="select";this.rng=null;this.one=0;this.payload=null}
Q.prototype.select=function(){return this};Q.prototype.eq=function(k,v){this.f.push(["eq",k,v]);return this};
Q.prototype.in=function(k,v){this.f.push(["in",k,v]);return this};Q.prototype.order=function(){return this};
Q.prototype.range=function(a,b){this.rng=[a,b];return this};Q.prototype.limit=function(){return this};
Q.prototype.single=function(){this.one=1;return this};Q.prototype.maybeSingle=function(){this.one=2;return this};
Q.prototype.upsert=function(p){this.op="upsert";this.payload=p;return this};Q.prototype.delete=function(){this.op="delete";return this};
Q.prototype.then=function(res,rej){return window.__srv({tab:this.tab,op:this.op,f:this.f,rng:this.rng,one:this.one,payload:this.payload}).then(res,rej)};
window.__rt=p=>{RT.forEach(([ev,o,cb])=>{if(o.table!==p.table)return;if(ev!=="*"&&ev!==p.eventType)return;try{cb(p)}catch(e){console.error(e)}})};
const client={from:t=>new Q(t),rpc:(fn,a)=>window.__srv({rpc:fn,a}),
 channel:()=>{const ch={on(t,o,cb){RT.push([o.event,o,cb]);return ch},subscribe(cb){setTimeout(()=>cb&&cb("SUBSCRIBED"),10);return ch}};return ch},getChannels:()=>[],
 auth:{getSession:async()=>({data:{session:{user:{id:U,email:U+"@x"}}}}),onAuthStateChange(){},signOut:async()=>({})}};
window.supabase={createClient:()=>client};
})();
