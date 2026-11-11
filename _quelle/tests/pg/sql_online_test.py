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
sql(open("/home/claude/gh/auftraege.sql").read())
print(sql(open("/home/claude/gh/online.sql").read())[0].splitlines()[-1]);print(sql(open("/home/claude/gh/online.sql").read())[0].splitlines()[-1])
sql(f"""insert into docs(col,id,data) values ('rolle','{M}','{{"t":"monteur"}}'),('rolle','{L}','{{"t":"lagerarbeiter","x":{{"pk_s":true}}}}') on conflict (col,id) do update set data=excluded.data""")
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
o,e=sql(f"""insert into docs(col,id,data) values ('online','{M}_dev1','{{"u":"{M}","t":1,"vis":true}}') on conflict (col,id) do update set data=excluded.data returning id""",user=M,ok_err=True);chk("Monteur legt eigenen Eintrag an","ja" if not e else "nein: "+e,"ja")
o,e=sql(f"""insert into docs(col,id,data) values ('online','{M}_dev1','{{"u":"{M}","t":2,"vis":true}}') on conflict (col,id) do update set data=excluded.data returning id""",user=M,ok_err=True);chk("Monteur aktualisiert per Upsert","ja" if not e else "nein: "+e,"ja")
o,e=sql(f"select doc_update('online','{M}_dev1','{{\"t\":3}}'::jsonb)->>'t'",user=M,ok_err=True);chk("Monteur aktualisiert per doc_update",o if not e else "Fehler: "+e,"3")
o,e=sql(f"""insert into docs(col,id,data) values ('online','{L}_dev9','{{"u":"{L}","t":1}}')""",user=M,ok_err=True);chk("Monteur kann nicht für andere schreiben","nein" if e else "ja","nein")
o,e=sql(f"""insert into docs(col,id,data) values ('online','{M}_dev2','{{"u":"{L}","t":1}}')""",user=M,ok_err=True);chk("Fremde Person im eigenen Eintrag geht nicht","nein" if e else "ja","nein")
sql(f"""insert into docs(col,id,data) values ('online','{L}_dev3','{{"u":"{L}","t":5}}')""",user=L)
chk("Monteur sieht nur seinen Eintrag",sql("select count(*) from docs where col='online'",user=M)[0],"1")
o,e=sql(f"select doc_update('online','{L}_dev3','{{\"t\":9}}'::jsonb)",user=M,ok_err=True);chk("Monteur kann fremden Eintrag nicht ändern","nein" if e else "ja","nein")
chk("Admin sieht alle",sql("select count(*) from docs where col='online'",user=A)[0],"2")
o,e=sql("with x as (delete from docs where col='online' returning 1) select count(*) from x",user=M);chk("Monteur kann nicht löschen",o,"0")
chk("Packlisten-Regel unverändert (Monteur)",sql("select can_read('pack','{}'::jsonb)",user=M)[0],"f")
chk("Packlisten-Regel unverändert (Lager)",sql("select can_read('pack','{}'::jsonb)",user=L)[0],"t")
chk("Protokoll weiter nur Admin",sql("select can_read('rlog','{}'::jsonb)",user=L)[0],"f")
print("FEHLER GESAMT:",F)
