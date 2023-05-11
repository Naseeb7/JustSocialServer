import express from "express";
import {
    addMessage,
    getAllMessages
} from "../controllers/messages.js";
import {verifyToken} from "../middleware/auth.js"

const router=express.Router();

// READ
router.post("/:id/addmessage",verifyToken,addMessage);
router.post("/:id/getallmessages",verifyToken,getAllMessages);

export default router;