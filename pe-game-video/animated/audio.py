import json, wave, numpy as np
SR=44100; ev=json.load(open('sfx.json')); dur=max(e['t'] for e in ev)+6
out=np.zeros(int(SR*dur)); rng=np.random.default_rng(1)
def env(n,a=0.005,r=None):
    t=np.arange(n)/SR; e=np.minimum(1,t/a); return e*np.exp(-t/(r or (n/SR/4)))
def tone(f,d,vol=0.3,r=None,kind='sin'):
    n=int(SR*d); t=np.arange(n)/SR; w=np.sin(2*np.pi*f*t) if kind=='sin' else np.sign(np.sin(2*np.pi*f*t))*0.5
    return w*env(n,r=r)*vol
def sweep(f0,f1,d,vol=0.3):
    n=int(SR*d); t=np.arange(n)/SR; f=np.linspace(f0,f1,n); ph=2*np.cumsum(f)/SR*np.pi
    return np.sin(ph)*env(n,r=d/2)*vol
def noise(d,vol=0.2,r=0.02):
    n=int(SR*d); return rng.standard_normal(n)*env(n,a=0.001,r=r)*vol
def add(sig,t):
    i=int(t*SR); j=min(len(out),i+len(sig)); out[i:j]+=sig[:j-i]
for e in ev:
    t,n=e['t'],e['name']
    if n=='dice':
        for k in range(9): add(noise(0.04,0.25,0.012),t+0.04+k*0.055*(1+k*0.08))
        add(noise(0.06,0.35,0.02),t+1.12)
    elif n=='hop': add(tone(660,0.09,0.16,0.03),t); add(tone(990,0.09,0.06,0.02),t)
    elif n=='ding': add(tone(1046,0.5,0.22,0.15),t); add(tone(1568,0.5,0.15,0.12),t+0.08)
    elif n=='bonk': add(sweep(300,140,0.35,0.3),t)
    elif n=='whoosh':
        s=noise(0.7,0.12,0.25); s=np.convolve(s,np.ones(30)/30,'same')*4; add(s,t); add(sweep(400,900,0.7,0.08),t)
    elif n=='card': add(noise(0.08,0.2,0.02),t)
    elif n=='shield': add(sweep(500,1200,0.4,0.18),t)
    elif n=='crack': add(noise(0.12,0.4,0.03),t); add(noise(0.08,0.3,0.02),t+0.15)
    elif n in('win','chime'):
        for k,f in enumerate([523,659,784,1046]): add(tone(f,0.6,0.18,0.2),t+k*0.11)
# soft music bed: pentatonic plucks
notes=[261.6,293.7,329.6,392,440,523.3]; beat=0.5; tt=0.0; i=0
prog=[[0,2,4,2],[1,3,5,3],[0,2,4,5],[1,4,2,3]]
while tt<dur-1:
    bar=prog[(i//4)%4]; f=notes[bar[i%4]]
    add(tone(f,0.45,0.045,0.18),tt); add(tone(f*2,0.3,0.015,0.1),tt)
    if i%4==0: add(tone(f/2,1.9,0.05,0.8),tt)
    tt+=beat; i+=1
fade=int(SR*3); out[-fade:]*=np.linspace(1,0,fade)
out=np.tanh(out*1.2)*0.85
with wave.open('audio.wav','w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',dur)
