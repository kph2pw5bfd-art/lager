rep("""o.innerHTML='<div>Artikel erfasst</div><b></b>';o.querySelector("b").textContent=code;document.body.appendChild(o);""",
 """o.innerHTML='<div>Artikel erfasst</div><b></b><div class="okn"></div>';o.querySelector("b").textContent=code;o.querySelector(".okn").textContent=artName(code);document.body.appendChild(o);beep(true);""")
rep("""function errBox(t){if(document.querySelector(".eov"))return;""","""function errBox(t){if(typeof stream!=="undefined"&&(stream||zr))beep(false);if(document.querySelector(".eov"))return;""")
rep("else{pendQ=a;draw();","else{pendQ=a;beep(true);draw();")
rep('async function cam(){if(stream||zr)return stop(true);','async function cam(){if(stream||zr)return stop(true);audioUnlock();')
