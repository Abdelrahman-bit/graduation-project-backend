import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

import bookingModel from '../models/BookingModel.js';
import slotmodel from '../models/slotModel.js';

// Get user bookings
export const getMyBookings = catchAsync(async (req, res, next) => {
   const { id } = req.user;
   const bookings = await bookingModel.find({ user: id }).populate('slot hall');
   res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: bookings,
   });
});

// Create a new booking
export const createBooking = catchAsync(async (req, res, next) => {
   const { slot: slotId } = req.body;
   const userId = req.user.id;

   console.log(slotId);
   // Check if slot exists
   const slot = await slotmodel.findById(slotId);
   if (!slot) {
      return next(new AppError('Slot not found', 404));
   }
   // 2️ Prevent double booking
   const existingBooking = await bookingModel.findOne({ slot: slotId });
   if (existingBooking) {
      return next(new AppError('Slot already booked', 400));
   }
   // 3️⃣ Create booking
   const booking = await bookingModel.create({
      user: userId,
      hall: slot.hall,
      slot: slotId,
   });

   res.status(201).json({
      status: 'success',
      data: booking,
   });
});

// // Update booking status (e.g., cancel)
// export const updateBookingStatus = catchAsync(async (req, res, next) => {
//    const { id } = req.params;
//    const { status } = req.body;

//    const booking = await bookingModel.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true, runValidators: true }
//    );

//    if (!booking) return next(new AppError('Booking not found', 404));

//    res.status(200).json({
//       status: 'success',
//       data: booking,
//    });
// });
