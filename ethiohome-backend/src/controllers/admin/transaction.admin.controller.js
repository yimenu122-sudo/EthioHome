const { Transaction, Payment, Commission, Property, Booking, User, AuditLog } = require('../../models/associations');
const { successResponse, errorResponse } = require('../../utils/response');
const { Op, fn, col, literal } = require('sequelize');
const exceljs = require('exceljs');

/**
 * @file transaction.admin.controller.js
 * @description Admin Transaction Management Controller for EthioHome.
 */

// --- UTILS ---
const logAdminAction = async (adminId, action, tableName, recordId, oldValues, newValues, req) => {
    try {
        await AuditLog.create({
            admin_id: adminId,
            action,
            table_name: tableName,
            record_id: recordId,
            old_values: oldValues,
            new_values: newValues,
            ip_address: req.ip,
            user_agent: req.get('user-agent')
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

// --- CONTROLLER METHODS ---

/**
 * Get All Transactions with Filters and Pagination
 */
exports.getTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            type,
            status,
            paymentStatus,
            city,
            agentId,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // Filters
        if (type && type !== 'All') where.transaction_type = type;
        if (status && status !== 'All') where.transaction_status = status;
        if (agentId) where.agent_id = agentId;
        if (startDate && endDate) {
            where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }
        if (minPrice || maxPrice) {
            where.agreed_price = {
                ...(minPrice && { [Op.gte]: parseFloat(minPrice) }),
                ...(maxPrice && { [Op.lte]: parseFloat(maxPrice) })
            };
        }

        // Build includes — all use required:false (LEFT JOIN) so no transaction is excluded
        const include = [
            {
                model: Property,
                as: 'Property',
                attributes: ['title', 'city', 'sub_city', 'property_image'],
                required: false,
                ...(city ? { where: { city: { [Op.iLike]: `%${city}%` } } } : {})
            },
            { model: User, as: 'Owner',       attributes: ['first_name', 'last_name', 'phone_number'], required: false },
            { model: User, as: 'Agent',       attributes: ['first_name', 'last_name', 'phone_number'], required: false },
            { model: User, as: 'buyerRenter', attributes: ['first_name', 'last_name', 'phone_number'], required: false },
            { model: Payment, as: 'Payment',  attributes: ['payment_status', 'payment_type'], required: false },
            { model: Commission, as: 'Commissions', attributes: ['amount', 'commission_status'], required: false }
        ];

        if (search) {
            where[Op.or] = [
                literal(`CAST("Transaction"."transaction_id" AS TEXT) ILIKE '%${search.replace(/'/g, "''")}%'`),
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
            distinct: true,
            subQuery: false
        });

        return successResponse(res, {
            transactions: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Admin Get Transactions Error:', error);
        return errorResponse(res, 'Failed to fetch transactions', 500, error.message);
    }
};

/**
 * Get Transaction Analytics and KPIs
 */
exports.getTransactionAnalytics = async (req, res) => {
    try {
        const stats = await Transaction.findAll({
            attributes: [
                [fn('COUNT', col('transaction_id')), 'total_count'],
                [fn('SUM', col('agreed_price')), 'total_volume'],
                [
                    literal("COUNT(CASE WHEN transaction_type = 'Rent' THEN 1 END)"),
                    'rent_count'
                ],
                [
                    literal("COUNT(CASE WHEN transaction_type = 'Sale' THEN 1 END)"),
                    'sale_count'
                ],
                [
                    literal("COUNT(CASE WHEN transaction_status = 'Pending' THEN 1 END)"),
                    'pending_count'
                ],
                [
                    literal("COUNT(CASE WHEN transaction_status = 'Completed' THEN 1 END)"),
                    'completed_count'
                ]
            ],
            raw: true
        });

        // Commission Stats
        const commissionStats = await Commission.findAll({
            attributes: [
                [fn('SUM', col('amount')), 'total_commission'],
                [
                    literal("SUM(CASE WHEN commission_status = 'Pending' THEN amount ELSE 0 END)"),
                    'outstanding_commission'
                ]
            ],
            raw: true
        });

        return successResponse(res, {
            ...stats[0],
            ...commissionStats[0],
            total_revenue: commissionStats[0]?.total_commission ?? 0,
            active_disputes: 0
        });
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        return errorResponse(res, 'Failed to fetch analytics', 500);
    }
};

/**
 * Update Transaction Status
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.id;

        const transaction = await Transaction.findByPk(id);
        if (!transaction) return errorResponse(res, 'Transaction not found', 404);

        const oldStatus = transaction.transaction_status;
        await transaction.update({ transaction_status: status });

        // Audit Log
        await logAdminAction(adminId, 'UPDATE_TRANSACTION_STATUS', 'transactions', id, { status: oldStatus }, { status }, req);

        return successResponse(res, transaction, `Transaction marked as ${status}`);
    } catch (error) {
        return errorResponse(res, 'Failed to update status', 500);
    }
};

/**
 * Recalculate Commission for a transaction
 */
exports.recalculateCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByPk(id, { include: [Property] });
        
        if (!transaction) return errorResponse(res, 'Transaction not found', 404);

        // Get rates from settings
        const { SystemSetting } = require('../../models/associations');
        const setting = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
        const rates = setting ? setting.value : { rent: 9, sale: 2 };
        
        const rate = transaction.transaction_type === 'Rent' ? rates.rent : rates.sale;
        const newAmount = (transaction.agreed_price * rate) / 100;

        await Commission.update({ amount: newAmount }, { where: { transaction_id: id } });

        return successResponse(res, { newAmount }, 'Commission recalculated successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to recalculate commission', 500);
    }
};

/**
 * Export Transactions to CSV
 */
exports.exportCSV = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: Property, as: 'Property', attributes: ['title', 'city'], required: false },
                { model: User, as: 'Owner', attributes: ['first_name', 'last_name'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });

        // Build CSV manually — avoids json2csv alpha API inconsistencies
        const escape = (val) => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const headers = ['Transaction ID', 'Type', 'Agreed Price (ETB)', 'Status', 'Property', 'City', 'Owner', 'Date'];
        const rows = transactions.map(t => [
            escape(t.transaction_id),
            escape(t.transaction_type),
            escape(t.agreed_price),
            escape(t.transaction_status),
            escape(t.Property?.title),
            escape(t.Property?.city),
            escape(t.Owner ? `${t.Owner.first_name} ${t.Owner.last_name}` : ''),
            escape(t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : '')
        ].join(','));

        const csv = ['\uFEFF' + headers.join(','), ...rows].join('\r\n');
        const filename = `ethiohome_transactions_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(csv);
    } catch (error) {
        console.error('CSV Export Error:', error);
        return errorResponse(res, 'CSV export failed', 500, error.message);
    }
};

/**
 * Export Transactions to Excel
 */
exports.exportExcel = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: Property, as: 'Property', attributes: ['title', 'city'], required: false },
                { model: User, as: 'Owner', attributes: ['first_name', 'last_name'], required: false }
            ],
            order: [['created_at', 'DESC']]
        });

        const workbook = new exceljs.Workbook();
        workbook.creator = 'EthioHome Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Transactions', {
            pageSetup: { fitToPage: true, orientation: 'landscape' }
        });

        // Style header row
        sheet.columns = [
            { header: 'Transaction ID',    key: 'id',       width: 38 },
            { header: 'Type',              key: 'type',     width: 10 },
            { header: 'Agreed Price (ETB)',key: 'price',    width: 20 },
            { header: 'Status',            key: 'status',   width: 14 },
            { header: 'Property',          key: 'property', width: 30 },
            { header: 'City',              key: 'city',     width: 18 },
            { header: 'Owner',             key: 'owner',    width: 24 },
            { header: 'Date',              key: 'date',     width: 14 }
        ];

        // Bold header
        sheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        transactions.forEach(t => {
            sheet.addRow({
                id:       t.transaction_id,
                type:     t.transaction_type,
                price:    parseFloat(t.agreed_price) || 0,
                status:   t.transaction_status,
                property: t.Property?.title || '',
                city:     t.Property?.city  || '',
                owner:    t.Owner ? `${t.Owner.first_name} ${t.Owner.last_name}` : '',
                date:     t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : ''
            });
        });

        const filename = `ethiohome_transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Write to buffer first (safer with Express 5 than streaming directly)
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(buffer);
    } catch (error) {
        console.error('Excel Export Error:', error);
        return errorResponse(res, 'Excel export failed', 500, error.message);
    }
};
