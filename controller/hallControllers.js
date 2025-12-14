import hallModel from '../models/hallModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateSlots } from '../utils/hallUtils.js';
import slotmodel from '../models/slotModel.js';
import bookingModel from '../models/BookingModel.js';

export const getHalls = catchAsync(async (req, res, next) => {
   const halls = await hallModel.find({}).populate({
      path: 'availability',
   });

   res.status(200).json({
      status: 'success',
      results: halls.length,
      data: halls,
   });
});

export const getHallDetails = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   let hall = await hallModel.findById(id).populate({
      path: 'availability',
   });

   if (!hall) {
      return next(new AppError('No Hall Found', 404));
   }

   // Retrieve bookings for the slots in this hall
   const slotIds = hall.availability.map((slot) => slot._id);
   const settings = { strict: false }; // To fix possible strict populating issues if any
   const bookings = await bookingModel
      .find({ slot: { $in: slotIds } })
      .populate('course', 'basicInfo.title');

   // Create a lookup for bookings by slot ID
   const bookingMap = new Map();
   bookings.forEach((b) => {
      bookingMap.set(b.slot.toString(), {
         bookingId: b._id,
         bookedBy: b.user, // User ID or object depending on schema
         courseTitle: b.course
            ? b.course.basicInfo
               ? b.course.basicInfo.title
               : 'Course'
            : 'Event',
      });
   });

   // Convert hall to plain object to modify availability
   const hallObject = hall.toObject();

   // Add isBooked and booking details to each slot
   hallObject.availability = hallObject.availability.map((slot) => {
      const booking = bookingMap.get(slot._id.toString());
      return {
         ...slot,
         isBooked: !!booking,
         bookingId: booking ? booking.bookingId : null,
         bookedBy: booking ? booking.bookedBy : null,
         courseTitle: booking ? booking.courseTitle : null,
      };
   });

   res.status(200).json({
      status: 'success',
      data: hallObject,
   });
});

export const newHall = catchAsync(async (req, res, next) => {
   const hall = await hallModel.create({
      name: req.body.name,
      description: req.body.description,
      capacity: req.body.capacity,
      facilities: req.body.facilities,
      hourlyPrice: req.body.hourlyPrice,
      availability: req.body.availability,
   });

   // Generate slots if configuration is provided
   if (req.body.slotConfiguration) {
      const { startTime, endTime, excludedDays } = req.body.slotConfiguration;
      if (startTime && endTime) {
         const createdSlots = await generateSlots(hall._id, {
            startTime,
            endTime,
            excludedDays: excludedDays || [],
         });

         // Associate created slots with the hall
         if (createdSlots.length > 0) {
            hall.availability = createdSlots.map((slot) => slot._id);
            await hall.save();
         }
      }
   }

   res.status(201).json({
      status: 'success',
      data: hall,
   });
});

export const updateHallDetails = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   // Prevent changing slots or availability
   if ('availability' in req.body) {
      return next(
         new AppError("This route isn't capable of changing Slots", 401)
      );
   }

   // Only allowed fields
   const allowedUpdates = [
      'name',
      'thumbnail',
      'description',
      'capacity',
      'facilities',
      'hourlyPrice',
      'isBookable',
   ];

   const updates = {};
   allowedUpdates.forEach((field) => {
      if (field in req.body) updates[field] = req.body[field];
   });

   const hall = await hallModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
   });

   if (!hall) {
      return next(new AppError('No Hall Found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: hall,
   });
});

// Hard delete
export const deleteHall = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   // 1. Find the hall to ensure it exists
   const hall = await hallModel.findById(id);

   if (!hall) {
      return next(new AppError('No Hall Found', 404));
   }

   // 2. Delete all slots associated with this hall
   await slotmodel.deleteMany({ hall: id });

   // 3. Delete all bookings associated with this hall
   await bookingModel.deleteMany({ hall: id });

   // 4. Delete the hall itself
   await hallModel.findByIdAndDelete(id);

   res.status(200).json({
      status: 'success',
      message: 'Hall and all associated data have been deleted successfully',
   });
});

export const getHallStatus = catchAsync(async (req, res, next) => {
   const { date } = req.query; // YYYY-MM-DD
   if (!date) {
      return next(new AppError('Please provide a date', 400));
   }

   const queryDate = new Date(date);
   const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
   const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

   // 1. Get all Halls
   const halls = await hallModel.find();

   // 2. Get all Slots for this date
   const slots = await slotmodel.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
   });

   // 3. Get all Bookings for this date
   // 3. Get all Bookings for this date based on slots
   const slotIds = slots.map((s) => s._id);
   const bookings = await bookingModel
      .find({
         slot: { $in: slotIds },
         // status: { $ne: 'rejected' },
      })
      .populate('user')
      .populate('course', 'basicInfo.title');

   // 4. Map data
   const statusData = halls.map((hall) => {
      const hallSlots = slots.filter(
         (s) => s.hall.toString() === hall._id.toString()
      );
      const hallBookings = bookings.filter(
         (b) => b.hall.toString() === hall._id.toString()
      );

      return {
         ...hall.toObject(),
         daySlots: hallSlots,
         dayBookings: hallBookings,
      };
   });

   res.status(200).json({
      status: 'success',
      data: statusData,
   });
});

export const deleteHallSlotsByDate = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const { date } = req.query; // YYYY-MM-DD

   if (!date) {
      return next(new AppError('Please provide a date', 400));
   }

   const queryDate = new Date(date);
   const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
   const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

   // 1. Find all slots for this hall on this date
   const daySlots = await slotmodel.find({
      hall: id,
      startTime: { $gte: startOfDay, $lte: endOfDay },
   });

   if (daySlots.length === 0) {
      return res.status(200).json({
         status: 'success',
         message: 'No slots found to delete for this date.',
      });
   }

   const slotIds = daySlots.map((s) => s._id);

   // 2. Check for active bookings on these slots
   const existingBooking = await bookingModel.findOne({
      slot: { $in: slotIds },
      // status: { $ne: 'rejected' } // Uncomment if status field exists
   });

   if (existingBooking) {
      return next(
         new AppError(
            'Cannot block date. There are existing bookings for this day.',
            400
         )
      );
   }

   // 3. Delete the slots
   await slotmodel.deleteMany({ _id: { $in: slotIds } });

   res.status(200).json({
      status: 'success',
      message: `Successfully deleted ${slotIds.length} slots for ${date}`,
   });
});
