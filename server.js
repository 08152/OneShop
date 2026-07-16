const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./"));


// KI Modell laden

const ai = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "v1.1.json"),
        "utf8"
    )
);



function loadMemory(){

    return JSON.parse(
        fs.readFileSync(
            path.join(__dirname,"memory.json"),
            "utf8"
        )
    );

}



function saveMemory(data){

    fs.writeFileSync(
        path.join(__dirname,"memory.json"),
        JSON.stringify(data,null,2)
    );

}



// Zufälliges Element

function random(array){

    return array[
        Math.floor(Math.random()*array.length)
    ];

}



// Generator

function generateAnswer(question){


    question = question.toLowerCase();



    for(let topic of ai.knowledge){


        let found = false;


        for(let word of topic.keywords){

            if(question.includes(word)){

                found=true;
                break;

            }

        }



        if(found){


            let concepts =
            topic.concepts.slice(
                0,
                ai.generator.max_concepts
            );



            let template =
            random(topic.templates);



            let answer = template;



            concepts.forEach((text,index)=>{

                answer =
                answer.replace(
                    "{"+index+"}",
                    text
                );

            });



            return answer;

        }

    }



    return null;

}





// Chat API

app.post("/api/chat",(req,res)=>{


    let question =
    req.body.message;



    let memory = loadMemory();



    // zuerst Erinnerung prüfen

    for(let item of memory.knowledge){


        if(question.toLowerCase()
        .includes(item.question)){


            return res.json({

                answer:item.answer,
                source:"memory"

            });


        }

    }





    // neue Antwort erzeugen

    let answer =
    generateAnswer(question);



    if(answer){


        // speichern

        memory.knowledge.push({

            question:question.toLowerCase(),

            answer:answer

        });



        saveMemory(memory);



        return res.json({

            answer:answer,

            source:"generated"

        });


    }





    res.json({

        answer:
        "Das weiß ich noch nicht. Ich brauche mehr Daten.",

        source:"unknown"

    });



});






// Manuelles Lernen

app.post("/api/learn",(req,res)=>{


    let memory=loadMemory();



    memory.knowledge.push({

        question:req.body.question.toLowerCase(),

        answer:req.body.answer

    });



    saveMemory(memory);



    res.json({

        status:"gelernt"

    });


});






app.get("/api/status",(req,res)=>{


    res.json({

        online:true,

        model:ai.name,

        version:ai.version

    });


});






app.listen(

process.env.PORT || 3000,

()=>{

console.log(
"MiniKI v1.1 Generative Server läuft"
);

}

);
