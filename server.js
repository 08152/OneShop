const express = require("express");
const cors = require("cors");
const path = require("path");


const app = express();


const PORT = process.env.PORT || 3000;


app.use(cors());

app.use(express.static(__dirname));


app.get("/", (req,res)=>{

    res.sendFile(
        path.join(__dirname,"navigation.html")
    );

});


app.listen(PORT, "0.0.0.0", ()=>{

    console.log(
        "GPS Navi läuft auf Port " + PORT
    );

});
