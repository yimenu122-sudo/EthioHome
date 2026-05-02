const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;

exports.initializePayment = async (paymentData) => {

  const tx_ref = "ethiohome-" + uuidv4();

  const payload = {
    amount: paymentData.amount,
    currency: "ETB",
    email: paymentData.email,
    first_name: paymentData.first_name,
    last_name: paymentData.last_name,
    tx_ref: tx_ref,
    callback_url: "https://api.ethiohome.com/payments/verify",
    return_url: "https://ethiohome.com/payment-success",
    customization: {
      title: "EthioHome Payment",
      description: paymentData.description
    }
  };

  const response = await axios.post(
    "https://api.chapa.co/v1/transaction/initialize",
    payload,
    {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET}`
      }
    }
  );

  return response.data;
};