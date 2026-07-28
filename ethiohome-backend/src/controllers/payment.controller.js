const {
  Payment,
  PaymentService,
  User,
  Property,
  Booking,
  Commission,
  Transaction,
} = require("../models/associations");
const chapaService = require("../services/payment.service");
const { Op } = require("sequelize");
const AppError = require("../utils/AppError");

/**
 * @file payment.controller.js
 * @description Controller for redesigned payment system including receipt uploads & manual verification
 */

// 1. Get all supported payment services (Banks, Mobile Money, Platform Gateways)
exports.getPaymentServices = async (req, res, next) => {
  try {
    const role = req.user.role;
    let whereClause = {};

    // Only non-admin users should be restricted to active services
    if (role !== "Admin" && role !== "Land_Manager") {
      whereClause = { is_active: true };
    }

    const services = await PaymentService.findAll({
      where: whereClause,
      order: [["name_en", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get my payments (payments made by me or received by me)
exports.getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let whereClause = {};

    if (role === "Admin" || role === "Land_Manager") {
      // Admins/Managers can see all payments for audits
      whereClause = {};
    } else if (role === "Owner") {
      // Owners see payments they paid (commissions) or payments they received (property guarantees from buyers/renters)
      whereClause = {
        [Op.or]: [{ payer_id: userId }, { payee_id: userId }],
      };
    } else if (role === "Agent") {
      // Agents see their commission payouts
      whereClause = {
        [Op.or]: [{ payer_id: userId }, { payee_id: userId }],
      };
    } else {
      // Buyers/Renters only see payments they made
      whereClause = { payer_id: userId };
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        { model: PaymentService, as: "paymentService" },
        {
          model: User,
          as: "payer",
          attributes: ["first_name", "last_name", "phone_number", "role"],
        },
        {
          model: User,
          as: "payee",
          attributes: ["first_name", "last_name", "phone_number", "role"],
        },
        {
          model: Property,
          as: "property",
          attributes: [
            "property_id",
            "title",
            "price",
            "listing_type",
            "city",
            "sub_city",
            "agent_id",
            "owner_id",
            "property_image",
          ],
        },
        {
          model: Transaction,
          as: "transaction",
          attributes: [
            "transaction_id",
            "agreed_price",
            "transaction_type",
            "contract_date",
          ],
          include: [
            {
              model: User,
              as: "Agent",
              attributes: [
                "user_id",
                "first_name",
                "last_name",
                "phone_number",
                "email",
                "profile_image",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Initiate checkout using Chapa / platform payment gateway
exports.createPayment = async (req, res, next) => {
  try {
    const {
      amount,
      email,
      first_name,
      last_name,
      description,
      booking_id,
      property_id,
      transaction_id,
      commission_id,
      payment_purpose,
    } = req.body;
    const payer_id = req.user.id;

    // Find the Chapa payment service to link it
    const chapaServiceRecord = await PaymentService.findOne({
      where: { service_code: "CHAPA" },
    });

    // Initialize with Chapa API
    const payment = await chapaService.initializePayment({
      amount,
      email: email || req.user.email || "customer@ethiohome.com",
      first_name: first_name || req.user.first_name || "Customer",
      last_name: last_name || req.user.last_name || "EthioHome",
      description: description || payment_purpose || "Property booking fee",
    });

    const tx_ref = payment.data.tx_ref;

    // Determine payee
    let payee_id = null;
    if (booking_id) {
      const booking = await Booking.findByPk(booking_id);
      if (booking) payee_id = booking.owner_id;
    } else if (property_id) {
      const property = await Property.findByPk(property_id);
      if (property) payee_id = property.owner_id;
    }

    // Create the payment record in the database
    const newPayment = await Payment.create({
      payer_id,
      payee_id,
      booking_id: booking_id || null,
      property_id: property_id || null,
      transaction_id: transaction_id || null,
      commission_id: commission_id || null,
      payment_service_id: chapaServiceRecord
        ? chapaServiceRecord.service_id
        : null,
      payment_purpose: payment_purpose || "Booking_Fee",
      payment_type: "Platform Gateway",
      amount,
      currency: "ETB",
      payment_status: "Pending",
      description: description
        ? `${description} (Chapa Ref: ${tx_ref})`
        : `Chapa checkout payment (Chapa Ref: ${tx_ref})`,
    });

    res.status(200).json({
      success: true,
      checkout_url: payment.data.checkout_url,
      payment: newPayment,
    });
  } catch (error) {
    next(
      new AppError(
        "Chapa payment initialization failed: " + error.message,
        500,
      ),
    );
  }
};

// 4. Upload screenshot receipt for Bank/Cash payments (for Owners, Buyers, Renters, and Agents)
exports.uploadReceipt = async (req, res, next) => {
  try {
    const payer_id = req.user.id;
    const {
      amount,
      payment_service_id,
      payment_purpose,
      transaction_ref,
      description,
      booking_id,
      property_id,
      transaction_id,
      commission_id,
    } = req.body;

    if (!req.file) {
      return next(
        new AppError(
          "Please upload a screenshot image of the bank receipt or cash voucher.",
          400,
        ),
      );
    }

    if (!payment_service_id) {
      return next(new AppError("Please select a payment service option.", 400));
    }

    // Get the service to check payment type
    const service = await PaymentService.findByPk(payment_service_id);
    if (!service) {
      return next(new AppError("Invalid payment service selected.", 400));
    }

    // Determine payee
    let payee_id = null;
    if (booking_id) {
      const booking = await Booking.findByPk(booking_id);
      if (booking) payee_id = booking.owner_id;
    } else if (property_id) {
      const property = await Property.findByPk(property_id);
      if (property) payee_id = property.owner_id;
    } else if (commission_id) {
      // If paying commission, the platform receives it (payee_id is null/admin) or if commission payout, agent receives it
      if (payment_purpose === "Agent_Commission_Payout") {
        const comm = await Commission.findByPk(commission_id);
        if (comm) payee_id = comm.agent_id;
      }
    }

    // Capture the receipt URL
    const receipt_image_url = req.file.path; // Multer saves CDN URL or local path here

    // Check if a payment_id is provided, or find an existing Pending payment for this transaction/booking
    let payment = null;
    const { payment_id } = req.body;

    if (payment_id) {
      payment = await Payment.findByPk(payment_id);
    } else {
      // Fallback search: find any pending payment by this payer for this purpose and transaction/booking
      const searchCriteria = {
        payer_id,
        payment_purpose,
        payment_status: "Pending",
      };
      if (transaction_id) searchCriteria.transaction_id = transaction_id;
      else if (booking_id) searchCriteria.booking_id = booking_id;
      else if (commission_id) searchCriteria.commission_id = commission_id;

      payment = await Payment.findOne({ where: searchCriteria });
    }

    if (payment) {
      // Update existing payment
      await payment.update({
        payee_id: payee_id || payment.payee_id,
        payment_service_id,
        payment_type:
          service.payment_type === "Bank"
            ? "Bank Transfer"
            : service.payment_type === "Cash"
              ? "Cash"
              : "Mobile Money",
        receipt_image_url,
        payment_status: "Processing",
        description: description
          ? `${description} (Ref: ${transaction_ref})`
          : `Manual receipt upload via ${service.name_en} (Ref: ${transaction_ref})`,
      });
    } else {
      // Create new payment record
      payment = await Payment.create({
        payer_id,
        payee_id,
        booking_id: booking_id || null,
        property_id: property_id || null,
        transaction_id: transaction_id || null,
        commission_id: commission_id || null,
        payment_service_id,
        payment_purpose,
        payment_type:
          service.payment_type === "Bank"
            ? "Bank Transfer"
            : service.payment_type === "Cash"
              ? "Cash"
              : "Mobile Money",
        amount,
        currency: "ETB",
        receipt_image_url,
        payment_status: "Processing",
        description: description
          ? `${description} (Ref: ${transaction_ref})`
          : `Manual receipt upload via ${service.name_en} (Ref: ${transaction_ref})`,
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Receipt uploaded successfully. Our team will verify and confirm your payment soon.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Verify manual receipt payment (Admin, Land Manager, or Owner depending on purpose)
exports.verifyPaymentReceipt = async (req, res, next) => {
  try {
    const { payment_id, status, rejection_reason } = req.body;
    const verifierId = req.user.id;
    const role = req.user.role;

    if (!["Completed", "Failed"].includes(status)) {
      return next(
        new AppError(
          "Invalid verification status. Must be Completed or Failed.",
          400,
        ),
      );
    }

    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return next(new AppError("Payment record not found.", 404));
    }

    // Authorization checks
    // If it's a property guarantee deposit / rent payment to owner, the owner can verify it
    // If it's a commission payment to the platform, only Admin or Land_Manager can verify it
    if (
      payment.payment_purpose === "Property_Payment" ||
      payment.payment_purpose === "Guarantee_Deposit"
    ) {
      if (
        role !== "Admin" &&
        role !== "Land_Manager" &&
        verifierId !== payment.payee_id
      ) {
        return next(
          new AppError(
            "Only the property owner or platform administrator can verify this receipt.",
            403,
          ),
        );
      }
    } else {
      // Platform commissions or agent payouts must be verified by Admin / Land Manager
      if (role !== "Admin" && role !== "Land_Manager") {
        return next(
          new AppError(
            "Only platform administrators can verify commission payments.",
            403,
          ),
        );
      }
    }

    // Update payment record
    payment.payment_status = status;
    payment.verified_by = verifierId;
    payment.verified_at = new Date();
    if (status === "Failed") {
      payment.rejection_reason =
        rejection_reason || "Invalid screenshot or reference number.";
    } else {
      payment.rejection_reason = null;
    }
    await payment.save();

    // Side-effects of verification success:
    if (status === "Completed") {
      // 1. If it was a commission payment, update related commission table
      if (payment.commission_id) {
        const commission = await Commission.findByPk(payment.commission_id);
        if (commission) {
          commission.commission_status = "Completed";
          await commission.save();
        }
      }

      // 2. If it was booking fee or guarantee deposit, update Booking status
      if (payment.booking_id) {
        const booking = await Booking.findByPk(payment.booking_id);
        if (booking) {
          booking.booking_status = "Completed";
          await booking.save();
        }
      }

      // 3. If it was a transaction payment, update Transaction status
      if (payment.transaction_id) {
        const transaction = await Transaction.findByPk(payment.transaction_id);
        if (transaction) {
          transaction.transaction_status = "Completed";
          await transaction.save();

          // Also set the property status to sold/rented
          const property = await Property.findByPk(transaction.property_id);
          if (property) {
            property.availability_status =
              property.listing_type === "Rent" ? "Rented" : "Sold";
            await property.save();
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Payment receipt successfully ${status === "Completed" ? "approved" : "rejected"}.`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get all commissions (Admin sees all, Agent sees only their assigned commissions)
exports.getCommissions = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let whereClause = {};
    if (role === "Agent") {
      whereClause = { agent_id: userId };
    } else if (role !== "Admin" && role !== "Land_Manager") {
      return next(new AppError("Unauthorized access to commissions.", 403));
    }

    const commissions = await Commission.findAll({
      where: whereClause,
      include: [
        {
          model: Transaction,
          include: [
            {
              model: Property,
              as: "Property",
              attributes: [
                "title",
                "price",
                "listing_type",
                "city",
                "property_image",
              ],
            },
            {
              model: User,
              as: "buyerRenter",
              attributes: ["first_name", "last_name", "phone_number"],
            },
          ],
        },
        {
          model: User,
          as: "agent",
          attributes: ["first_name", "last_name", "phone_number"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["first_name", "last_name", "phone_number"],
        },
        {
          model: Payment,
          as: "payments",
          include: [{ model: PaymentService, as: "paymentService" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: commissions,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Create payment service (Admin only)
exports.createPaymentService = async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return next(
        new AppError(
          "Only platform administrators can manage payment services.",
          403,
        ),
      );
    }

    const newService = await PaymentService.create(req.body);
    res.status(201).json({
      success: true,
      data: newService,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Update payment service (Admin only)
exports.updatePaymentService = async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return next(
        new AppError(
          "Only platform administrators can manage payment services.",
          403,
        ),
      );
    }

    const { id } = req.params;
    const service = await PaymentService.findByPk(id);
    if (!service) {
      return next(new AppError("Payment service not found.", 404));
    }

    await service.update(req.body);
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};
