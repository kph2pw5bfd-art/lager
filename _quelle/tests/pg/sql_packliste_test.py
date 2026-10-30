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
sql(f"""insert into docs(col,id,data) values ('rolle','{M}','{{"t":"monteur"}}'),('rolle','{L}','{{"t":"lagerarbeiter","x":{{"pk_s":true,"pk_b":true}}}}'),('rolle','{X}','{{"t":"monteur","x":{{"pk_l":true}}}}') on conflict (col,id) do update set data=excluded.data""")
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
pk=json.dumps({"ord":"260111401","ps":"20260714","ev":"Winterwunder","pos":[{"p":"1.1","n":6,"u":"Stk","t":"VT","a":"1048","f":0}]})
ins=lambda u,i: sql(f"insert into docs(col,id,data) values ('pack','{i}','{pk}')",user=u,ok_err=True)
o,e=ins(M,"p1");chk("Monteur ohne Recht kann NICHT hochladen","nein" if e else "ja","nein")
o,e=ins(L,"p1");chk("Lagerarbeiter mit Hochladen-Recht kann hochladen","ja" if not e else "nein: "+e,"ja")
o,e=ins(A,"p2");chk("Admin kann hochladen","ja" if not e else "nein: "+e,"ja")
chk("Monteur sieht keine Packlisten",sql("select count(*) from docs where col='pack'",user=M)[0],"0")
chk("Lagerarbeiter sieht Packlisten",sql("select count(*) from docs where col='pack'",user=L)[0],"2")
chk("Nur-Löschen-Recht darf auch sehen",sql("select count(*) from docs where col='pack'",user=X)[0],"2")
o,e=sql("select doc_update('pack','p1','{\"ev\":\"neu\"}'::jsonb)",user=M,ok_err=True);chk("Monteur kann nicht ändern","nein" if e or o!="t" else "ja","nein")
o,e=sql("with x as (delete from docs where col='pack' and id='p1' returning 1) select count(*) from x",user=L);chk("Hochladen-Recht ohne Löschen kann nicht löschen",o,"0")
o,e=sql("with x as (delete from docs where col='pack' and id='p1' returning 1) select count(*) from x",user=X);chk("Löschen-Recht kann löschen",o,"1")
chk("Retourscheine weiter wie vorher (Monteur liest 0)",sql("select count(*) from docs where col='retour'",user=M)[0],"0")
chk("Protokoll weiter nur Admin",sql("select can_read('rlog','{}'::jsonb)",user=L)[0],"f")
sql(f"update profiles set active=false where id='{L}'");chk("Gesperrter Benutzer sieht nichts",sql("select count(*) from docs where col='pack'",user=L)[0],"0")
print("FEHLER GESAMT:",F)
