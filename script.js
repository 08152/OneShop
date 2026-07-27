const icon=document.getElementById("syntax");
const popup=document.getElementById("popup");
const allow=document.getElementById("allow");
const cancel=document.getElementById("cancel");
const terminal=document.getElementById("terminal");

let clicks=0;
let timer;

icon.onclick=function(){

clicks++;

if(clicks===1){

timer=setTimeout(()=>{

clicks=0;

},300);

}else{

clearTimeout(timer);

clicks=0;

popup.classList.remove("hidden");

}

};

cancel.onclick=function(){

popup.classList.add("hidden");

};

allow.onclick=function(){

popup.classList.add("hidden");

terminal.classList.remove("hidden");

startMatrix();

};

function startMatrix(){

const canvas=document.getElementById("matrix");
const ctx=canvas.getContext("2d");

canvas.width=terminal.clientWidth;
canvas.height=terminal.clientHeight;

const letters="01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@";
const size=16;

const columns=Math.floor(canvas.width/size);

const drops=[];

for(let i=0;i<columns;i++)
drops[i]=1;

function draw(){

ctx.fillStyle="rgba(0,0,0,.08)";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="#00ff55";
ctx.font=size+"px monospace";

for(let i=0;i<drops.length;i++){

const text=
letters[Math.floor(Math.random()*letters.length)];

ctx.fillText(text,i*size,drops[i]*size);

if(drops[i]*size>canvas.height&&Math.random()>0.97)
drops[i]=0;

drops[i]++;

}

requestAnimationFrame(draw);

}

draw();

}
