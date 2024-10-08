const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto=require("crypto");
const { type } = require("os");

const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, "Please Enter  Username"],
    maxlength: [40, "username should not exceed morethan 40 characters"],
    minlength: [4, "username should not be lessthan 4 characters"],
  },
  email:{
    type: String,
    required: [true, "Please Enter User Email"],
    unique:true,
    validate: [validator.isEmail, "Please enter valid email"],
  },
  number:{
    type:Number,
    unique:true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v.toString());
      },
      message: props => `${props.value} is not a valid 10-digit number!`
    },
    required:true,
  },
  password:{
    type: String,
    required: [true, "Please Enter User Password"],
    minlength: [8,"password should be greaterthan 8 characters"],
    select: false,
  },
  wishList:[
    {
      service:{
        type:mongoose.Schema.ObjectId,
        ref:"Product"
      }
    }
  ],
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    }
  ],
  addresses: [
    {
      address: {
        type: String,
        required: [true, "Please enter an address"]
      },
      pincode: {
        type: String,
        required: [true, "Please enter pincode"],
      }
    }
  ],
  role:{
    type: String,
    default:"user",
  },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  });

  // pre hook to check weather password is modified
  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      next();
    }
    this.password = await bcrypt.hash(this.password, 10);
  });

  // generate Jwttoken
  userSchema.methods.jwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.jwt_secret, {
      expiresIn: process.env.jwt_epire,
    });
  };

  // password compare
  userSchema.methods.comparePassword = async function (password) {
    console.log(password,this.password)
    return await bcrypt.compare(password, this.password);
    
  };

  userSchema.methods.resetToken= function(){
    const token=crypto.randomBytes(20).toString("hex")
    const hashedToken=crypto.createHash("sha256").update(token).digest("hex")
    this.resetPasswordToken=hashedToken
    this.resetPasswordExpire=Date.now()+(1000*60*60*24*15)
    return token
  }

  module.exports = mongoose.model("User", userSchema);
