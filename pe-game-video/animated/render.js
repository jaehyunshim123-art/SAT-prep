const { chromium } = require('playwright'); const fs=require('fs'); const {spawn}=require('child_process');
const FPS=30;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/scene.html'); await p.waitForTimeout(800);
const dur=await p.evaluate(()=>DURATION); fs.writeFileSync('sfx.json',JSON.stringify(await p.evaluate(()=>SFX)));
const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-preset','medium','video_only.mp4'],{stdio:['pipe','inherit','inherit']});
const n=Math.ceil(dur*FPS);
for(let i=0;i<n;i++){const d=await p.evaluate(t=>frame(t,0.93),i/FPS); const ok=ff.stdin.write(Buffer.from(d,'base64')); if(!ok) await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('frames',n,'dur',dur);})();
