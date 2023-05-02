import express from "express";
import {
    getUser,
    getUserFriends,
    addRemoveFriend,
    updateUser,
    changePassword,
    deleteUser
} from "../controllers/users.js";
import {verifyToken} from "../middleware/auth.js"

const router=express.Router();

// READ
router.get("/:id",verifyToken,getUser);
router.get("/:id/friends",verifyToken,getUserFriends);

// UPDATE
router.patch("/:id/:friendId",verifyToken,addRemoveFriend);
router.post("/:id/update",verifyToken,updateUser);
router.post("/:id/changepassword",verifyToken,changePassword);
router.post("/:id/deleteuser",verifyToken,deleteUser);

export default router;
