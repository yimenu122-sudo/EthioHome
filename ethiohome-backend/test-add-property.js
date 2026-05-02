const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testAddProperty() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI4NWE0NDljLTQzNWYtNGVjMi1hY2JjLWZjYWU4YmNmMjQxZSIsImVtYWlsIjoieWltZW51MTIyQGdtYWlsLmNvbSIsInJvbGUiOiJPd25lciIsInBob25lIjoiMDkyNzc3NDkzNyIsImlhdCI6MTc3NzMyMDA1NCwiZXhwIjoxNzc3OTI0ODU0fQ.uPrrUHhymurtlKBmbd6HiZSYdKuNMKGADFCuLYRbkbE';
    console.log('Using captured token.');

    const form = new FormData();
    form.append('title', 'Test Property');
    form.append('description', 'This is a test property.');
    form.append('listing_type', 'Rent');
    form.append('property_type', 'Apartment');
    form.append('sub_city', 'Bole');
    form.append('specific_location', 'Behind Medhanealem Church');
    form.append('price', '15000');
    form.append('number_of_bedrooms', '2');
    form.append('number_of_bathrooms', '1');
    form.append('area_size', '100');

    // Create a dummy image
    fs.writeFileSync('test.jpg', 'dummy image content');
    form.append('image', fs.createReadStream('test.jpg'));

    console.log('Sending Add Property request...');
    const res = await axios.post('http://localhost:5003/api/v1/owner/properties', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Success:', res.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAddProperty();
