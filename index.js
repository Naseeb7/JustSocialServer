import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import { register } from "./controllers/auth.js"
import { createPost } from "./controllers/posts.js"
import { changePicture } from "./controllers/users.js"
import { verifyToken } from "./middleware/auth.js";
import http from "http"
import { Server } from "socket.io"
import User from "./models/User.js";
import Post from "./models/Posts.js";
import { users, posts } from "./data/index.js"

// Configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, 'public/assets')));

// File Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const upload = multer({ storage })

// Routes with Files
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost)
app.post("/users/:userId/changepicture", verifyToken, upload.single("picture"), changePicture)

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/message", messageRoutes);

// Mongoose setup
const PORT = process.env.PORT || 6001;
const server = http.createServer(app);

server.listen(PORT, () => {
    mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log(`Server live at port : ${PORT}`)

        // Add data only once
        // User.insertMany(users);
        // Post.insertMany(posts);
    }).catch((error) => console.log(`${error} did not connect`));
});

// Websocket setup
// change this while hosting to no cors
const io = new Server(server);

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.broadcast.emit("online-users", [...onlineUsers.keys()]);
    });
    socket.on("send-message", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("message-receive", data.message)
        }
    });
    socket.on("typing", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("typing-data", data.typing)
        }
    });
    socket.on("send-notification", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("get-notification", data)
        }
    });
    socket.on("disconnect", () => {
        onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                onlineUsers.delete(key)
            }
        })
        setTimeout(() => {
            socket.broadcast.emit("online-users", [...onlineUsers.keys()])
        }, 3000);
    });
})



