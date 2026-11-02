import subprocess,sys,json
H=["psql","-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A"]
def sql(q,user=None,ok_err=False):
    pre="set role authenticated; select set_config('request.jwt.claim.sub','%s',false) \\g /dev/null\n"%user if user else ""
    r=subprocess.run(H+["-d","pk","-v","ON_ERROR_STOP=1"],input=pre+q,capture_output=True,text=True)
    if r.returncode and not ok_err: print("SQL-FEHLER:",r.stderr,q[:200]);sys.exit(1)
    return r.stdout.strip(),r.stderr.strip()
subprocess.run(H+["-d","postgres","-c","drop database if exists pk"],capture_output=True);subprocess.run(H+["-d","postgres","-c","create database pk"],check=True)
sql(open("/home/postgres/pgt/mock.sql").read().replace("create role anon nologin; create role authenticated nologin;",""))
sql(open("/home/claude/gh/datenbank.sql").read())
A,M,W="00000000-0000-0000-0000-00000000000a","00000000-0000-0000-0000-00000000000c","00000000-0000-0000-0000-00000000000d"
sql(f"insert into auth.users(id,email) values ('{A}','a@x'),('{M}','m@x'),('{W}','w@x'); update profiles set active=true; update profiles set name='Max Mustermann' where id='{M}'")
for f in ["rechte.sql","materialliste.sql","protokoll.sql","packliste.sql","auftraege.sql","sicherung.sql"]: sql(open("/home/claude/gh/"+f).read())
# Attrappe für pg_net: merkt sich die Aufrufe
sql("create schema if not exists net; create table net.calls(n serial, url text, body jsonb, headers jsonb); create or replace function net.http_post(url text, body jsonb, headers jsonb) returns bigint language sql as $$ insert into net.calls(url,body,headers) values (url,body,headers) returning n::bigint $$; grant usage on schema net to authenticated; grant insert on net.calls to authenticated; grant usage on sequence net.calls_n_seq to authenticated;")
P=open("/home/claude/gh/push.sql").read().replace("create extension if not exists pg_net;","")
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
o=sql(P)[0].splitlines()[-1];chk("Skript läuft",o.startswith("Fertig"),True);sql(P)
calls=lambda:[json.loads(x) for x in sql("select body from net.calls order by n")[0].splitlines() if x]
sql(f"""insert into docs(col,id,data) values ('rolle','{M}','{{"t":"lagerarbeiter"}}') on conflict (col,id) do update set data=excluded.data""")
# Packliste neu
sql(f"""insert into docs(col,id,data) values ('pack','20260714','{{"ev":"Gala Wien","ord":"260130001","db":1793952000000,"pos":[{{"p":"1"}},{{"p":"2"}}],"by":"{A}"}}')""",user=A)
c=calls();chk("neue Packliste löst aus",[x["typ"] for x in c],["pk"])
chk("Text Packliste",(c[-1]["titel"],c[-1]["text"]),("Neue Packliste: Gala Wien","Auftrag 260130001 · herrichten Fr. 06.11. · 2 Positionen"))
chk("Ziel Packliste",c[-1]["ziel"],"pk:20260714");chk("Geheimnis mitgeschickt",len(c[-1]["geheim"]),64)
sql("""update docs set data=data||'{"ev":"Gala Wien neu"}' where col='pack' and id='20260714'""",user=A);chk("Packliste ersetzen löst nicht nochmal aus",len(calls()),1)
sql(f"""insert into docs(col,id,data) values ('pack','20260714','{{"ev":"Gala Wien 2"}}') on conflict (col,id) do update set data=excluded.data""",user=A);chk("Upsert (Ersetzen) löst nicht aus",len(calls()),1)
# Retourschein
sql(f"""insert into docs(col,id,data) values ('retour','r1','{{"ev":"Messe Linz","ord":"26001","by":"{M}"}}')""",user=A);chk("offener Retourschein: nichts",len(calls()),1)
sql(f"""select doc_update('retour','r1','{{"closed":true,"art":"teil","closedBy":"{M}"}}'::jsonb)""",user=A);chk("Teilretoure: nichts",len(calls()),1)
sql(f"""select doc_update('retour','r1','{{"closed":false}}'::jsonb)""",user=A)
sql(f"""select doc_update('retour','r1','{{"closed":true,"art":"end","closedBy":"{M}"}}'::jsonb)""",user=A);c=calls()
chk("Endretoure löst aus",c[-1]["typ"],"pr");chk("Text Endretoure",(c[-1]["titel"],c[-1]["text"]),("Zu prüfen: Messe Linz","Endretoure von Max M. · Auftrag 26001"))
sql("""select doc_update('retour','r1','{"rem":"x"}'::jsonb)""",user=A);chk("weitere Änderung: nicht nochmal",len(calls()),2)
sql("""select doc_update('retour','r1','{"closed":false}'::jsonb)""",user=A);sql(f"""select doc_update('retour','r1','{{"closed":true,"art":"end","closedBy":"{A}","closedBy_as":"Lukas Peter"}}'::jsonb)""",user=A)
c=calls();chk("Wieder geöffnet + Endretoure: nochmal (Tablet-Name)",c[-1]["text"],"Endretoure von Lukas P. · Auftrag 26001")
# Defekt
sql(f"""insert into docs(col,id,data) values ('defekte','d1','{{"art":"Verteiler 32A Black","ev":"Spittelberg","desc":"Schalter defekt","by":"{M}","urg":false,"done":false}}')""",user=M);chk("nicht dringend: nichts",len(calls()),3)
sql("""select doc_update('defekte','d1','{"urg":true}'::jsonb)""",user=A);c=calls()
chk("auf dringend gestellt: löst aus",(c[-1]["typ"],c[-1]["ziel"]),("def","def:d1"))
chk("Text Defekt",(c[-1]["titel"],c[-1]["text"]),("Dringender Defekt: Verteiler 32A Black","gemeldet von Max M. · Spittelberg · „Schalter defekt“"))
sql(f"""insert into docs(col,id,data) values ('defekte','d2','{{"art":"Kabel","by":"{M}","urg":true,"done":false}}')""",user=M);chk("neu und dringend: löst aus",calls()[-1]["titel"],"Dringender Defekt: Kabel")
# Fehler beim Benachrichtigen darf Speichern nicht verhindern
sql("create or replace function net.http_post(url text, body jsonb, headers jsonb) returns bigint language plpgsql as $$ begin raise exception 'Netz kaputt'; end $$")
o,e=sql("""insert into docs(col,id,data) values ('pack','p9','{"ev":"X"}')""",user=A,ok_err=True);chk("Speichern trotz Fehler",sql("select count(*) from docs where id='p9'")[0],"1")
# Abos: nur eigene
sql(f"""insert into push_abos(endpoint,sub,typen) values ('e1','{{}}','{{"pk":true}}')""",user=M)
chk("Eigenes Abo gespeichert mit user_id",sql("select user_id from push_abos where endpoint='e1'")[0],M)
chk("Andere sehen fremde Abos nicht",sql("select count(*) from push_abos",user=W)[0],"0")
o,e=sql(f"""insert into push_abos(endpoint,user_id,sub) values ('e2','{M}','{{}}')""",user=W,ok_err=True);chk("Kein Abo im Namen anderer","nein" if e else "ja","nein")
chk("Geheimnis nicht lesbar",("denied" in sql("select * from push_cfg",user=M,ok_err=True)[1]),True)
print("FEHLER GESAMT:",F)
