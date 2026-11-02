import subprocess,sys,json,re
H=["psql","-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A"]
def sql(q,user=None,ok_err=False,anon=False):
    pre="set role anon;\n" if anon else ("set role authenticated; select set_config('request.jwt.claim.sub','%s',false) \\g /dev/null\n"%user if user else "")
    r=subprocess.run(H+["-d","pk","-v","ON_ERROR_STOP=1"],input=pre+q,capture_output=True,text=True)
    if r.returncode and not ok_err: print("SQL-FEHLER:",r.stderr,q[:200]);sys.exit(1)
    return r.stdout.strip(),r.stderr.strip()
subprocess.run(H+["-d","postgres","-c","drop database if exists pk"],capture_output=True);subprocess.run(H+["-d","postgres","-c","create database pk"],check=True)
sql(open("/home/postgres/pgt/mock.sql").read().replace("create role anon nologin; create role authenticated nologin;",""))
sql(open("/home/claude/gh/datenbank.sql").read())
A,M="00000000-0000-0000-0000-00000000000a","00000000-0000-0000-0000-00000000000c"
sql(f"insert into auth.users(id,email) values ('{A}','a@x'),('{M}','m@x'); update profiles set active=true")
for f in ["rechte.sql","materialliste.sql","protokoll.sql","packliste.sql","auftraege.sql"]: sql(open("/home/claude/gh/"+f).read())
sql(f"""insert into docs(col,id,data) values ('rolle','{M}','{{"t":"monteur"}}') on conflict (col,id) do update set data=excluded.data""")
F=0
def chk(t,g,e):
    global F;ok=g==e;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {g}"+("" if ok else f" (erwartet {e})"))
o1=sql(open("/home/claude/gh/sicherung.sql").read())[0].splitlines()[-1]
m=re.search(r"Schlüssel \(.*\): ([0-9a-f]{64})$",o1);chk("Beim ersten Mal neuer Schlüssel angezeigt",bool(m),True);K=m.group(1) if m else ""
o2=sql(open("/home/claude/gh/sicherung.sql").read())[0].splitlines()[-1];chk("Nochmal ausführen: Schlüssel bleibt",("existiert schon" in o2),True)
chk("Nur Fingerabdruck gespeichert",sql(f"select count(*) from sicherung where wert='{K}'")[0],"0")
sql("""insert into docs(col,id,data) values ('retour','r1','{"ev":"Messe Linz","ord":"26001"}'),('fotos','r1-0','{"d":"x"}'),('fotos','r1-1','{"d":"y"}'),
 ('pack','p1','{"ev":"Gala","ord":"9"}'),('packh','p1','{"h_1":{"ok":true}}'),('hord','u9','{"o":[]}'),('defekte','d1','{"art":"VT 32A","by":"x"}'),('fotos','d1','{"d":"z"}'),('fotos','d1r-0','{"d":"w"}')""")
