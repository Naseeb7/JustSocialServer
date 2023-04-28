import express from "express";
import { getFeedPosts,getUserPosts,likePost,commentPost,getPost,commentDelete,deletePost } from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router=express.Router();

// Read
router.get("/",verifyToken,getFeedPosts);
router.get("/:userId/posts",verifyToken,getUserPosts);
router.get("/:id",verifyToken,getPost);

// Update
router.patch("/:id/like",verifyToken,likePost);
router.delete("/:id/deletepost",verifyToken,deletePost);
router.patch("/:id/comment",verifyToken,commentPost);
router.delete("/:id/commentdelete/:commentId",verifyToken,commentDelete);


export default router;