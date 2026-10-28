import subprocess,sys
H=["psql","-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A"]
def sql(q,db="lager",user=None,ok_err=False):
    pre=""
    if user: pre="set role authenticated; select set_config('request.jwt.claim.sub','%s',false) \\g /dev/null\n"%user
    r=subprocess.run(H+["-d",db,"-v","ON_ERROR_STOP=1"],input=pre+q,capture_output=True,text=True)
    if r.returncode and not ok_err: print("SQL-FEHLER:",r.stderr,q[:200]);sys.exit(1)
    return (r.stdout.strip(), r.stderr.strip())
subprocess.run(H+["-d","postgres","-c","drop database if exists lager"],capture_output=True)
subprocess.run(H+["-d","postgres","-c","create database lager"],check=True)
sql(open("/home/postgres/pgt/mock.sql").read())
sql(open("/home/claude/gh/datenbank.sql").read())
U={n:"00000000-0000-0000-0000-00000000000"+str(i) for i,n in enumerate(["A","W","L","M","P","X","I"],1)}
for n,u in U.items(): sql(f"insert into auth.users(id,email) values ('{u}','{n}@x')")
sql(f"update profiles set active=true; update profiles set active=false where id='{U['I']}'")
sql(f"""insert into docs(col,id,data) values ('werkstatt','{U['W']}','{{}}'),('lager','{U['L']}','{{}}'),
 ('defekte','d1','{{"by":"{U['M']}","art":"Kabel"}}'),('defekte','d2','{{"by":"{U['W']}","art":"Lampe"}}'),
 ('retour','r1','{{"ev":"Messe","by":"{U['A']}"}}'),('retour','r2','{{"ev":"Zelt","by":"{U['A']}"}}'),
 ('infos','i1','{{"by":"{U['M']}","text":"Hallo"}}'),('infos','i2','{{"by":"{U['P']}","text":"Hi"}}'),
 ('lists','l1','{{"by":"{U['M']}"}}'),('artikel','1234','{{"name":"x"}}')""")
print("Admin:",sql("select id,role,active from profiles order by id")[0].replace("\n"," | "))
print(sql(open("/home/claude/gh/rechte.sql").read())[0])
print("2. Lauf:",sql(open("/home/claude/gh/rechte.sql").read())[0])
sql(f"""insert into docs(col,id,data) values ('rolle','{U['M']}','{{"t":"monteur","x":{{}}}}'),('rolle','{U['P']}','{{"t":"projektleiter","x":{{}}}}'),('rolle','{U['X']}','{{"t":"lagerarbeiter","x":{{"def_s":true}}}}'),('rolle','{U['I']}','{{"t":"chef"}}')""")
print("Rollen:",sql("select id,data from docs where col='rolle' order by id")[0].replace("\n"," | "))
F=0
def chk(t,got,exp):
    global F
    ok=got==exp;F+=not ok;print(("OK   " if ok else "FEHLT")+f" {t}: {got}"+("" if ok else f"  (erwartet {exp})"))
def rd(u,col): return sql(f"select string_agg(id,',' order by id) from docs where col='{col}'",user=U[u])[0]
def upd(u,col,id,patch='{"z":1}'):
    o,e=sql(f"select doc_update('{col}','{id}','{patch}'::jsonb) is not null",user=U[u],ok_err=True);return "ja" if o=="t" else "nein"
def dele(u,col,id):
    o,e=sql(f"with x as (delete from docs where col='{col}' and id='{id}' returning 1) select count(*) from x",user=U[u]);return "ja" if o=="1" else "nein"
def ins(u,col,id,data):
    o,e=sql(f"insert into docs(col,id,data) values ('{col}','{id}','{data}')",user=U[u],ok_err=True);return "ja" if not e else "nein"
