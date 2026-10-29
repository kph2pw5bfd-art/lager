import subprocess,sys,json
H=["psql","-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A"]
def sql(q,user=None,ok_err=False):
    pre="set role authenticated; select set_config('request.jwt.claim.sub','%s',false) \\g /dev/null\n"%user if user else ""
    r=subprocess.run(H+["-d","rl","-v","ON_ERROR_STOP=1"],input=pre+q,capture_output=True,text=True)
    if r.returncode and not ok_err: print("SQL-FEHLER:",r.stderr,q[:200]);sys.exit(1)
    return r.stdout.strip(),r.stderr.strip()
subprocess.run(H+["-d","postgres","-c","drop database if exists rl"],capture_output=True);subprocess.run(H+["-d","postgres","-c","create database rl"],check=True)
sql(open("/home/postgres/pgt/mock.sql").read().replace("create role anon nologin; create role authenticated nologin;",""))
sql(open("/home/claude/gh/datenbank.sql").read())
A,M="00000000-0000-0000-0000-00000000000a","00000000-0000-0000-0000-00000000000c"
sql(f"insert into auth.users(id,email) values ('{A}','a@x'),('{M}','m@x'); update profiles set active=true")
ij=json.dumps({"7009":{"nr":"7009","name":"16A 100m","g":"Kabel","q":4},"M:LAMPE":{"nr":"","name":"Lampe","g":"Händisch","manual":True,"q":1}})
pa=json.dumps({"7009":{"nr":"7009","name":"16A 100m","g":"Kabel","q":2},"7018":{"nr":"7018","name":"32A 50m","g":"Kabel","q":-1},"Z:C-Haken":{"nr":"","name":"C-Haken","g":"Zubehör","q":3}})
sql(f"""insert into docs(col,id,data) values ('retour','r1',jsonb_build_object('ev','Messe','ord','2601','t',1793000000000,'by','{A}','itemsJson',{ "'"+ij.replace("'","''")+"'" },'pa_{M}',{ "'"+pa.replace("'","''")+"'" }))""")
for f in ["rechte.sql","materialliste.sql"]: sql(open("/home/claude/gh/"+f).read())
print(sql(open("/home/claude/gh/protokoll.sql").read())[0].splitlines()[-1])
print(sql(open("/home/claude/gh/protokoll.sql").read())[0].splitlines()[-1])
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
rows=sql("select data->>'name', data->>'g', data->>'d', data->>'nt' from docs where col='rlog' order by 1")[0]
chk("Nachgetragen: 16A=6, Lampe=1 (Manuell), C-Haken=3, 32A (−1) weggelassen",rows.replace("\n"," | "),"16A 100m|Kabel|6|true | C-Haken|Zubehör|3|true | Lampe|Manuell|1|true")
o,e=sql("""select rlog_add('[{"id":"lx1","d":{"t":9999999999999,"rid":"r1","k":"7009","nr":"7009","name":"16A 100m","g":"Kabel","d":2,"by":"FREMD"}}]'::jsonb)""",user=M);chk("Monteur schreibt per rlog_add",o,"1")
chk("by wird erzwungen",sql("select data->>'by' from docs where col='rlog' and id='lx1'")[0],M)
o,e=sql("""select rlog_add('[{"id":"lx1","d":{"t":1,"d":99}}]'::jsonb)""",user=M);chk("Doppelte ID überschreibt nicht",o+"/"+sql("select data->>'d' from docs where id='lx1'")[0],"0/2")
chk("Monteur kann Protokoll NICHT lesen",sql("select count(*) from docs where col='rlog'",user=M)[0],"0")
chk("Admin kann lesen",sql("select count(*) from docs where col='rlog'",user=A)[0],"4")
o,e=sql("insert into docs(col,id,data) values ('rlog','x','{}')",user=M,ok_err=True);chk("Direkt einfügen verboten","nein" if e else "ja","nein")
o,e=sql("select doc_update('rlog','lx1','{\"d\":50}'::jsonb)",user=A,ok_err=True);chk("Auch Admin kann nicht ändern","nein" if e or o!="t" else "ja","nein")
o,e=sql("with x as (delete from docs where col='rlog' returning 1) select count(*) from x",user=A);chk("Auch Admin kann nicht löschen",o,"0")
sql(f"update profiles set active=false where id='{M}'");o,e=sql("""select rlog_add('[{"id":"lx2","d":{"t":1}}]'::jsonb)""",user=M,ok_err=True);chk("Gesperrter Benutzer kann nicht schreiben","nein" if e else "ja","nein")
sql(f"update profiles set active=true where id='{M}'")
o,e=sql("""select rlog_add('[{"id":"alt1","d":{"t":1793000000000,"k":"7009","d":5}}]'::jsonb)""",user=M);chk("Eintrag von VOR dem Nachtrag wird übersprungen (sonst doppelt)",o,"0")
import time
o,e=sql("""select rlog_add('[{"id":"neu1","d":{"t":%d,"k":"7009","d":1}}]'::jsonb)"""%int(time.time()*1000+5000),user=M);chk("Eintrag NACH dem Nachtrag zählt",o,"1")
chk("Nachtrag-Zeitpunkt gespeichert",sql("select (data->>'t')::bigint > 1700000000000 from docs where col='meta' and id='rlog_backfill'")[0],"t")
print("FEHLER GESAMT:",F)
