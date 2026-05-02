const chapaService = require("../services/payment.service");
const db = require("../config/db");

exports.createPayment = async (req, res) => {

  try {

    const { user_id, property_id, amount, email } = req.body;

    const payment = await chapaService.initializePayment({
      amount,
      email,
      first_name: "User",
      last_name: "EthioHome",
      description: "Property Booking Fee"
    });

    const tx_ref = payment.data.tx_ref;

    await db.query(
      `INSERT INTO payments 
      (user_id, property_id, amount, transaction_ref)
      VALUES ($1,$2,$3,$4)`,
      [user_id, property_id, amount, tx_ref]
    );

    res.json({
      checkout_url: payment.data.checkout_url
    });

  } catch (error) {
    res.status(500).json({ error: "Payment initialization failed" });
  }

};