const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5001/api/v1/auth/login/init', {
      identifier: 'yimenu122@gmail.com',
      password: 'wrong_password',
      deliveryMethod: 'Email'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLogin();
