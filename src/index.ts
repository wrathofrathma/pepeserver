import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send({message: "Hello world!"});
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})