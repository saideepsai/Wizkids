const { stringify } = require("querystring")

const mongoose = require("mongoose")

const projectData = new mongoose.Schema({
    Fullname:{
        type:String,
    },
    username:{
        type:String
    },
    Age:{
        type:Number
    },
    Gender: {
        type: String,
        enum: ["Male", "Female"]
    },
    Date_of_birth:{
        type:String
    },
    Mobile_Number:{
        type:Number
    },
    password:{
        type:String
    },
    Confirm_Password:{
        type:String
    },
    avatar: {
        data: Buffer,
        contentType: String
    }
    
}) 



  
  const User = mongoose.model("User", projectData);
  module.exports = User;



