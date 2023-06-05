const express = require('express');

const app = express();

app.get('/test', (req, res) =>{
    res.json('test route')
});

app.listen(8800);
