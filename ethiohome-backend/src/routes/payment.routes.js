const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const chapaWebhook = require("../webhooks/chapaWebhook");
const authenticate = require("../middlewares/auth.middleware");
const { handleSingleUpload } = require("../middlewares/upload.middleware");

// 1. Get all supported payment services (banks / mobile wallets)
router.get("/services", authenticate, paymentController.getPaymentServices);

// 2. Get active user's payments
router.get("/my", authenticate, paymentController.getMyPayments);

// 3. Initialize online checkout gateway (Chapa / Telebirr)
router.post("/create", authenticate, paymentController.createPayment);

// 4. Upload manual screenshot bank receipt / cash pay receipt
router.post(
  "/upload-receipt", 
  authenticate, 
  handleSingleUpload, // handles file upload with key 'image'
  paymentController.uploadReceipt
);

// 5. Verify / approve manual payment receipts (For Admins / Land Managers / Owners)
router.post("/verify-receipt", authenticate, paymentController.verifyPaymentReceipt);

// 6. Get all commissions (Admin/Agent)
router.get("/commissions", authenticate, paymentController.getCommissions);

// 7. Manage payment services (Admin only)
router.post("/services", authenticate, paymentController.createPaymentService);
router.put("/services/:id", authenticate, paymentController.updatePaymentService);

// 8. Online payment callback gateway
router.post("/webhook/chapa", chapaWebhook.verifyPayment);

module.exports = router;