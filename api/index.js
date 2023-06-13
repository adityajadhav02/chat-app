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

dotenv.config();
try{
    mongoose.connect(process.env.MONGO_URL);
}catch(e){
    console.log(e);
}

const jwtSecret = process.env.JWT_SECRET_KEY;

const app = express();
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
        const hashedPassword = await bcrypt.hashSync(password, bcrypt.genSaltSync(10));
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
        console.log(e);
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
})

app.get('/profile', async (req, res) =>{
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

const server =  app.listen(8800, () =>{
        console.log("Server is running on port 8800");
});

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) =>{

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
        
        const {reciever, text} = messageData;
        if(reciever && text){

            const messageDoc = await Message.create({
                sender: connection.userId,
                reciever, 
                text, 
            });

            [...wss.clients].filter(c => c.userId === reciever)
            .forEach(c => c.send(JSON.stringify({
                text, 
                sender:connection.userId, 
                reciever,
                id: messageDoc._id,
            })));
        }
    });

    [...wss.clients].forEach(client =>{
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))
        }
        ))
    })
});