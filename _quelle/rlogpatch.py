# Material-Protokoll: pro Retourschein, Knopf „Protokoll als Excel“ im geöffneten Schein (nur Admin)
rep('<button class="btn grey" id="rxl">Als Excel speichern</button>','<button class="btn grey" id="rxl">Als Excel speichern</button>\'+(owner?\'<button class="btn grey" id="rplx">Protokoll als Excel</button>\':\'\')+\'')
rep('$("#rxl").onclick=()=>retXl(r);','$("#rxl").onclick=()=>retXl(r);if($("#rplx"))$("#rplx").onclick=()=>rlogRetXl(r,$("#rplx"));')
