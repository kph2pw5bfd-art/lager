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
A,M,L,X="00000000-0000-0000-0000-00000000000a","00000000-0000-0000-0000-00000000000c","00000000-0000-0000-0000-00000000000d","00000000-0000-0000-0000-00000000000e"
sql(f"insert into auth.users(id,email) values ('{A}','a@x'),('{M}','m@x'),('{L}','l@x'),('{X}','x@x'); update profiles set active=true")
for f in ["rechte.sql","materialliste.sql","protokoll.sql"]: sql(open("/home/claude/gh/"+f).read())
print(sql(open("/home/claude/gh/packliste.sql").read())[0].splitlines()[-1]);print(sql(open("/home/claude/gh/packliste.sql").read())[0].splitlines()[-1])
sql(open("/home/claude/gh/packliste.sql").read())
print(sql(open("/home/claude/gh/auftraege.sql").read())[0].splitlines()[-1]);print(sql(open("/home/claude/gh/auftraege.sql").read())[0].splitlines()[-1])
P="00000000-0000-0000-0000-00000000000f"
sql(f"insert into auth.users(id,email) values ('{P}','p@x'); update profiles set active=true")
sql(f"""insert into docs(col,id,data) values ('rolle','{M}','{{"t":"monteur"}}'),('rolle','{L}','{{"t":"lagerarbeiter","x":{{"pk_s":true}}}}'),('rolle','{P}','{{"t":"projektleiter"}}') on conflict (col,id) do update set data=excluded.data""")
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
chk("Titel Projektleiter hat au_s+au_b+ret_s",sql("select data->'r'->>'au_s',data->'r'->>'au_b',data->'r'->>'ret_s' from docs where col='titel' and id='projektleiter'")[0],"true|true|true")
pk=json.dumps({"ord":"1","ev":"X","pos":[]})
sql(f"insert into docs(col,id,data) values ('pack','p1','{pk}'),('retour','r1','{{\"ord\":\"1\"}}')")
chk("Projektleiter sieht Packlisten",sql("select count(*) from docs where col='pack'",user=P)[0],"1")
chk("Projektleiter sieht Retourscheine",sql("select count(*) from docs where col='retour'",user=P)[0],"1")
chk("Monteur sieht keine Packlisten",sql("select count(*) from docs where col='pack'",user=M)[0],"0")
o,e=sql(f"insert into docs(col,id,data) values ('pack','p2','{pk}')",user=P,ok_err=True);chk("Projektleiter kann NICHT hochladen","nein" if e else "ja","nein")
o,e=sql("select doc_update('pack','p1','{\"ev\":\"neu\"}'::jsonb)",user=P,ok_err=True);chk("Projektleiter kann Packliste nicht ändern","nein" if e or o!="t" else "ja","nein")
o,e=sql(f"insert into docs(col,id,data) values ('plaw','a1','{{\"by\":\"{P}\",\"typ\":\"msg\"}}')",user=P,ok_err=True);chk("Projektleiter schreibt eigene Antwort","ja" if not e else "nein: "+e,"ja")
o,e=sql(f"insert into docs(col,id,data) values ('plaw','a2','{{\"by\":\"{L}\",\"typ\":\"msg\"}}')",user=P,ok_err=True);chk("Projektleiter kann nicht im Namen anderer schreiben","nein" if e else "ja","nein")
o,e=sql(f"insert into docs(col,id,data) values ('plaw','a3','{{\"by\":\"{M}\",\"typ\":\"msg\"}}')",user=M,ok_err=True);chk("Monteur ohne Recht kann nicht antworten","nein" if e else "ja","nein")
chk("Monteur liest keine Antworten",sql("select count(*) from docs where col='plaw'",user=M)[0],"0")
chk("Lager liest Antworten",sql("select count(*) from docs where col='plaw'",user=L)[0],"1")
o,e=sql("select doc_update('plaw','a1','{\"read\":{\"t\":1}}'::jsonb)",user=L,ok_err=True);chk("Lager kann „Gelesen“ setzen","ja" if not e and '"read"' in o else "nein: "+(e or o),"ja")
o,e=sql("with x as (delete from docs where col='plaw' and id='a1' returning 1) select count(*) from x",user=L);chk("Lager kann Antworten nicht löschen",o,"0")
chk("Protokoll weiter nur Admin",sql("select can_read('rlog','{}'::jsonb)",user=P)[0],"f")
print("FEHLER GESAMT:",F)
