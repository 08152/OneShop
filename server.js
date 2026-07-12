const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static("public"));



let orders = [];


/* gespeicherte Bestellungen laden */

if(fs.existsSync("orders.json")){

    orders = JSON.parse(
        fs.readFileSync("orders.json")
    );

}



/* Bestellungen speichern */

function save(){

    fs.writeFileSync(
        "orders.json",
        JSON.stringify(orders,null,2)
    );

}



/*
Neue Bestellung
*/

app.post("/api/order",(req,res)=>{


    let order={

        id:Date.now(),

        date:new Date().toLocaleString(),

        items:req.body.items,

        total:req.body.total,

        status:"Offen"

    };


    orders.push(order);


    save();


    res.json({

        success:true,

        order:order

    });


});




/*
Alle Bestellungen
*/

app.get("/api/orders",(req,res)=>{


res.json(orders);


});





/*
Bestellung erledigen
*/

app.delete("/api/orders/:id",(req,res)=>{


let id=req.params.id;


orders=orders.filter(o=>o.id!=id);


save();


res.json({

success:true

});


});





/*
Status ändern
*/

app.put("/api/orders/:id",(req,res)=>{


let order=orders.find(
o=>o.id==req.params.id
);


if(order){

order.status=req.body.status;

save();

}


res.json({

success:true

});


});





app.listen(PORT,()=>{

console.log(
"GhostShop läuft auf Port "+PORT
);

});
