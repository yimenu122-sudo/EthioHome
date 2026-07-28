const { Transaction, Payment, Commission, Property, User } = require('../../models/associations');
const { successResponse, errorResponse } = require('../../utils/response');
const { Op, fn, col, literal } = require('sequelize');
const { Parser } = require('json2csv');
const exceljs = require('exceljs');

/**
 * @file transaction.agent.controller.js
 * @description Agent Transaction & Commission Management for EthioHome.
 */

exports.getTransactions = async (req, res) => {
    try {
        const agent_id = req.user.id;
        const {
            page = 1,
            limit = 10,
            search,
            type,
            status,
            paymentStatus,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { agent_id };

        if (type && type !== 'All') where.transaction_type = type;
        if (status && status !== 'All') where.transaction_status = status;

        const include = [
            {
                model: Property,
                as: 'Property',
                attributes: ['title', 'city', 'sub_city', 'property_image']
            },
            { model: User, as: 'Owner', attributes: ['first_name', 'last_name', 'phone_number'] },
            { model: User, as: 'buyerRenter', attributes: ['first_name', 'last_name', 'phone_number'] },
            { 
                model: Commission,
                as: 'Commissions',
                attributes: ['amount', 'commission_status'],
                where: { agent_id },
                required: false
            },
            { 
                model: Payment, 
                as: 'Payment',
                attributes: ['payment_status', 'payment_type'],
                required: false
            }
        ];

        if (search) {
            where[Op.or] = [
                { '$Property.title$': { [Op.iLike]: `%${search}%` } },
                { '$Owner.first_name$': { [Op.iLike]: `%${search}%` } },
                { '$buyerRenter.first_name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where,
            include,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder]],
            distinct: true
        });

        return successResponse(res, {
            transactions: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Agent Get Transactions Error:', error);
        return errorResponse(res, 'Failed to fetch transactions', 500);
    }
};

exports.getTransactionAnalytics = async (req, res) => {
    try {
        const agent_id = req.user.id;

        const stats = await Transaction.findAll({
            where: { agent_id },
            attributes: [
                [fn('COUNT', col('transaction_id')), 'total_count'],
                [fn('SUM', col('agreed_price')), 'total_volume'],
                [literal("COUNT(CASE WHEN transaction_type = 'Rent' THEN 1 END)"), 'rent_count'],
                [literal("COUNT(CASE WHEN transaction_type = 'Sale' THEN 1 END)"), 'sale_count'],
                [literal("COUNT(CASE WHEN transaction_status = 'Pending' THEN 1 END)"), 'pending_count'],
                [literal("COUNT(CASE WHEN transaction_status = 'Completed' THEN 1 END)"), 'completed_count']
            ],
            raw: true
        });

        const commissionStats = await Commission.findAll({
            where: { agent_id },
            attributes: [
                [fn('SUM', col('amount')), 'total_commission'],
                [literal("SUM(CASE WHEN commission_status = 'Completed' THEN amount ELSE 0 END)"), 'paid_commission'],
                [literal("SUM(CASE WHEN commission_status = 'Pending' THEN amount ELSE 0 END)"), 'pending_commission']
            ],
            raw: true
        });

        const activeDisputes = 0;

        return successResponse(res, {
            ...stats[0],
            ...commissionStats[0],
            active_disputes: activeDisputes
        });
    } catch (error) {
        console.error('Agent Analytics Error:', error);
        return errorResponse(res, 'Failed to fetch analytics', 500);
    }
};

exports.exportCSV = async (req, res) => {
    try {
        const agent_id = req.user.id;
        const transactions = await Transaction.findAll({
            where: { agent_id },
            include: [{ model: Property, as: 'Property' }, { model: User, as: 'Owner' }]
        });

        const fields = ['transaction_id', 'transaction_type', 'agreed_price', 'transaction_status', 'created_at'];
        const parser = new Parser({ fields });
        const csv = parser.parse(transactions);

        res.header('Content-Type', 'text/csv');
        res.attachment(`agent_transactions_${agent_id}.csv`);
        return res.send(csv);
    } catch (error) {
        return errorResponse(res, 'Export failed', 500);
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const agent_id = req.user.id;
        const transactions = await Transaction.findAll({
            where: { agent_id },
            include: [{ model: Property, as: 'Property' }]
        });

        const workbook = new exceljs.Workbook();
        const sheet = workbook.addWorksheet('My Transactions');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Property', key: 'property', width: 30 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        transactions.forEach(t => {
            sheet.addRow({
                date: t.created_at,
                property: t.Property.title,
                type: t.transaction_type,
                price: t.agreed_price,
                status: t.transaction_status
            });
        });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`agent_transactions_${agent_id}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        return errorResponse(res, 'Excel export failed', 500);
    }
};