sql("delete from docs where col='retour' and id='r1'; delete from docs where col='fotos' and id like 'r1-%'; delete from docs where id='p1'; delete from docs where col='hord'",user=A)
chk("Gelöschtes landet im Papierkorb",sql("select string_agg(col||'/'||doc_id,',' order by nr) from papierkorb")[0],"retour/r1,fotos/r1-0,fotos/r1-1,pack/p1,packh/p1")
chk("Wer gelöscht hat, steht dabei",sql(f"select count(*) from papierkorb where deleted_by='{A}'")[0],"5")
chk("Monteur sieht Papierkorb nicht",sql("select count(*) from papierkorb",user=M)[0],"0")
chk("Monteur: Liste leer",sql("select count(*) from papierkorb_liste()",user=M)[0],"0")
chk("Admin: Liste",sql("select count(*) from papierkorb_liste()",user=A)[0],"5")
chk("Liste ohne große Daten, mit Veranstaltung",sql("select info->>'ev' from papierkorb_liste() where col='retour'",user=A)[0],"Messe Linz")
o,e=sql("insert into papierkorb(col,doc_id,data) values ('x','y','{}')",user=M,ok_err=True);chk("Monteur kann nichts hineinschreiben","nein" if e else "ja","nein")
o,e=sql("with x as (delete from papierkorb returning 1) select count(*) from x",user=A,ok_err=True);chk("Auch Admin kann den Korb nicht direkt leeren","nein" if e or o=="0" else "ja","nein")
nr=sql("select nr from papierkorb where col='retour'")[0]
o,e=sql(f"select papierkorb_zurueck({nr})",user=M,ok_err=True);chk("Monteur kann nicht wiederherstellen","nein" if e else "ja","nein")
o,e=sql(f"select papierkorb_zurueck({nr})",user=A);chk("Admin stellt Retourschein + Fotos wieder her",json.loads(o)["ok"],3)
chk("Retourschein + 2 Fotos wieder da",sql("select count(*) from docs where id in ('r1','r1-0','r1-1')")[0],"3")
nr=sql("select nr from papierkorb where col='pack'")[0]
o,e=sql(f"select papierkorb_zurueck({nr})",user=A);chk("Packliste + Herricht-Stand wieder da",sql("select count(*) from docs where id='p1'")[0],"2")
chk("Papierkorb danach leer",sql("select count(*) from papierkorb")[0],"0")
sql("delete from docs where col='defekte' and id='d1'; delete from docs where col='fotos' and id like 'd1%'",user=A)
sql("insert into docs(col,id,data) values ('defekte','d1','{\"art\":\"neu\"}')")
nr=sql("select nr from papierkorb where col='defekte'")[0]
o,e=sql(f"select papierkorb_zurueck({nr})",user=A);r=json.loads(o);chk("Schon wieder vorhanden: nicht überschreiben",(r["ok"],r["schon"]),(2,1))
chk("Neuer Defekt bleibt unverändert",sql("select data->>'art' from docs where col='defekte' and id='d1'")[0],"neu")
sql("insert into papierkorb(col,doc_id,data,deleted_at) values ('infos','alt','{}',now()-interval '31 days')")
sql("insert into docs(col,id,data) values ('infos','i1','{}'); delete from docs where col='infos' and id='i1'",user=A)
chk("Nach 30 Tagen automatisch weg",sql("select count(*) from papierkorb where doc_id='alt'")[0],"0")
# Sicherung
o,e=sql("select sicherung_docs('falsch',0,10)",anon=True,ok_err=True);chk("Falscher Schlüssel abgelehnt","Falscher" in e,True)
o,e=sql(f"select sicherung_docs('{K}',0,500)",anon=True);D=json.loads(o);chk("Richtiger Schlüssel (anon) liest alles",len(D),int(sql("select count(*) from docs")[0]))
chk("Auch Protokoll/Titel dabei",any(d["col"]=="titel" for d in D),True)
o,e=sql(f"select sicherung_docs('{K}',3,2)",anon=True);chk("Seitenweise",[d["id"] for d in json.loads(o)],[d["id"] for d in D[3:5]])
o,e=sql(f"select jsonb_array_length(sicherung_profile('{K}'))",anon=True);chk("Profile dabei",o,"2")
o,e=sql("select docs from docs limit 1",anon=True,ok_err=True)
o,e=sql("select count(*) from sicherung",anon=True,ok_err=True);chk("Schlüssel-Tabelle von außen nicht lesbar","nein" if e or o=="0" else "ja","nein")
o,e=sql("select sicherung_ok('x')",anon=True,ok_err=True);chk("Prüffunktion nicht direkt aufrufbar","nein" if e else "ja","nein")
sql(f"select sicherung_fertig('{K}',{len(D)})",anon=True)
o,e=sql("select sicherung_stand()",user=A);s=json.loads(o);chk("Stand für Admin",(s["schluessel"],s["n"]==len(D),s["zuletzt"] is not None),(True,True,True))
chk("Stand für Monteur leer",sql("select sicherung_stand() is null",user=M)[0],"t")
print("FEHLER GESAMT:",F)
