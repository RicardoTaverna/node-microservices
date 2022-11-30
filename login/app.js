require("dotenv").config();
require("./config/database").connect();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const User = require("./model/user");
const auth = require("./middleware/auth");

app.use(express.json());

app.get("/healthcheck", (req, res) => {
    return res.status(200).json({
        message: "api healthcheck OK."
    })
})

app.get("/teapot", (req, res) => {
    return res.status(418).json({
        message: "Error TeaPot test."
    })
})

app.get("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome 🙌")
})

app.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        if(!(email && password && first_name && last_name)){
            res.status(400).send("All input is required");
        }

        const oldUser = await User.findOne({ email })
        if (oldUser) {
            res.status(409).send("User already exist.");
        }
        
        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            { expiresIn: "2h" }
        );
        user.token = token
        user.save()

        res.status(201).json(user)

    } catch (error){
        console.log(error)
    }
})

app.post("/login",  async (req, res) => {

    try {

        const { email, password } = req.body;
    
        if(!(email && password)){
            res.status(400).send("All input is required");
        }
    
        const user = await User.findOne({ email })
    
        if ( user && (bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                { expiresIn: "2h" }
            );
            user.token = token;
            user.save();
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials")

    } catch(error){
        console.log(error);
    }


})

module.exports = app;
