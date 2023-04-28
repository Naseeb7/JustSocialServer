import Post from "../models/Posts.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

// Create
export const createPost = async (req,res)=>{
    try {
        const{userId,description,picturePath,location}=req.body;
        const user=await User.findById(userId);
        const newPost = new Post({
            userId,
            firstName: user.firstName,
            lastName: user.lastName,
            location:location!="" ? location : user.location,
            description,
            userPicturePath:user.picturePath,
            picturePath,
            likes:{}
        })
        await newPost.save();

        const post=await Post.find();
        res.status(201).json(post);

    } catch (error) {
        res.status(409).json({message:error.message})
    }
};

// Read
export const getFeedPosts=async (req,res)=>{
    try {
        const post=await Post.find();
        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({message:error.message})
    }
}

export const getUserPosts= async (req,res)=>{
    try {
        const {userId}=req.params;
        const post =await Post.find({userId});
        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({message:error.message})
    }
}
export const getPost= async (req,res)=>{
    try {
        const {id}=req.params;
        const post =await Post.findById(id).populate('comments')
        res.status(200).json(post);
        
    } catch (error) {
        res.status(404).json({message:error.message})
    }
}

// Update
export const likePost= async (req,res)=>{
    try {
        const {id}=req.params;
        const {userId}=req.body;
        const post =await Post.findById(id);
        const isLiked = post.likes.get(userId);

        if(isLiked){
            post.likes.delete(userId);
        }
        else{
            post.likes.set(userId, true)
        }

        const updatedPost= await Post.findByIdAndUpdate(
            id,
            {likes: post.likes},
            {new : true}
        )
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(404).json({message:error.message})
    }
}

export const commentPost=async (req,res)=>{
    try {
        const {id}=req.params;
        const {userId,firstName,lastName,userPicturePath}=req.body;
        const post =await Post.findById(id).populate('comments');

        const comment=new Comment({
            userId: userId,
            firstName: firstName,
            lastName: lastName,
            comment: req.body.comment,
            userPicturePath: userPicturePath
        });
        await comment.save();
        post.comments.push(comment);
        await post.save()
        res.status(200).json(post);

    } catch (error) {
        res.status(404).json({message:error.message})
    }
}


export const commentDelete=async (req,res)=>{
    try {
        const {id,commentId}=req.params;
        await Comment.findByIdAndDelete(commentId)
        const post =await Post.findById(id).populate('comments');
        await post.comments.remove(commentId)
        await post.save()
        res.status(200).json(post);

    } catch (error) {
        res.status(404).json({message:error.message})
    }
}


export const deletePost=async (req,res)=>{
    try {
        const {id}=req.params;
        await Post.findByIdAndDelete(id)
        const posts=await Post.find()
        res.status(200).json(posts);

    } catch (error) {
        res.status(404).json({message:error.message})
    }
}