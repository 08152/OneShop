<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Automat</title>

<link rel="stylesheet" href="style.css">

<style>

body{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    min-height:100vh;
}

#slots{
    display:flex;
    gap:20px;
    margin:40px;
}

.slot{
    width:110px;
    height:110px;
    background:white;
    color:black;
    border-radius:15px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:60px;
    font-weight:bold;
}

.spinning{
    animation:spin .08s linear infinite;
}

@keyframes spin{

0%{transform:translateY(-5px);}
50%{transform:translateY(5px);}
100%{transform:translateY(-5px);}

}

#info{
    margin-top:25px;
    font-size:28px;
}

</style>

</head>
<body>

<h1>🎰 Automat</h1>

<div id="slots">

<div id="s1" class="slot">🍒</div>
<div id="s2" class="slot">🍋</div>
<div id="s3" class="slot">⭐</div>

</div>

<button onclick="drehen()">
Drehen
</button>

<br>

<a href="index.html">
<button>Zurück</button>
</a>

<div id="info"></div>

<script>

const emojis=[
"🍒",
"🍋",
"🍇",
"🍀",
"⭐",
"7️⃣"
];

function zufall(){

return emojis[Math.floor(Math.random()*emojis.length)];

}

function drehen(){

const slots=[
document.getElementById("s1"),
document.getElementById("s2"),
document.getElementById("s3")
];

document.getElementById("info").innerHTML="";

slots.forEach(s=>s.classList.add("spinning"));

let i=0;

const timer=setInterval(()=>{

slots.forEach(s=>s.textContent=zufall());

i++;

if(i>30){

clearInterval(timer);

slots.forEach(s=>s.classList.remove("spinning"));

const a=zufall();
const b=zufall();
const c=zufall();

slots[0].textContent=a;
slots[1].textContent=b;
slots[2].textContent=c;

if(a===b && b===c){

document.getElementById("info").innerHTML="🎉 Drei gleiche!";

}else if(a===b || a===c || b===c){

document.getElementById("info").innerHTML="✨ Zwei gleiche!";

}else{

document.getElementById("info").innerHTML="🙂 Keine Übereinstimmung.";

}

}

},80);

}

</script>

</body>
</html>
