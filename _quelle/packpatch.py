# Packlisten (ab 1.57): Karte auf der Hauptseite + Ansichten (Code in pack.js, Auslesen in pkparse.js)
rep("""(can("jv_s")?T("jarvis",JV_ICON,""","""(can("pk_s")?T("pack",PK_ICON,'Packlisten',pkSub(),pkHot()):'')+(can("jv_s")?T("jarvis",JV_ICON,""")
rep('if(view==="start")return startView();','if(view==="pack"&&can("pk_s"))return packView();\n if(view==="packopen"&&can("pk_s"))return packOpenView();\n if(view.startsWith("pack")){view="start";hist=[]}\n if(view==="start")return startView();')
rep("</style>","\n.pkh{margin:16px 0 6px;font-size:16px}.pkh .mute{font-weight:400;font-size:14px}.pkfr{color:var(--bad);font-weight:600;font-style:normal}"
 ".tag.pkwarn{background:var(--bad);color:#fff;border-color:var(--bad)}.tag.pkhot{background:var(--navy);color:#fff;border-color:var(--navy)}.tag.pkok{background:var(--ok);color:#fff;border-color:var(--ok)}"
 ".pkkv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin-top:8px;font-size:14px}.pkkv span{color:var(--mute)}.pkkv b{font-weight:600;min-width:0;overflow-wrap:anywhere}"
 ".pkold{background:#fff6dc;border:1px solid #f2c200;border-radius:8px;padding:8px;font-size:14px;color:#5c4700}"
 ".pkl{padding:4px 12px}.pkp{display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.pkp:first-child{border-top:0}.pkn{flex:0 0 64px;font-weight:700;white-space:nowrap}.pkt{flex:1;min-width:0}.pkt small{color:var(--mute);margin-left:4px}.pkt em{display:block;font-size:13px}"
 "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]) .pkold{background:#3a3110;color:#f5dd8a}}:root[data-theme=\"dark\"] .pkold{background:#3a3110;color:#f5dd8a}</style>",1)
