const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Render Port oder Standard 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Dateien
const ordersFile = path.join(__dirname, "orders.json");

// orders.json automatisch erstellen
if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(
        ordersFile,
        JSON.stringify([], null, 2),
        "utf8"
    );
}


// ==============================
// Bestellungen laden
// ==============================

function getOrders() {
    try {
        const data = fs.readFileSync(
            ordersFile,
            "utf8"
        );

        return JSON.parse(data);

    } catch (error) {

        return [];
    }
}


// ==============================
// Bestellungen speichern
// ==============================

function saveOrders(orders) {

    fs.writeFileSync(
        ordersFile,
        JSON.stringify(
            orders,
            null,
            2
        ),
        "utf8"
    );
}


// ==============================
// Webseite ausliefern
// ==============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


// ==============================
// Alle Bestellungen abrufen
// GET /api/orders
// ==============================

app.get("/api/orders", (req, res)=>{

    res.json(
        getOrders()
    );

});


// ==============================
// Neue Bestellung erstellen
// POST /api/orders
// ==============================

app.post("/api/orders",(req,res)=>{

    const orders = getOrders();

    const newOrder = {

        id: Date.now(),

        datum:
        new Date().toLocaleString("de-DE"),

        artikel:
        req.body.artikel || [],

        preis:
        req.body.preis || 0,

        status:
        "Offen"

    };


    orders.push(newOrder);

    saveOrders(orders);


    res.json({

        success:true,

        order:newOrder

    });

});


// ==============================
// Bestellung löschen
// DELETE /api/orders/:id
// ==============================

app.delete("/api/orders/:id",(req,res)=>{

    let orders = getOrders();


    orders =
    orders.filter(
        order =>
        order.id != req.params.id
    );


    saveOrders(orders);


    res.json({

        success:true

    });

});


// ==============================
// Bestellung bearbeiten
// PUT /api/orders/:id
// ==============================

app.put("/api/orders/:id",(req,res)=>{

    let orders = getOrders();


    const index =
    orders.findIndex(
        order =>
        order.id == req.params.id
    );


    if(index === -1){

        return res.status(404).json({

            error:
            "Bestellung nicht gefunden"

        });

    }


    orders[index] = {

        ...orders[index],

        ...req.body

    };


    saveOrders(orders);


    res.json({

        success:true,

        order:
        orders[index]

    });

});


// ==============================
// Server starten
// ==============================

app.listen(PORT,()=>{

    console.log(
        `GhostShop läuft auf Port ${PORT}`
    );

});
