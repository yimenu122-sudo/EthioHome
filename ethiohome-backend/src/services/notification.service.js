const nodemailer = require('nodemailer');
const env = require('../config/env');
const Notification = require('../models/notification.model');

const MESSAGES = {
  BOOKING_APPROVED: {
    en: 'Your booking has been approved.',
    am: 'ቦታ ማስያዣዎ ተፈቅዷል።'
  },
  PAYMENT_SUCCESS: {
    en: 'Payment received successfully.',
    am: 'ክፍያዎ በተሳካ ሁኔታ ደርሶናል።'
  }
};

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // false for TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Force IPv4 as Node.js sometimes fails to resolve Gmail's IPv6 address on certain networks
      // This specifically addresses the ENOTFOUND smtp.gmail.com error
      family: 4 
    });
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId, title, message, type, bookingId) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        booking_id: bookingId,
        title: title,
        message: message,
        is_sent: true,
        sent_at: new Date()
      });
      return notification;
    } catch (error) {
      console.error(`[In-App Notification Error]: ${error.message}`);
      return null;
    }
  }

  /**
   * Placeholder for external channels
   */
  async sendSMS(phone, message) {
    console.log(`[SMS to ${phone}]: ${message}`);
    // Future implementation: integration with a real SMS gateway like Holla or Twilio
    return true;
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EthioHome" <no-reply@ethiohome.com>',
        to,
        subject,
        html,
      });
      console.log(`[Email Sent Success]: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`[Email Sent Error]: ${error.message}`);
      return false;
    }
  }
}

module.exports = new NotificationService();
