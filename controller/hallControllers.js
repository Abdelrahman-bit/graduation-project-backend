import hallModel from '../models/hallModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

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

   const hall = await hallModel.findById(id).populate({
      path: 'availability',
   });

   if (!hall) {
      return next(new AppError('No Hall Found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: hall,
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

// Soft delete
export const deleteHall = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   const hall = await hallModel.findByIdAndUpdate(
      id,
      { isBookable: false },
      { new: true }
   );

   if (!hall) {
      return next(new AppError('No Hall Found', 404));
   }

   res.status(200).json({
      status: 'success',
      message: 'Hall has been disabled ',
      data: hall,
   });
});
