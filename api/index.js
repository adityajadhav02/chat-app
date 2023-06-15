//  this is the deploy branch
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const ws = require('ws');
const Message = require('./models/Message');
const fs = require('fs');

dotenv.config();
try{
    mongoose.connect(process.env.MONGO_URL);
}catch(e){
    console.log(e);
}

const jwtSecret = process.env.JWT_SECRET_KEY;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/fileUpload', express.static(__dirname + '/fileUpload'));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    credentials: true, 
    origin: process.env.CLIENT_URL,
}));

app.get('/test', (req, res) =>{
    res.json('test route')
});

app.post('/register', async (req, res) =>{
    const {username, password} = req.body;

    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username: username,
            password: hashedPassword,
        });
        jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (err, token) =>{
            if(err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createdUser._id,
            });
        });

    }catch(e){
        if(e) throw e;
        res.status(500).json('error');
    }
});

app.post('/login', async (req, res)=>{
    const {username, password} = req.body;
    const foundUser = await User.findOne({username})
    if(foundUser){
        const passCheck = bcrypt.compareSync(password, foundUser.password);
        if(passCheck){
            jwt.sign({userId: foundUser._id, username}, jwtSecret, {}, (err, token) =>{
                if(err) throw err;
                res.cookie('token', token, {sameSite:'none', secure:true}).json({
                    id: foundUser._id,
                })
            })
        }
    }
});

app.post('/logout', (req, res) =>{
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok')
})

app.get('/profile', (req, res) =>{
    const token = req.cookies?.token;
    if(token){
        jwt.verify(token, jwtSecret, {}, (err, userData) =>{
            if(err) throw err;
            res.json(userData);
        })
    }
    else{
        res.status(401).json('no token');
    }
});

app.get('/people', async (req, res) =>{
    const users = await User.find({}, {'_id':1, username: 1});
    res.json(users);
})

async function getUserDataFromRequest(req){
    return new Promise((resolve, reject) =>{
        const token = req.cookies?.token;
        if(token){
            jwt.verify(token, jwtSecret, {}, (err, userData) =>{
                if(err) throw err;
                resolve(userData)
            })
        }
        else{
            reject('no token');
        }
    })
}

app.get("/messages/:userId", async (req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: {$in:[userId, ourUserId]},
        reciever: {$in:[userId, ourUserId]},
    }).sort({createdAt: 1})
    res.json(messages);
})

const server =  app.listen(8800, () =>{
        console.log("Server is running on port 8800");
});

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) =>{

    function notifyAboutOnlineUsers() {
        [...wss.clients].forEach(client =>{
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))
            }
            ))
        })
    }

    connection.isAlive = true;
    connection.timer = setInterval(() =>{
        connection.ping();
        connection.deathTimer = setTimeout(() =>{
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlineUsers();
        }, 1000)
    }, 5000)

    connection.on('pong', () =>{
        clearTimeout(connection.deathTimer);
    });

    // get username and id from cookie
    const cookies = req.headers.cookie;
    if(cookies){
        const tokenString = cookies.split('; ').find(str => str.startsWith('token='));
        if(tokenString){
            const token = tokenString.split('=')[1];
            if(token){
                jwt.verify(token, jwtSecret, {}, (err, userData) =>{
                    if(err) throw err;
                    
                    // else we have the user data in data var
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                })  
            }
        }
    }

    connection.on('message', async (message) =>{
        const messageData = JSON.parse(message.toString());
        
        const {reciever, text, file} = messageData;
        let filename = null;
        if(file){
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
             filename = Date.now()+'.'+ext;
            const path = __dirname+'/fileUpload/'+filename;

            // to decode the file
            const bufferData = new Buffer(file.data.split(',')[1], 'base64');
            fs.writeFile(path, bufferData, () =>{
                console.log('file saved : '+path);
            })
        }
        if(reciever && (text || file)){
            const messageDoc = await Message.create({
                sender: connection.userId,
                reciever, 
                text, 
                file: file ? filename : null ,
            });

            [...wss.clients].filter(c => c.userId === reciever)
            .forEach(c => c.send(JSON.stringify({
                text, 
                sender:connection.userId, 
                reciever,
                file: file ? filename : null,
                _id: messageDoc._id,
            })));
        }
    });

   notifyAboutOnlineUsers();
});