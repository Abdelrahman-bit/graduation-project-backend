import slotModel from '../models/slotModel.js';

/**
 * Generates slots for a hall for the next 1 month based on the provided configuration.
 * @param {string} hallId - The ID of the hall.
 * @param {Object} config - The slot configuration.
 * @param {string} config.startTime - Start time of the slots (e.g., "09:00").
 * @param {string} config.endTime - End time of the slots (e.g., "17:00").
 * @param {string[]} config.excludedDays - Array of days to exclude (e.g., ["Friday", "Saturday"]).
 * @param {number} [config.slotDuration=60] - Duration of each slot in minutes (default 60).
 * @returns {Promise<Array>} - The created slot documents.
 */
export const generateSlots = async (hallId, config) => {
   const { startTime, endTime, excludedDays, slotDuration = 60 } = config;
   const slots = [];
   const startDate = new Date();
   const endDate = new Date();
   endDate.setMonth(endDate.getMonth() + 1); // Valid for 1 month

   // Parse start and end hours (assuming "HH:MM" format)
   const [startHour, startMinute] = startTime.split(':').map(Number);
   const [endHour, endMinute] = endTime.split(':').map(Number);

   // Helper to get day name
   const getDayName = (date) =>
      date.toLocaleDateString('en-US', { weekday: 'long' });

   // Iterate through each day
   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDayName = getDayName(d);

      // Skip excluded days
      if (excludedDays.includes(currentDayName)) {
         continue;
      }

      // Generate slots for the current day
      let currentSlotStart = new Date(d);
      currentSlotStart.setHours(startHour, startMinute, 0, 0);

      const dayEndTime = new Date(d);
      dayEndTime.setHours(endHour, endMinute, 0, 0);

      while (currentSlotStart < dayEndTime) {
         const currentSlotEnd = new Date(currentSlotStart);
         currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + slotDuration);

         // Ensure slot doesn't exceed the day's end time
         if (currentSlotEnd > dayEndTime) break;

         // Ensure slot is in the future (Prevent validation error)
         if (currentSlotStart > new Date()) {
            // Create slot object (to be bulk inserted or created sequentially)
            slots.push({
               hall: hallId,
               startTime: new Date(currentSlotStart),
               endTime: new Date(currentSlotEnd),
            });
         }

         // Move to next slot
         currentSlotStart = currentSlotEnd;
      }
   }

   // Bulk create slots for performance
   if (slots.length > 0) {
      const createdSlots = await slotModel.insertMany(slots);
      return createdSlots;
   }

   return [];
};
