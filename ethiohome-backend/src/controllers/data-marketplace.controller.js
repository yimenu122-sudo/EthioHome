const { 
  Dataset, 
  DataTokenPackage, 
  UserDataToken, 
  DataPurchase, 
  DataDownloadLog,
  Property,
  User
} = require('../models/associations');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');

/**
 * @file data-marketplace.controller.js
 * @description Controller for Data Token Marketplace
 */

// 1. Get All Datasets
exports.getDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: datasets });
  } catch (error) {
    console.error('Get Datasets Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch datasets' });
  }
};

// 2. Get Token Packages
exports.getTokenPackages = async (req, res) => {
  try {
    const packages = await DataTokenPackage.findAll({
      where: { is_active: true },
      order: [['price', 'ASC']]
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Get Packages Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch token packages' });
  }
};

// 3. Get User Token Balance
exports.getTokenBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    let tokenRecord = await UserDataToken.findOne({ where: { user_id: userId } });
    
    if (!tokenRecord) {
      tokenRecord = await UserDataToken.create({ user_id: userId, balance: 0 });
    }
    
    res.json({ success: true, balance: tokenRecord.balance });
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch token balance' });
  }
};

// 4. Initialize Token Purchase (Simulated Chapa/TeleBirr)
exports.initializePurchase = async (req, res) => {
  try {
    const { packageId, paymentMethod } = req.body;
    const userId = req.user.id;

    const pkg = await DataTokenPackage.findByPk(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const txRef = `ETHIO-DATA-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Record the pending purchase
    const purchase = await DataPurchase.create({
      user_id: userId,
      package_id: packageId,
      amount: pkg.price,
      currency: pkg.currency,
      payment_method: paymentMethod,
      transaction_reference: txRef,
      payment_status: 'pending'
    });

    // In a real scenario, you'd call Chapa API here and return the checkout URL
    // For simulation, we return a success status and the reference
    res.json({
      success: true,
      message: 'Purchase initialized',
      data: {
        checkoutUrl: `https://simulated-payment.ethiohome.com/pay/${txRef}`,
        txRef: txRef
      }
    });
  } catch (error) {
    console.error('Initialize Purchase Error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize purchase' });
  }
};

// 5. Verify Purchase (Simulated)
exports.verifyPurchase = async (req, res) => {
  try {
    const { txRef } = req.body;
    
    const purchase = await DataPurchase.findOne({ 
      where: { transaction_reference: txRef },
      include: [{ model: DataTokenPackage, as: 'package' }]
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.payment_status === 'completed') {
      return res.json({ success: true, message: 'Purchase already completed' });
    }

    // Simulate successful verification
    purchase.payment_status = 'completed';
    await purchase.save();

    // Update User Token Balance
    const [tokenRecord] = await UserDataToken.findOrCreate({
      where: { user_id: purchase.user_id },
      defaults: { balance: 0 }
    });

    tokenRecord.balance += purchase.package.token_amount;
    await tokenRecord.save();

    res.json({
      success: true,
      message: 'Purchase verified and tokens added',
      data: {
        newBalance: tokenRecord.balance
      }
    });
  } catch (error) {
    console.error('Verify Purchase Error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify purchase' });
  }
};

// 6. Download Dataset (CSV or Excel)
exports.downloadDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'csv' or 'xlsx'
    const userId = req.user.id;

    const dataset = await Dataset.findByPk(id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    // Check token balance
    const tokenRecord = await UserDataToken.findOne({ where: { user_id: userId } });
    if (!tokenRecord || tokenRecord.balance < dataset.token_cost) {
      return res.status(403).json({ success: false, message: 'Insufficient tokens' });
    }

    // Fetch data for the export (mocking data based on category/region)
    // In a real app, this would query the `properties` table with complex filters
    const properties = await Property.findAll({
      limit: dataset.record_count || 100,
      attributes: ['title', 'city', 'sub_city', 'price', 'property_type', 'listing_type', 'area_size', 'created_at']
    });

    const dataToExport = properties.map(p => p.toJSON());

    // Deduct tokens
    tokenRecord.balance -= dataset.token_cost;
    await tokenRecord.save();

    // Log the download
    await DataDownloadLog.create({
      user_id: userId,
      dataset_id: id
    });

    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(dataToExport);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${dataset.title_en.replace(/\s+/g, '_')}.csv`);
      return res.send(csv);
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Market Data');
      
      // Add columns
      worksheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'City', key: 'city', width: 20 },
        { header: 'Sub City', key: 'sub_city', width: 20 },
        { header: 'Price (ETB)', key: 'price', width: 15 },
        { header: 'Type', key: 'property_type', width: 15 },
        { header: 'Listing', key: 'listing_type', width: 10 },
        { header: 'Size (sqm)', key: 'area_size', width: 10 },
        { header: 'Listed Date', key: 'created_at', width: 20 },
      ];

      worksheet.addRows(dataToExport);
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`${dataset.title_en.replace(/\s+/g, '_')}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process download' });
  }
};
