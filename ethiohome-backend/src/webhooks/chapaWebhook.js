const db = require("../config/db");

exports.verifyPayment = async (req, res) => {

  const event = req.body;

  if(event.status === "success"){

      const tx_ref = event.tx_ref;

      await db.query(
        `UPDATE payments 
         SET payment_status='completed'
         WHERE transaction_ref=$1`,
        [tx_ref]
      );

  }

  res.status(200).send("Webhook received");
};