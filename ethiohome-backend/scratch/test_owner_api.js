const axios = require('axios');

async function testApi() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFiYTRhZTc3LTZiMjMtNDllMC1iMDYzLTkwYWVkNWUxZjZlYiIsInJvbGUiOiJPd25lciIsImlhdCI6MTc3OTE3Mzc1Nn0.h6Tgkt9ct88g4clms5-VnDtlcoi7Lk-l9BmNeO1_cng';
  try {
    const res = await axios.get('http://localhost:5003/api/v1/owner/properties', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Success! Count:', res.data.data.properties.length);
    console.log('Properties:', JSON.stringify(res.data.data.properties.map(p => ({
      property_id: p.property_id,
      title: p.title,
      availability_status: p.availability_status,
      property_image: p.property_image,
      images: p.images
    })), null, 2));
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }
}

testApi();
