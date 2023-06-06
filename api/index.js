const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');


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

app.listen(8800, () =>{
    console.log("Server is running on port 8800");
});
