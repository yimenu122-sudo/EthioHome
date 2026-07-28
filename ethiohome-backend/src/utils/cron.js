const cron = require('node-cron');
const { Op } = require('sequelize');
const { Booking, Property, User } = require('../models/associations');
const NotificationService = require('../services/notification.service');

const initCronJobs = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      const now = new Date();
      
      const upcomingBookings = await Booking.findAll({
        where: {
          booking_status: 'Approved',
          visit_date: {
            [Op.gt]: now,
            [Op.lte]: new Date(now.getTime() + 6.5 * 60 * 60 * 1000) // Within the next 6.5 hours
          }
        },
        include: [
          { model: Property, attributes: ['title', 'owner_id'] },
          { model: User, as: 'buyerRenter', attributes: ['first_name', 'email'] }
        ]
      });

      for (const booking of upcomingBookings) {
        const visitDate = new Date(booking.visit_date);
        const hoursUntilVisit = (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if we are within the 6-hour or 2-hour window (approximate to avoid duplicate sends without state tracking)
        // Since it runs every 10 mins, we check if the difference is between 5.83 and 6 hours or 1.83 and 2 hours
        let shouldNotify = false;
        let windowType = '';

        if (hoursUntilVisit <= 6 && hoursUntilVisit > 5.83) {
          shouldNotify = true;
          windowType = '6 hours';
        } else if (hoursUntilVisit <= 2 && hoursUntilVisit > 1.83) {
          shouldNotify = true;
          windowType = '2 hours';
        }

        if (shouldNotify) {
          const propertyTitle = booking.Property?.title || 'the property';
          const msg = `Reminder: Your visit for "${propertyTitle}" is in ${windowType}.`;
          
          // Notify Renter/Buyer
          if (booking.buyer_renter_id) {
            await NotificationService.sendInAppNotification(booking.buyer_renter_id, 'Visit Reminder', msg, 'Booking', booking.booking_id);
          }
          if (booking.buyerRenter && booking.buyerRenter.email) {
             await NotificationService.sendEmail(
               booking.buyerRenter.email,
               'EthioHome - Visit Reminder',
               `<p>${msg}</p>`
             );
          }
          
          // Notify Agent/Owner? The requirement specifically asked for renters and buyers to be notified.
        }
      }
    } catch (error) {
      console.error('Cron Job Error:', error);
    }
  });

  console.log('✅ Cron jobs initialized.');
};

module.exports = { initCronJobs };
