const mongoose=require("mongoose");

const bookingSchema=mongoose.Schema({
    userId:{type:String,require:true},
    doctorId:{type:String,require:true},
    doctorName:{type:String,require:true},
    userEmail:{type:String,require:true},
    bookingDate:{type:String,require:true},
    bookingSlot:{type:String,require:true},
    familyMember:{type:String,require:true},
    status:{type:String,enum:['active','cancelled'],default:'active'}
},{timestamps:true})

const Bookingmodel=mongoose.model("booking",bookingSchema)

module.exports={Bookingmodel}