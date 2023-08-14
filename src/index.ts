import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";

//Creating socket.io server
const app = express();
const server = require("http").createServer(app);
const io = new Server(server);

const list_users: {[usernama: string]: string} = {};

//Detects new connection and executes content
io.on('connection', (socket) => {

  console.log('a user connected: ' + socket.id);

  // login
  socket.on('login', async ({ email, password }) => {
    try{
      const response = await fetch('http://localhost:3000/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if(response.ok){
        const user = await response.json();
        socket.emit('login', { user });
      }
      
      const error = await response.json();
      socket.emit('login', { error });
    }catch(error){
      console.log(error);
    }
  });
  
  //Prints msg on emit('message') in chat.js
  socket.on('sendMessage', (message : string) => {
    io.emit('sendMessage', {message});
  });

  // Prints desconnection users on console
  socket.on('disconnect', () => {
    delete list_users[socket.id]
    io.emit('activeSessions', list_users)
    console.log('user disconnected: ' + socket.id);
  });
});

app.use(express.static(__dirname));

//Shows index.html file as the default/home page
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, '../src', '/www', 'login.html'));
});

//When localhost:3000/chat.js, locate and send chat.js file
app.get('/chat.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist', '/www', '/ts', 'chat.js'));
});

app.get('/login.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist', '/www', '/ts', 'login.js'));
});

app.get('/register.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist', '/www', '/ts', 'register.js'));
});

app.use(express.json());

//Routers
app.use("/api/v1/users", userRouter);

dotenv.config();

const PUERTO = process.env.PORT || 3000;
const url = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@hi-chat.iofmsjz.mongodb.net/?retryWrites=true&w=majority`

const connectMongoDb = async () => {
  try{
    await mongoose.connect(url);
    console.log("Successfully connected to MongoDB");
  }catch(e){
    console.log("Failed to connect to MongoDB: " + e);
  }
};

connectMongoDb();

server.listen(PUERTO, () => {
  console.log(`The server is listening on the port ${PUERTO}...`);
});