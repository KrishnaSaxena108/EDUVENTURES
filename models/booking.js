const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    smsUpdates: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    destination: { type: String, required: true },
    destinationName: { type: String, required: true },
    numPeople: { type: Number, required: true },
    numDays: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['card', 'upi'], required: true },

    // Card Payment Details
    cardNumber: { type: String }, // You may want to encrypt/mask this in production
    expiryDate: { type: String }, // Could use Date, but usually stored as MM/YY
    cvv: { type: String },        // Sensitive, consider not storing it at all
    cardHolder: { type: String },

    // UPI Payment Details
    upiId: { type: String },

    totalPrice: { type: Number, required: true },
    dailyRate: { type: Number, required: true },
    bookingDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);