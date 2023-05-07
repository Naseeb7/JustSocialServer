import mongoose from "mongoose";

const notificationSchema= mongoose.Schema(
    {
        userId:{
            type: String,
            required: true
        },
        postId:{
            type: String,
        },
        firstName:{
            type: String,
            required: true
        },
        lastName:{
            type: String,
            required: true
        },
        type:{
            type: String,
            required: true
        },
        notification:{
            type: String,
            required: true
        },
        userPicturePath:String,
        postPicturePath:String,
    },
    {timestamps: true}
);

const Notification=mongoose.model("Notification",notificationSchema)

export default Notification;