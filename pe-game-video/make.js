const { chromium } = require('playwright');
const fs = require('fs');
const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1920px;height:1080px;font-family:Inter,'Noto Color Emoji',sans-serif;background:#2a1550;color:#1d1433;display:flex;align-items:center;justify-content:center}
.card{width:1780px;height:960px;background:#fffaf2;border:14px solid #f39c1f;border-radius:36px;padding:70px 90px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.tag{font-size:30px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#7b2ff7;margin-bottom:14px}
h1{font-size:92px;font-weight:900;line-height:1.05;color:#2a1550;margin-bottom:40px}
h1 em{font-style:normal;color:#7b2ff7}
.big{font-size:52px;line-height:1.35;font-weight:500}
ul,ol{font-size:50px;line-height:1.45;padding-left:60px;font-weight:500}
li{margin-bottom:14px}
b{color:#7b2ff7}
.row{display:flex;gap:40px;margin-top:10px}
.box{flex:1;background:#fff;border:5px solid #e4d6ff;border-radius:28px;padding:36px 40px;font-size:44px;line-height:1.35}
.box h3{font-size:54px;margin-bottom:14px;color:#2a1550}
.good{border-color:#3bb273}.bad{border-color:#e0533d}
.quote{font-size:46px;font-style:italic;color:#5a4a7a;margin-bottom:24px}
.power{background:#7b2ff7;color:#fff;border-radius:24px;padding:30px 40px;font-size:48px;line-height:1.35;margin-top:auto}
.power b{color:#ffd27a}
.note{margin-top:30px;background:#ffe9c7;border-radius:20px;padding:24px 34px;font-size:42px}
.center{align-items:center;justify-content:center;text-align:center}
.huge{font-size:180px;margin-bottom:20px}
.num{position:absolute;right:50px;bottom:30px;font-size:28px;color:#b5a7d1;font-weight:700}
`;
const slides = [
`<div class="card center"><div class="huge">🎓🌸</div><h1>The Road to <em>Graduation</em></h1><div class="big">How to Play</div></div>`,
`<div class="card"><div class="tag">The Goal</div><h1>Graduate first! 🎓</h1><div class="big">Roll the die and move along the board.<br><br>The first player to reach <b>Graduation</b> wins.<br>If time runs out first, the player <b>furthest along</b> wins.</div></div>`,
`<div class="card"><div class="tag">Setup</div><h1>Get ready</h1><ol><li>Everyone takes <b>5 flowers</b> 🌸 from the DOW box</li><li>Each player picks a <b>Value Card</b></li><li>Shuffle the <b>Refusal Skills</b> cards</li><li>Fill the <b>addiction eggs</b> 🥚</li><li>Set a <b>20-minute timer</b> ⏱️</li></ol></div>`,
`<div class="card"><div class="tag">Your Turn</div><h1>Roll, move, act 🎲</h1><ol><li><b>Roll</b> the die</li><li><b>Move</b> forward that many squares</li><li><b>Do</b> what the square says</li></ol><div class="note">🌸 Each flower = one Dimension of Well-Being (DOW)</div></div>`,
`<div class="card"><div class="tag">Squares</div><h1>Well-being squares</h1><div class="row"><div class="box good"><h3>➕ +1 DOW</h3>Take <b>1 flower</b> from the DOW box 🌸</div><div class="box bad"><h3>➖ −1 DOW</h3>Put <b>1 flower</b> back in the DOW box</div></div></div>`,
`<div class="card"><div class="tag">Squares</div><h1>Refusal skills &amp; addiction</h1><div class="row"><div class="box good"><h3>🛑 Refusal Skill</h3>Take the <b>short way</b>!</div><div class="box"><h3>🥚 Addiction Test</h3>Draw a slip from the egg.<br><br><b>Addicted:</b> keep going the long way.<br><b>Not addicted:</b> move ahead to Second Semester!</div></div></div>`,
`<div class="card"><div class="tag">Squares</div><h1>Gamble squares 🎰</h1><div class="row"><div class="box"><h3>Gamble: Choice</h3>You <b>may</b> bet on the website, or skip it.</div><div class="box"><h3>Gamble: Mandatory</h3>You <b>must</b> bet on the website.</div></div><div class="row" style="margin-top:36px"><div class="box good"><h3>Win 🏆</h3>Short way + <b>4 flowers</b></div><div class="box bad"><h3>Lose 💸</h3>Lose <b>1 flower</b></div></div></div>`,
`<div class="card"><div class="tag">Checkpoints ⭐</div><h1>End of each grade</h1><ol><li><b>Stop</b> at the checkpoint, even if your roll goes past it</li><li>You need <b>at least 2 flowers</b> to pass.<br>Fewer than 2? <b>Repeat the grade!</b></li><li>Draw a <b>Refusal Skills</b> card. It tells you to take the <b>short way</b> or the <b>long way</b></li></ol></div>`,
`<div class="card center"><div class="huge">🃏</div><h1>Value <em>Cards</em></h1><div class="big">Each value gives you a special power.<br><br><b>Special powers do not work on the drug path!</b></div></div>`,
`<div class="card"><div class="tag">Value Card</div><h1>🏀 Athlete</h1><div class="quote">"My body is my game. I keep it clean."</div><div class="big">You train hard. Alcohol, vaping and drugs slow you down and could get you kicked off the team.</div><div class="power"><b>Special power:</b> every time you land on a <b>+1 Physical</b> square, <b>roll again!</b></div></div>`,
`<div class="card"><div class="tag">Value Card</div><h1>💰 Future</h1><div class="quote">"I don't gamble with my future."</div><div class="big">You save your money and think before you spend. Gambling and substances drain your wallet.</div><div class="power"><b>Special power:</b> on a <b>−1 Financial</b> square, you <b>don't lose a flower!</b></div></div>`,
`<div class="card"><div class="tag">Value Card</div><h1>🤝 Friendship</h1><div class="quote">"I choose friends who make me better."</div><div class="big">Real friends support your goals and respect your "no."</div><div class="power"><b>Special power:</b> at a checkpoint, instead of drawing a card, <b>say a refusal skill out loud</b> and take the <b>short way!</b></div></div>`,
`<div class="card"><div class="tag">Value Card</div><h1>📚 Education</h1><div class="quote">"My future is worth working for."</div><div class="big">You won't let drugs, alcohol or gambling get in the way of your goals.</div><div class="power"><b>Special power:</b> on a <b>+1 Intellectual</b> square, take <b>2 flowers</b> instead of 1!</div></div>`,
`<div class="card center"><div class="huge">🏆</div><h1>How to <em>win</em></h1><div class="big">First to <b>Graduation</b> wins!<br>Timer runs out? The player <b>furthest along</b> wins.<br><br>Make good choices and keep your flowers blooming 🌸</div></div>`,
];
const durations=[5,6,8,6,6,8,9,10,6,8,8,8,8,6];
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1920,height:1080}});
  let list='';
  for(let i=0;i<slides.length;i++){
    const num = i>0?`<div class="num">${i}/${slides.length-1}</div>`:'';
    const html=`<html><head><style>${css}</style></head><body>${slides[i].replace(/<\/div>$/, num+'</div>')}</body></html>`;
    await p.setContent(html); await p.waitForTimeout(150);
    const f=`s${String(i).padStart(2,'0')}.png`; await p.screenshot({path:f});
    list+=`${f} ${durations[i]}\n`;
  }
  fs.writeFileSync('list.txt',list); await b.close();
})();
