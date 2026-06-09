import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'


const app = express();

// middlewares for accessing json data in code and setting/accessing cookies from browser
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);


import authRouter from "./routes/auth.routes.js"


app.use("/api/auth",authRouter)

app.get('/', (req, res) => { 
    res.send("Api running successfully")
} )

export default app;