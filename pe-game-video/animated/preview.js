const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/scene.html'); await p.waitForTimeout(500);
console.log('dur',await p.evaluate(()=>DURATION));
for(const t of process.argv.slice(2)){const d=await p.evaluate(t=>frame(+t),t);fs.writeFileSync(`/tmp/claude-0/-home-user-SAT-prep/308f0a95-d02f-58c6-aebc-7b33cd3508d2/scratchpad/f_${t}.jpg`,Buffer.from(d,'base64'));}
await b.close();})();
