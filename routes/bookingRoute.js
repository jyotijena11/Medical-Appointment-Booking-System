const express = require("express");
const { Bookingmodel } = require("../models/bookingModel");
const { authentication } = require("../middlewares/authenticationMiddleware");
const {authorisation}=require("../middlewares/authorizationMiddleware");
const bookingRoutes = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config()

//getting paticular user booking data
bookingRoutes.post("/paticularUser", authentication, authorisation(["patient","doctor"]), async (req, res) => {
    let userId = req.body.userId;
    let role = req.body.role;
    
    try {
        if(!userId || !role) {
            return res.status(400).json({ 
                "msg": "Missing required fields",
                "Data": []
            });
        }

        // Get current date
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if(role === "patient"){
            // Find all bookings for the user
            const reqData = await Bookingmodel.find({ userId });
            
            // Update past appointments
            for(let booking of reqData) {
                const bookingDate = new Date(booking.bookingDate);
                if(bookingDate < currentDate && booking.status !== 'cancelled') {
                    await Bookingmodel.findByIdAndUpdate(booking._id, { status: 'cancelled' });
                }
            }
            
            // Get updated bookings
            const updatedData = await Bookingmodel.find({ userId });
            res.json({
                "msg": `All booking data of userId ${userId}`,
                "Data": updatedData
            });
        } else if(role === "doctor"){
            // Find all bookings for the doctor
            const reqData = await Bookingmodel.find({ doctorId: userId });
            
            // Update past appointments
            for(let booking of reqData) {
                const bookingDate = new Date(booking.bookingDate);
                if(bookingDate < currentDate && booking.status !== 'cancelled') {
                    await Bookingmodel.findByIdAndUpdate(booking._id, { status: 'cancelled' });
                }
            }
            
            // Get updated bookings
            const updatedData = await Bookingmodel.find({ doctorId: userId });
            res.json({
                "msg": `All booking data of doctorId ${userId}`,
                "Data": updatedData
            });
        } else {
            res.status(400).json({
                "msg": "Invalid role",
                "Data": []
            });
        }
        
    } catch (error) {
        console.log("error from getting paticular user booking data", error.message);
        res.status(500).json({
            "msg": "error in getting paticular user booking data",
            "errorMsg": error.message,
            "Data": []
        });
    }
});


//create new booking
bookingRoutes.post("/create",authentication,authorisation(["patient"]) , async (req, res) => {
    const data = req.body;
    try {
        // Validate booking date is within 3 days
        const bookingDate = new Date(data.bookingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);
        
        if (bookingDate < today || bookingDate > threeDaysFromNow) {
            return res.json({ "msg": "Appointments can only be booked for today and up to 3 days in advance." });
        }

        // For today's appointments, check if the time slot is in the past
        if (bookingDate.getTime() === today.getTime()) {
            const currentHour = new Date().getHours();
            const [slotStartHour] = data.bookingSlot.split('-').map(Number);
            
            // Convert slot start hour to 24-hour format
            let slotStartHour24 = slotStartHour;
            // For PM slots (4-5 PM, 7-8 PM), add 12 to convert to 24-hour format
            if (slotStartHour < 12) {
                slotStartHour24 = slotStartHour + 12;
            }
            
            // Allow booking if current hour is less than slot start hour
            if (currentHour >= slotStartHour24) {
                return res.json({ "msg": "Cannot book appointments for past time slots today." });
            }
        }

        // Count existing bookings for this slot
        const slotBookings = await Bookingmodel.find({ 
            doctorId: data.doctorId,
            bookingDate: data.bookingDate,
            bookingSlot: data.bookingSlot
        });

        if (slotBookings.length >= 5) {
            return res.json({ "msg": "This slot is full. Maximum 5 patients allowed per slot." });
        }

        const addData = new Bookingmodel(data);
        await addData.save();

        // Create booking first, then try to send email
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || 'your-email@gmail.com',
                    pass: process.env.EMAIL_PASS || 'your-app-password'
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: data.userEmail,
                subject: 'Appointment Booking Confirmation',
                text: `Your appointment has been confirmed for ${data.bookingDate} at ${data.bookingSlot} for ${data.familyMember}.`
            };

            await transporter.sendMail(mailOptions);
            return res.status(200).json({ 
                "msg": "Appointment booked successfully and confirmation email sent.",
                "availableSlots": 5 - (slotBookings.length + 1)
            });
        } catch (emailError) {
            console.log("Email error:", emailError);
            // Even if email fails, return success for booking
            return res.status(200).json({ 
                "msg": "Appointment booked successfully.",
                "availableSlots": 5 - (slotBookings.length + 1)
            });
        }

    } catch (error) {
        console.log("error from adding new booking data", error.message);
        res.json({ msg: "error in adding new booking data", "errorMsg": error.message })
    }
})

