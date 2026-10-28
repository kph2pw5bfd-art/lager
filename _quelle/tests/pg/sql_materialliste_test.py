import subprocess,sys
H=["psql","-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A"]
def sql(q,user=None,ok_err=False):
    pre="set role authenticated; select set_config('request.jwt.claim.sub','%s',false) \\g /dev/null\n"%user if user else ""
    r=subprocess.run(H+["-d","mat","-v","ON_ERROR_STOP=1"],input=pre+q,capture_output=True,text=True)
    if r.returncode and not ok_err: print("SQL-FEHLER:",r.stderr,q[:200]);sys.exit(1)
    return r.stdout.strip(),r.stderr.strip()
subprocess.run(H+["-d","postgres","-c","drop database if exists mat"],capture_output=True);subprocess.run(H+["-d","postgres","-c","create database mat"],check=True)
sql(open("/home/postgres/pgt/mock.sql").read().replace("create role anon nologin; create role authenticated nologin;",""))
sql(open("/home/claude/gh/datenbank.sql").read())
U={n:"00000000-0000-0000-0000-00000000000"+str(i) for i,n in enumerate(["A","W","M","X","L"],1)}
for n,u in U.items(): sql(f"insert into auth.users(id,email) values ('{u}','{n}@x')")
sql(f"update profiles set active=true; insert into docs(col,id,data) values ('werkstatt','{U['W']}','{{}}')")
sql(open("/home/claude/gh/rechte.sql").read())
sql(f"""insert into docs(col,id,data) values ('rolle','{U['M']}','{{"t":"monteur","x":{{}}}}'),('rolle','{U['X']}','{{"t":"lagerarbeiter","x":{{}}}}'),('rolle','{U['L']}','{{"t":"lagerleiter","x":{{}}}}'),
 ('lists','l1','{{"by":"{U['M']}","chk":false}}'),('lists','l2','{{"by":"{U['M']}","chk":false}}')""")
print(sql(open("/home/claude/gh/materialliste.sql").read())[0])
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
def upd(u,id,patch):
    o,e=sql(f"select doc_update('lists','{id}','{patch}'::jsonb) is not null",user=U[u],ok_err=True);return "ja" if o=="t" else "nein"
def dele(u,id):
    o,e=sql(f"with x as (delete from docs where col='lists' and id='{id}' returning 1) select count(*) from x",user=U[u]);return "ja" if o=="1" else "nein"
r=sql("select id, data->'r' from docs where col='titel' order by id")[0];print("   Titel:",r.replace("\n"," | "))
chk("Werkstatt-Häkchen alt → Extra mat_b",sql(f"select data->'x'->>'mat_b' from docs where col='rolle' and id='{U['W']}'")[0],"true")
chk("Monteur darf offene Liste bearbeiten (scannen)",upd("M","l1",'{"itemsJson":"{}"}'),"ja")
chk("Monteur darf NICHT abschließen",upd("M","l1",'{"chk":true}'),"nein")
chk("Lagerarbeiter darf abschließen",upd("X","l1",'{"chk":true}'),"ja")
chk("Monteur darf abgeschlossene Liste NICHT ändern",upd("M","l1",'{"note":"x"}'),"nein")
chk("Monteur darf NICHT wieder öffnen",upd("M","l1",'{"chk":false}'),"nein")
chk("Werkstatt (alt) darf wieder öffnen",upd("W","l1",'{"chk":false}'),"ja")
chk("Lagerarbeiter darf NICHT löschen",dele("X","l2"),"nein")
chk("Monteur darf NICHT löschen",dele("M","l2"),"nein")
chk("Lagerleiter darf löschen",dele("L","l2"),"ja")
o,e=sql(f"insert into docs(col,id,data) values ('lists','l3','{{\"by\":\"{U['M']}\",\"chk\":false}}')",user=U["M"],ok_err=True);chk("Monteur darf neue Liste anlegen","ja" if not e else e,"ja")
o,e=sql(f"insert into docs(col,id,data) values ('meta','x','{{}}')",user=U["L"],ok_err=True);chk("Nur Admin schreibt meta","nein" if e else "ja","nein")
sql("update docs set data=data #- '{r,mat_b}' where col='titel' and id='lagerarbeiter'");sql(open("/home/claude/gh/materialliste.sql").read())
chk("Nochmal ausführen setzt entferntes Recht NICHT zurück",sql("select coalesce(data->'r'->>'mat_b','weg') from docs where col='titel' and id='lagerarbeiter'")[0],"weg")
print("FEHLER GESAMT:",F)
