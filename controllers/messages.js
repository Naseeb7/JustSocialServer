import Message from "../models/Message.js";

export const addMessage = async (req, res) => {
    try {
        const {from,to,message}=req.body;
        const newMessage=new Message({
            message : {text : message},
            users : [from,to],
            sender : from,
        })
        await newMessage.save()
        res.status(201).json(newMessage);

    } catch (error) {
        res.status(404).json({ message: error.message })
    }
};
export const getAllMessages = async (req, res) => {
    try {

        const {from,to}=req.body;
        const messages= await Message.find({
            users : {
                $all : [from,to],
            },
        }).sort({updatedAt : 1})
        const projectedMessages= messages.map((msg)=>{
            return {
                fromSelf: msg.sender.toString() === from,
                message : msg.message.text,
                created : msg.createdAt,
            }
        })
        res.status(201).json(projectedMessages);
    } catch (error) {
        res.status(409).json({ message: error.message })
    }
};