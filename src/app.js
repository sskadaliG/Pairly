const express = require('express');

const app = express();


app.use("/text", (req, res) => {
    res.send("Hello from express!")
})

app.use("/hello", (req, res) => {
    res.send("Hello Sri!")
});
app.use("/", (req, res) => {
    res.send("Hello dashboard")
});





app.listen(3000, () => {
    console.log("server is up and running!")
})