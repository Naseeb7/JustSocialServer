import Post from "../models/Posts.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import fs from "fs"
import Notification from "../models/Notification.js";

// Create
export const createPost = async (req, res) => {
    try {
        const { userId, description, picturePath, location } = req.body;
        const user = await User.findById(userId);
        const newPost = new Post({
            userId,
            firstName: user.firstName,
            lastName: user.lastName,
            location: location != "" ? location : user.location,
            description,
            userPicturePath: user.picturePath,
            picturePath,
            likes: {}
        })
        await newPost.save();

        const posts = await Post.find();
        const userposts= await Post.find({userId})
        res.status(201).json({posts,userposts});

    } catch (error) {
        res.status(409).json({ message: error.message })
    }
};

// Read
export const getFeedPosts = async (req, res) => {
    try {
        const post = await Post.find();
        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const post = await Post.find({ userId });
        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}
export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('comments')
        res.status(200).json(post);

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

// Update
export const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const post = await Post.findById(id);
        const user = await User.findById(userId)
        const friend = await User.findById(post.userId)
        const isLiked = post.likes.get(userId);

        if (isLiked) {
            post.likes.delete(userId);
        }
        else {
            post.likes.set(userId, true)
            if (userId !== post.userId) {
                const notification = new Notification({
                    userId: userId,
                    toUserId:friend._id,
                    postId: id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    type: "post",
                    notification: `${user.firstName} ${user.lastName} liked your post.`,
                    userPicturePath: user.picturePath,
                    postPicturePath: post.picturePath,
                });
                await notification.save();
                friend.notifications.push(notification)
                await friend.save()
            }
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { likes: post.likes },
            { new: true }
        )
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

export const commentPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, firstName, lastName, userPicturePath } = req.body;
        const post = await Post.findById(id).populate('comments');
        const friend= await User.findById(post.userId)

        const comment = new Comment({
            userId: userId,
            firstName: firstName,
            lastName: lastName,
            comment: req.body.comment,
            userPicturePath: userPicturePath
        });
        await comment.save();
        post.comments.push(comment);
        await post.save()
        if (userId !== post.userId) {
            const notification = new Notification({
                userId: userId,
                toUserId:friend._id,
                postId: id,
                firstName: firstName,
                lastName: lastName,
                type: "post",
                notification: `${firstName} ${lastName} commented on your post.`,
                userPicturePath: userPicturePath,
                postPicturePath: post.picturePath,
            });
            await notification.save();
            friend.notifications.push(notification)
            await friend.save()
        }
        res.status(200).json(post);

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}


export const commentDelete = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        await Comment.findByIdAndDelete(commentId)
        const post = await Post.findById(id).populate('comments');
        await post.comments.remove(commentId)
        await post.save()
        res.status(200).json(post);

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}


export const deletePost = async (req, res) => {
    try {
        const { id,userId } = req.params;
        const { picturePath } = req.body;
        const directoryPath = "public/assets/";
        const exists = fs.existsSync(`${directoryPath}${picturePath}`)


        if (exists) {
            fs.unlink(`${directoryPath}${picturePath}`, async (err) => {
                if (err) {
                    res.status(500).send({
                        message: "Could not delete the file. " + err,
                    });
                }

                await Post.findByIdAndDelete(id)
                const posts = await Post.find()
                const userposts=await Post.find({userId})
                res.status(200).json({posts,userposts});
            })
        }

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}