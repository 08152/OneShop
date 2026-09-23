const express=require("express");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");

const app=express();

const PORT=process.env.PORT||10000;

app.use(express.json({
  limit:"20kb"
}));

app.use(express.static(__dirname));

function safeName(name){

  return String(name||"Meine Website")
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g,"")
    .replace(/\s+/g,"-")
    .replace(/-+/g,"-")
    .slice(0,50)||"Meine-Website";
}

function checkUrl(value){

  try{

    const u=new URL(value);

    if(
      u.protocol!=="https:" &&
      u.protocol!=="http:"
    ){
      return false;
    }

    if(
      u.username ||
      u.password
    ){
      return false;
    }

    return true;

  }catch{

    return false;
  }
}

app.post("/api/create",(req,res)=>{

  try{

    const name=safeName(req.body.name);
    const url=String(req.body.url||"").trim();

    if(!checkUrl(url)){

      return res.status(400).json({
        error:"Nur gültige HTTP/HTTPS-Webseiten sind erlaubt."
      });

    }

    const id=crypto
      .randomBytes(12)
      .toString("hex");

    /*
      Die URL wird absichtlich nicht auf dem Render-
      Server ausgeführt. Sie wird nur als Text für
      den Windows-App-Build gespeichert.
    */

    const buildDir=path.join(
      __dirname,
      "generated",
      id
    );

    fs.mkdirSync(buildDir,{
      recursive:true
    });

    const electronMain=`

const {
  app,
  BrowserWindow,
  session
}=require("electron");

const TARGET_URL=${JSON.stringify(url)};

function createWindow(){

  const win=new BrowserWindow({

    width:1280,
    height:800,

    minWidth:800,
    minHeight:500,

    autoHideMenuBar:true,

    webPreferences:{
      nodeIntegration:false,
      contextIsolation:true,
      sandbox:true,
      webSecurity:true
    }

  });

  /*
    Keine Datei-Navigation erlauben.
  */

  win.webContents.on(
    "will-navigate",
    (event,navigationUrl)=>{

      try{

        const current=new URL(navigationUrl);

        if(
          current.protocol!=="https:" &&
          current.protocol!=="http:"
        ){
          event.preventDefault();
        }

      }catch{

        event.preventDefault();

      }

    }
  );

  /*
    Keine Electron-Permissions.
  */

  win.webContents.session
    .setPermissionRequestHandler(
      (webContents,permission,callback)=>{
        callback(false);
      }
    );

  win.loadURL(TARGET_URL);
}

app.whenReady().then(()=>{

  session.defaultSession
    .setPermissionRequestHandler(
      (webContents,permission,callback)=>{
        callback(false);
      }
    );

  createWindow();

  app.on("activate",()=>{

    if(
      BrowserWindow
        .getAllWindows()
        .length===0
    ){
      createWindow();
    }

  });

});

app.on(
  "window-all-closed",
  ()=>{
    if(process.platform!=="darwin"){
      app.quit();
    }
  }
);
`;

    const packageJson={

      name:
        name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g,"-"),

      version:"1.0.0",

      private:true,

      description:
        `Website wrapper for ${name}`,

      main:"main.js",

      scripts:{
        dist:"electron-builder --win msi"
      },

      devDependencies:{
        electron:"38.2.0",
        "electron-builder":"26.0.12"
      },

      build:{

        appId:
          "com.websitewrapper."+
          crypto.randomBytes(5).toString("hex"),

        productName:name,

        directories:{
          output:"dist"
        },

        files:[
          "main.js",
          "package.json"
        ],

        win:{
          target:[
            {
              target:"msi",
              arch:["x64"]
            }
          ]
        }

      }

    };

    fs.writeFileSync(
      path.join(buildDir,"main.js"),
      electronMain
    );

    fs.writeFileSync(
      path.join(buildDir,"package.json"),
      JSON.stringify(
        packageJson,
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(buildDir,"url.txt"),
      url
    );

    res.json({
      ok:true,
      id,
      name,
      url
    });

  }catch(error){

    res.status(500).json({
      error:"Serverfehler: "+error.message
    });

  }

});

app.get("/api/health",(req,res)=>{

  res.json({
    ok:true
  });

});

app.listen(PORT,()=>{

  console.log(
    "Server läuft auf Port "+PORT
  );

});