# Lesen
chk("Monteur sieht Defekte (nur eigene)",rd("M","defekte"),"d1")
chk("Werkstatt (altes Häkchen) sieht alle Defekte",rd("W","defekte"),"d1,d2")
chk("Admin sieht alle Defekte",rd("A","defekte"),"d1,d2")
chk("Monteur sieht keine Retourscheine",rd("M","retour"),"")
chk("Lager (altes Häkchen) sieht Retourscheine",rd("L","retour"),"r1,r2")
chk("Projektleiter sieht Retourscheine",rd("P","retour"),"r1,r2")
chk("Lagerarbeiter sieht Retourscheine",rd("X","retour"),"r1,r2")
chk("Lagerarbeiter liest alle Infos",rd("X","infos"),"i1,i2")
chk("Lagerarbeiter + Extra Defekte sehen",rd("X","defekte"),"d1,d2")
chk("Monteur sieht nur eigene Info",rd("M","infos"),"i1")
chk("Gesperrter Chef sieht nichts",rd("I","retour")+"|"+rd("I","defekte"),"|")
# Ändern
chk("Projektleiter (nur sehen) darf Retourschein NICHT ändern",upd("P","retour","r1"),"nein")
chk("Lagerarbeiter darf Retourschein ändern",upd("X","retour","r1"),"ja")
chk("Lager alt darf Retourschein ändern",upd("L","retour","r1"),"ja")
chk("Monteur darf Retourschein NICHT anlegen",ins("M","retour","r9",'{"ev":"x"}'),"nein")
chk("Lagerarbeiter darf Defekt NUR sehen, nicht ändern",upd("X","defekte","d1",'{"done":true}'),"nein")
chk("Werkstatt darf Defekt erledigen",upd("W","defekte","d1",'{"done":true}'),"ja")
chk("Monteur darf eigenen Defekt ändern",upd("M","defekte","d1",'{"desc":"neu"}'),"ja")
chk("Monteur darf fremden Defekt NICHT ändern",upd("M","defekte","d2"),"nein")
chk("Monteur darf Defekt melden",ins("M","defekte","d3",'{"by":"%s","art":"Neu"}'%U["M"]),"ja")
chk("Monteur darf Defekt NICHT im Namen anderer melden",ins("M","defekte","d4",'{"by":"%s"}'%U["W"]),"nein")
chk("Lagerarbeiter darf Info beantworten",upd("X","infos","i1",'{"reply":"ok"}'),"ja")
chk("Projektleiter darf fremde Info NICHT ändern",upd("P","infos","i1"),"nein")
chk("Monteur darf Titel NICHT ändern",upd("M","titel","monteur",'{"r":{"ret_s":true}}'),"nein")
chk("Monteur darf sich keine Rolle geben",ins("M","rolle",U["M"]+"x",'{"t":"chef"}'),"nein")
chk("Monteur darf Artikel NICHT ändern",upd("M","artikel","1234"),"nein")
# Löschen
chk("Lagerarbeiter darf Retourschein NICHT löschen",dele("X","retour","r2"),"nein")
chk("Lager alt darf Retourschein löschen",dele("L","retour","r2"),"ja")
chk("Werkstatt (sehen+bearbeiten) darf Defekt NICHT löschen",dele("W","defekte","d2"),"nein")
chk("Monteur darf eigenen Defekt NICHT löschen",dele("M","defekte","d1"),"nein")
chk("Lagerarbeiter darf Info NICHT löschen",dele("X","infos","i2"),"nein")
chk("Monteur darf eigene Materialliste löschen (wie bisher)",dele("M","lists","l1"),"ja")
# Titel ändern wirkt sofort
sql("update docs set data=jsonb_set(data,'{r,def_l}','true') where col='titel' and id='lagerarbeiter'")
chk("Lagerarbeiter-Titel bekommt Defekte löschen -> darf löschen",dele("X","defekte","d2"),"ja")
# Verwaltung
sql(f"insert into docs(col,id,data) values ('rolle','{U['L']}','{{\"t\":\"lagerleiter\",\"x\":{{}}}}') on conflict (col,id) do update set data=excluded.data")
chk("Lagerleiter darf Titel ändern",upd("L","titel","monteur",'{"name":"Monteur"}'),"ja")
chk("Lagerleiter darf Rolle vergeben",ins("L","rolle",U["P"]+"",'{"t":"monteur"}')+"/"+upd("L","rolle",U["P"],'{"t":"monteur"}'),"nein/ja")
chk("Lagerleiter darf Artikel ändern",upd("L","artikel","1234"),"ja")
o,e=sql(f"select admin_set_user('{U['M']}',false,'user')",user=U["L"],ok_err=True);chk("Lagerleiter darf Benutzer sperren","ja" if not e else e,"ja")
o,e=sql(f"select admin_set_user('{U['M']}',true,'admin')",user=U["L"],ok_err=True);chk("Lagerleiter darf NICHT zum Admin machen","nein" if e else "ja","nein")
o,e=sql(f"select admin_set_user('{U['A']}',false,'user')",user=U["L"],ok_err=True);chk("Lagerleiter darf Admin NICHT sperren","nein" if e else "ja","nein")
o,e=sql(f"select admin_set_user('{U['M']}',true,'user')",user=U["P"],ok_err=True);chk("Projektleiter darf Benutzer NICHT freigeben","nein" if e else "ja","nein")
o,e=sql(f"select admin_set_user('{U['M']}',true,'user')",user=U["A"],ok_err=True);chk("Admin darf freigeben","ja" if not e else e,"ja")
print("\nFEHLER GESAMT:",F)
