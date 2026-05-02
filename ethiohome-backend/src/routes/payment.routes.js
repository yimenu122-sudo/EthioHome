const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const chapaWebhook = require("../webhooks/chapaWebhook");

router.post("/create", paymentController.createPayment);

router.post("/webhook/chapa", chapaWebhook.verifyPayment);

module.exports = router;