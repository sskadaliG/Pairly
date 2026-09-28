const express = require('express');

const app = express();



app.get("/user/:userId/:name/:password/", (req, res) => {
    console.log(req.params);
    res.send("FirstName: Sri, LastName: kadali, Age: 22, Gender: Female")
});




app.listen(3000, () => {
    console.log("server is up and running!")
})