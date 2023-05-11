import User from "../models/User.js";
import Post from "../models/Posts.js";
import Comment from "../models/Comment.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt"
import fs from "fs"
import Notification from "../models/Notification.js";

// READ
export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
}
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({},{ firstName : 1, lastName : 1, picturePath: 1});
        res.status(200).json(users);
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
}

export const getUserFriends = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        const friends = await Promise.all(
            user.friends.map((id) => User.findById(id))
        );
        const formattedFriends = friends.map(
            ({ _id, firstName, lastName, occupation, location, picturePath }) => {
                return { _id, firstName, lastName, occupation, location, picturePath };
            }
        );
        res.status(200).json(formattedFriends)
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};

export const getUserNotifications = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('notifications');
        res.status(200).json(user.notifications)
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};
export const readAllNotifications = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.updateMany({toUserId : id},{
            $set : {
                read : true,
            }
        })
        const user = await User.findById(id).populate('notifications');
        res.status(200).json(user.notifications)
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};

// Update
export const addRemoveFriend = async (req, res) => {
    try {
        const { id, friendId } = req.params;
        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if (user !== friend) {
            if (user.friends.includes(friendId)) {
                const notification = new Notification({
                    userId: id,
                    toUserId: friendId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    type:"friend",
                    notification: `${user.firstName} ${user.lastName} removed you from friend.`,
                    userPicturePath: user.picturePath,
                });
                await notification.save();
                friend.notifications.push(notification)
                user.friends = user.friends.filter((id) => id !== friendId);
                friend.friends = friend.friends.filter((id) => id !== id);
            }
            else {
                const notification = new Notification({
                    userId: id,
                    toUserId: friendId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    type:"friend",
                    notification: `${user.firstName} ${user.lastName} added you as friend.`,
                    userPicturePath: user.picturePath,
                });
                await notification.save();
                friend.notifications.push(notification)
                user.friends.push(friendId);
                friend.friends.push(id);
            }
            await user.save();
            await friend.save();

            const friends = await Promise.all(
                user.friends.map((id) => User.findById(id))
            );
            const formattedFriends = friends.map(
                ({ _id, firstName, lastName, occupation, location, picturePath }) => {
                    return { _id, firstName, lastName, occupation, location, picturePath };
                }
            );

            res.status(200).json(formattedFriends);
        } else {
            res.status(404).json({ error: "You cannot add yourself as friend!" })
        }

    } catch (error) {
        res.status(404).json({ error: error.message })
    }
}

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, location, occupation, password } = req.body
        const userpwd = await User.findById(id)
        const comparePwd = await bcrypt.compare(password, userpwd.password)
        if (comparePwd) {
            await User.findByIdAndUpdate(id, {
                firstName: firstName,
                lastName: lastName,
                location: location,
                occupation: occupation
            });
            await Post.updateMany({ userId: id }, {
                $set: {
                    firstName: firstName,
                    lastName: lastName,
                    location: location,
                    occupation: occupation
                }
            })
            await Comment.updateMany({ userId: id }, {
                $set: {
                    firstName: firstName,
                    lastName: lastName,
                }
            })
            const user = await User.findById(id)
            res.status(200).json({ user, success: true })
        } else {
            res.status(404).json({ error: "Wrong Password", success: false })
        }

    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};

export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body
        const userpwd = await User.findById(id)
        const comparePwd = await bcrypt.compare(currentPassword, userpwd.password)
        if (comparePwd) {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(newPassword, salt);
            const user = await User.findByIdAndUpdate(id, { password: passwordHash });
            res.status(200).json({ user, success: true })
        } else {
            res.status(404).json({ error: "Wrong Password", success: false })
        }

    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};

export const changePicture = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPicturePath, newPicturePath } = req.body
        const directoryPath = "public/assets/";
        const exists = fs.existsSync(`${directoryPath}${currentPicturePath}`)

        if (exists) {
            fs.unlink(`${directoryPath}${currentPicturePath}`, async (err) => {
                if (err) {
                    res.status(500).send({
                        message: "Could not delete the file. " + err,
                    });
                }
            })
        }
        await User.findByIdAndUpdate(userId, { picturePath: newPicturePath });
        await Post.updateMany({ userId: userId }, {
            $set: {
                userPicturePath: newPicturePath,
            }
        })
        await Comment.updateMany({ userId: userId }, {
            $set: {
                userPicturePath: newPicturePath,
            }
        })
        const user = await User.findById(userId)
        res.status(200).json({ user, success: true })
    } catch (error) {
        res.status(404).json({ error: error.message, success: false })
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {password}=req.body;
        const directoryPath = "public/assets/";
        const user = await User.findById(id)
        const posts = await Post.find();
        const comparePwd = await bcrypt.compare(password, user.password)
        if(comparePwd){
            for (let i in posts) {
                const post = await Post.findById(posts[i]._id).populate('comments');
                const isLiked = post.likes.get(id);
                post.comments = post.comments.filter((comment) => comment.userId !== id)
                await post.save()
                if (isLiked) {
                    post.likes.delete(id);
                }
                await post.save()
                if (post.userId === id) {
                    const exists = fs.existsSync(`${directoryPath}${post.picturePath}`)
    
                    if (exists) {
                        fs.unlink(`${directoryPath}${post.picturePath}`, async (err) => {
                            if (err) {
                                res.status(500).send({
                                    message: "Could not delete the file. " + err,
                                });
                            }
                        })
                    }
                }
            }
    
            let friends = user.friends
            for (let j in friends) {
                const friend = await User.findById(friends[j])
                friend.friends = friend.friends.filter((id) => id !== id)
                await friend.save()
            }
            const exist = fs.existsSync(`${directoryPath}${user.picturePath}`)
    
                    if (exist) {
                        fs.unlink(`${directoryPath}${user.picturePath}`, async (err) => {
                            if (err) {
                                res.status(500).send({
                                    message: "Could not delete the file. " + err,
                                });
                            }
                        })
                    }
    
            await Post.deleteMany({ userId: id })
            await Comment.deleteMany({ userId: id })
            await Notification.deleteMany({ userId: id })
            await User.findByIdAndDelete(id)
            res.status(200).json({ success: true })
        }else{
            res.status(404).json({error: "Wrong Password!", success:false})
        }
    } catch (error) {
        res.status(404).json({ error: error.message })
    }

}