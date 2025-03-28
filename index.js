const express=require('express');
const multer=require('multer');
const cors=require('cors');
const path=require('path');
const bodyParser = require('body-parser');
const fs=require('fs');
const JSZip=require('jszip');

const port=5000;
const app=express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./Exampaper');
    },
    filename:function(req,file,cb){
        const name=Date.now()+path.extname(file.originalname);
        cb(null,name);
    }
})
const upload=multer({storage:storage});


function convert(){
    const zip=new JSZip();
    const imagepath="./Exampaper"

    fs.readdir(imagepath,(err,files)=>{
        if(err){
            console.error("Error in reading directory",err);
            return;
        }

        files.forEach((file)=>{
            const filepath=path.join(imagepath,file);
            const filecontent=fs.readFileSync(filepath);
            zip.file(file,filecontent);
        });

        zip.generateAsync({type:'nodebuffer'}).
          then((content)=>{
            fs.writeFileSync("./images.zip",content);

          }).catch((err)=>{
            console.log("Error in zip",err);
          })
           
    })
}


function update(user){
    
    try{
       let data=fs.readFileSync('./Data.json','utf8');
       let users=JSON.parse(data);
       users.push(user)
       fs.writeFileSync('./Data.json',JSON.stringify(users,null,2))
       console.log(users);
    }catch(err){
        console.log("Error in update",err);
    }
}


function deletedata(imagename){
    try{
       const data=fs.readFileSync('./Data.json','utf8');
       let users=JSON.parse(data);

       users=users.filter(user=>user.imagename != imagename);
       fs.unlinkSync(`./Exampaper/${imagename}`);

       fs.writeFileSync("./Data.json",JSON.stringify(users,null,2));
    }catch(err){     
           console.log("Error in del",err)
    }
    
}   




app.post('/upload',upload.single('image'),async(req,res)=>{
    if(req.file){
        const datajson=req.body;
        const imagefile=req.file;
        const newdata={"subject":datajson.subject,"branch":datajson.branch,"year":datajson.year,"imagename":imagefile.filename};
        const data=JSON.stringify(newdata);
        
        
        await update(newdata);
        convert();

        res.send({
            data:newdata
        })


        console.log("Update successfull");

    }
})

app.post('/delete',upload.none(),(req,res)=>{
    const data=req.body;
    deletedata(data.imagename);
    res.send("Delete successfully");    
})

app.post('/login',upload.none(),(req,res)=>{
    const data=req.body;
    const user=fs.readFileSync('./user.json','utf8');
    const newuser=JSON.parse(user);
    try{
        if(data.email==newuser.email && data.password==newuser.password){
            console.log("match");
            res.send("true");
        }else{
            res.send("false");
            console.log("not match")
            console.log(data)
            console.log(newuser)
        }
    }catch(err){
        console.log(err);
    }
})

app.get('/show',(req,res)=>{

    try{
        const data=fs.readFileSync('./Data.json','utf8');
        const image=(__dirname + `./Exampaper/data.imagename`); 
        res.send(data);
        console.log('send successful')
    }catch(err){
        console.log(err);
    }
    
})

app.get('/image',(req,res)=>{
    res.sendFile(__dirname+'/images.zip',(err)=>{
        if(err){
            console.log(err);
        }else{
            console.log("successful")
        }
    })
})


app.listen(port,()=>{
    console.log(`Server lisinging on http://localhost:${port}`);
})