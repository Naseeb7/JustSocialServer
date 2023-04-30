import User from "../models/User.js";
import Post from "../models/Posts.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt"

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

export const getUserFriends = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        const friends =await Promise.all(
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

// Update
export const addRemoveFriend=async (req,res)=>{
    try {
        const {id,friendId}=req.params;
        const user=await User.findById(id);
        const friend=await User.findById(friendId);

        if(user!==friend){
            if(user.friends.includes(friendId)){
                user.friends=user.friends.filter((id)=>id !== friendId);
                friend.friends=friend.friends.filter((id)=>id !== id);
            }
            else{
                user.friends.push(friendId);
                friend.friends.push(id);
            }
            await user.save();
            await friend.save();
    
            const friends =await Promise.all(
                user.friends.map((id) => User.findById(id))
            );
            const formattedFriends = friends.map(
                ({ _id, firstName, lastName, occupation, location, picturePath }) => {
                    return { _id, firstName, lastName, occupation, location, picturePath };
                }
            );
    
            res.status(200).json(formattedFriends);
        }else{
            res.status(404).json({ error: "You cannot add yourself as friend!" })
        }
        
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
}

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {firstName, lastName, location, occupation, password}=req.body
        const userpwd=await User.findById(id)
        const comparePwd=await bcrypt.compare(password,userpwd.password)
        if(comparePwd){
            await User.findByIdAndUpdate(id,{
                firstName : firstName,
                lastName : lastName,
                location : location,
                occupation : occupation
            });
            const post=await Post.updateMany({userId:id},{$set:{
                firstName : firstName,
                lastName : lastName,
                location : location,
                occupation : occupation}})
            const user=await User.findById(id)
            res.status(200).json({user,success:true})
        }else{
            res.status(404).json({ error: "Wrong Password",success:false })
        }
        
    } catch (error) {
        res.status(404).json({ error: error.message })
    }
};