//removing the booking data
bookingRoutes.delete("/remove/:id", authentication,authorisation(["patient"]),async (req, res) => {
    const ID = req.params.id

    try {
        let reqData = await Bookingmodel.find({_id:ID});
        if (!reqData.length) {
            return res.status(404).json({"msg": "Booking not found"});
        }

        let specificDate = new Date(reqData[0].bookingDate);
        let currentDate = new Date();
        
        // Set both dates to start of day for proper comparison
        specificDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Prevent cancellation of past appointments
        if(specificDate < currentDate) {
            return res.status(400).json({"msg": "Cannot cancel past appointments as they are part of your medical history"});
        }

        // Get the booking details before deleting
        const booking = reqData[0];
        
        // Delete the booking
        await Bookingmodel.findByIdAndDelete({ _id: ID });
        
        // Count remaining bookings for this slot
        const remainingBookings = await Bookingmodel.find({
            doctorId: booking.doctorId,
            bookingDate: booking.bookingDate,
            bookingSlot: booking.bookingSlot
        });

        res.json({ 
            "msg": "Appointment cancelled successfully",
            "availableSlots": 5 - remainingBookings.length
        });
    } catch (error) {
        console.log("error from deleting booking data", error.message);
        res.status(500).json({ "msg": "Error cancelling appointment", "errorMsg": error.message })
    }
})

// Remove all past appointments
bookingRoutes.delete("/remove-past-appointments", authentication, authorisation(["admin"]), async (req, res) => {
    try {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Find and delete all appointments before today
        const result = await Bookingmodel.deleteMany({
            bookingDate: { $lt: currentDate }
        });

        res.json({
            "msg": "Past appointments removed successfully",
            "deletedCount": result.deletedCount
        });
    } catch (error) {
        console.log("Error removing past appointments:", error.message);
        res.status(500).json({ 
            "msg": "Error removing past appointments", 
            "errorMsg": error.message 
        });
    }
});

// Get doctor's slot availability
bookingRoutes.get("/doctor-slots/:doctorId", authentication, async (req, res) => {
    const doctorId = req.params.doctorId;
    try {
        const bookings = await Bookingmodel.find({ doctorId });
        
        // Get next 3 days dates
        const dates = [];
        for(let i = 0; i < 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        // Initialize slots
        const slots = ['8-9', '9-10', '4-5', '7-8'];
        const availability = {};
        
        // For each date and slot, count bookings
        dates.forEach(date => {
            availability[date] = {};
            slots.forEach(slot => {
                const slotBookings = bookings.filter(booking => 
                    booking.bookingDate === date && 
                    booking.bookingSlot === slot
                );
                availability[date][slot] = {
                    total: 5,
                    booked: slotBookings.length,
                    available: 5 - slotBookings.length,
                    date: date
                };
            });
        });
        
        res.json({
            "msg": "Doctor slot availability retrieved successfully",
            "data": availability
        });
    } catch (error) {
        console.log("Error getting doctor slots:", error.message);
        res.status(500).json({
            "msg": "Error getting doctor slots",
            "errorMsg": error.message
        });
    }
});

module.exports = {
    bookingRoutes
}
