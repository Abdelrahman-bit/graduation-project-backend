import hallModel from '../models/hallModel.js';
import slotmodel from '../models/slotModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const createSlot = catchAsync(async (req, res, next) => {
   const { id } = req.params; // hallId
   const { startTime, endTime } = req.body;

   // Check hall exists
   const hall = await hallModel.findById(id);
   if (!hall) {
      return next(new AppError('Hall not Found', 404));
   }

   const existingSlot = await slotmodel.find({
      hall: id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
   });

   if (existingSlot.length > 0) {
      return next(new AppError('Slot already Exists', 400));
   }

   // Create slot
   const slot = await slotmodel.create({
      hall: hall._id,
      startTime,
      endTime,
   });

   // Add slot to hall availability
   hall.availability.push(slot._id);
   await hall.save();

   res.status(201).json({
      status: 'success',
      data: slot,
   });
});

export const updateSlot = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const { startTime, endTime } = req.body;

   const currentSlot = await slotmodel.findById(id);
   if (!currentSlot) return next(new AppError('Slot not found', 404));

   // Check for overlaps with other slots in the same hall
   // (StartA < EndB) && (EndA > StartB)
   const overlappingSlot = await slotmodel.findOne({
      hall: currentSlot.hall,
      _id: { $ne: id }, // Exclude current slot
      $or: [
         {
            startTime: { $lt: new Date(endTime) },
            endTime: { $gt: new Date(startTime) },
         },
      ],
   });

   if (overlappingSlot) {
      return next(
         new AppError('This time slot overlaps with an existing slot.', 400)
      );
   }

   const slot = await slotmodel.findByIdAndUpdate(
      id,
      { startTime, endTime },
      { new: true, runValidators: true }
   );

   res.status(200).json({
      status: 'success',
      data: slot,
   });
});

export const deleteSlot = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   // Delete slot
   const slot = await slotmodel.findByIdAndDelete(id);
   if (!slot) return next(new AppError('Slot not found', 404));

   // Remove slot from hall availability
   await hallModel.findByIdAndUpdate(slot.hall, {
      $pull: { availability: slot._id },
   });

   res.status(204).json({
      status: 'success',
      data: null,
   });
});
