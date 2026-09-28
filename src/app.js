const express = require('express');

const app = express();



app.get("/user", (req, res) => {
    res.send("FirstName: Sri, LastName: kadali, Age: 22, Gender: Female")
});

app.post("/user", (req, res) => {
    res.send("User created successfully")
});

app.delete("/user", (req, res) => {
    res.send("User deleted successfully")
});

app.use("/", (req, res) => {
    res.send("Hello dashboard")
});



app.listen(3000, () => {
    console.log("server is up and running!")
})