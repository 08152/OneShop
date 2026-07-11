const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");


const app = express();
const server = http.createServer(app);

const io = new Server(server);


const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.static(__dirname));


let users = [];

let online = {};


// Nutzer laden

if(fs.existsSync("users.json")){

    users = JSON.parse(
        fs.readFileSync("users.json")
    );

}



// speichern

function saveUsers(){

    fs.writeFileSync(
        "users.json",
        JSON.stringify(users,null,2)
    );

}




app.get("/",(req,res)=>{

    res.sendFile(
        path.join(__dirname,"index.html")
    );

});





// Registrierung

app.post("/register",(req,res)=>{


const {email,pin,name}=req.body;



if(users.find(u=>u.email===email)){

    return res.json({
        success:false,
        message:"Account existiert bereits"
    });

}



users.push({

    email,
    pin,
    name

});


saveUsers();



res.json({

success:true

});


});






// Login

app.post("/login",(req,res)=>{


const {email,pin}=req.body;



let user =
users.find(
u=>u.email===email && u.pin===pin
);



if(!user){

return res.json({

success:false

});

}



res.json({

success:true,

name:user.name

});


});








io.on("connection",(socket)=>{



socket.on("join",(name)=>{


online[socket.id]=name;


io.emit(
"users",
Object.values(online)
);


});






socket.on("message",(text)=>{


if(!online[socket.id])
return;



io.emit(
"message",
{

user:online[socket.id],

text,

time:
new Date()
.toLocaleTimeString()

}

);


});







socket.on("disconnect",()=>{


delete online[socket.id];


io.emit(
"users",
Object.values(online)
);


});



});







server.listen(PORT,()=>{

console.log(
"GhostChat läuft auf Port "+PORT
);

});
