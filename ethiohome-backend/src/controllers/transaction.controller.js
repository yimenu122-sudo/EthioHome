const { Transaction, Property, Booking, Payment, Commission, PropertyImage, User, SystemSetting } = require('../models/associations');
const { sequelize } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @file transaction.controller.js
 * @description Handles property sale/rent transactions and commission calculations
 */

exports.createTransaction = async (req, res) => {
    try {
        const { property_id, booking_id, agreed_price, transaction_type, buyer_renter_id } = req.body;

        // 1. Validate property
        const property = await Property.findByPk(property_id);
        if (!property) return errorResponse(res, 'Property not found', 404);
        if (property.availability_status !== 'Available') {
            return errorResponse(res, 'Property is no longer available', 400);
        }

        // 2. Validate booking
        const booking = await Booking.findByPk(booking_id);
        if (!booking) return errorResponse(res, 'Booking not found', 404);

        // 3. Create Transaction (Initially Pending)
        const transaction = await Transaction.create({
            property_id,
            booking_id,
            owner_id: property.owner_id,
            agent_id: property.agent_id,
            buyer_renter_id: buyer_renter_id || booking.buyer_renter_id,
            transaction_type: transaction_type || property.listing_type,
            agreed_price,
            contract_date: new Date(),
            transaction_status: 'Pending'
        });

        return successResponse(res, transaction, 'Pending agreement generated', 201);

    } catch (error) {
        console.error('Create Transaction Error:', error);
        return errorResponse(res, 'Failed to generate agreement', 500, error.message);
    }
};

/**
 * Confirm Agreement (Renter/Buyer Action)
 * Atomically completes the full deal closure workflow:
 *   1. Transaction  → status = 'Completed'
 *   2. Property     → availability_status = 'Rented' | 'Sold'
 *   3. Booking      → booking_status = 'Completed'
 *   4. Commission   → new record with calculated amount
 */
exports.confirmAgreement = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Load transaction with associated property
        const txn = await Transaction.findByPk(id, {
            include: [{ model: Property, as: 'property' }]
        });

        if (!txn) return errorResponse(res, 'Agreement not found', 404);

        // Authorization: only the buyer/renter for this deal can confirm
        if (txn.buyer_renter_id !== userId) {
            return errorResponse(res, 'Unauthorized to confirm this agreement', 403);
        }

        if (txn.transaction_status !== 'Pending') {
            return errorResponse(res, 'Agreement is not in a pending state', 400);
        }

        const isRent = txn.transaction_type === 'Rent';

        // ── 1. Mark Transaction as Completed ──────────────────────────────────
        await txn.update({ transaction_status: 'Completed' }, { transaction: t });

        // ── 2. Update Property Availability ──────────────────────────────────
        const property = txn.property;
        if (property) {
            await property.update(
                { availability_status: isRent ? 'Rented' : 'Sold' },
                { transaction: t }
            );
        }

        // ── 3. Mark Booking as Completed ──────────────────────────────────────
        const booking = await Booking.findByPk(txn.booking_id);
        if (booking) {
            await booking.update({ booking_status: 'Completed' }, { transaction: t });
        }

        // ── 4. Calculate & Record Commission ─────────────────────────────────
        // Fetch commission rate from system settings (fallback: 9% Rent, 2% Sale)
        const settings = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
        const rates = (settings && settings.value) ? settings.value : { sale: 2, rent: 9 };

        const rate = isRent ? rates.rent : rates.sale;
        // Total commission = both parties pay (buyer/renter + owner share)
        const perPartyAmount = parseFloat(txn.agreed_price) * (rate / 100);
        const totalCommission = perPartyAmount * 2;

        // Always create commission record — regardless of whether agent exists
        await Commission.create({
            transaction_id:  txn.transaction_id,
            booking_id:      txn.booking_id,
            owner_id:        txn.owner_id,
            agent_id:        txn.agent_id || null,
            buyer_renter_id: txn.buyer_renter_id,
            amount:          totalCommission,
            commission_status: 'Pending'
        }, { transaction: t });

        // ── 5. Create Pending Payment Record for Buyer/Renter ────────────────
        await Payment.create({
            transaction_id: txn.transaction_id,
            property_id: txn.property_id,
            booking_id: txn.booking_id,
            payer_id: txn.buyer_renter_id,
            payee_id: txn.owner_id,
            payment_purpose: isRent ? 'Guarantee_Deposit' : 'Property_Payment',
            payment_type: 'Platform Gateway',
            amount: txn.agreed_price,
            payment_status: 'Pending',
            description: isRent ? 'Guarantee Deposit for Rent' : 'Full Property Payment for Sale'
        }, { transaction: t });

        await t.commit();

        console.log(`✅ Deal closed — ${isRent ? 'Rent' : 'Sale'} | TXN: ${txn.transaction_id} | Commission: ${totalCommission} ETB`);

        return successResponse(res, {
            transaction_id: txn.transaction_id,
            transaction_type: txn.transaction_type,
            transaction_status: 'Completed',
            property_status: isRent ? 'Rented' : 'Sold',
            booking_status: 'Completed',
            commission: {
                rate: `${rate}%`,
                per_party: perPartyAmount,
                total: totalCommission,
                status: 'Pending'
            }
        }, 'Agreement confirmed successfully');

    } catch (error) {
        await t.rollback();
        console.error('Confirm Agreement Error:', error);
        return errorResponse(res, 'Failed to confirm agreement', 500, error.message);
    }
};


exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        const include = [
            { 
                model: Property, 
                as: 'property',
                attributes: ['property_id', 'title', 'city', 'sub_city', 'price', 'listing_type', 'property_image'],
                include: [{ model: PropertyImage, as: 'images', limit: 1 }]
            },
            {
                model: User,
                as: 'owner',
                attributes: ['first_name', 'last_name', 'phone_number', 'email']
            },
            {
                model: User,
                as: 'buyerRenter',
                attributes: ['first_name', 'last_name', 'phone_number', 'email']
            },
            {
                model: Commission,
                as: 'Commission',
                attributes: ['commission_id', 'amount', 'commission_status']
            },
            {
                model: User,
                as: 'Agent',
                attributes: ['first_name', 'last_name', 'phone_number', 'email', 'profile_image']
            }
        ];

        let where = {};
        if (role === 'Owner') {
            where.owner_id = userId;
        } else if (role === 'Agent') {
            where.agent_id = userId;
        } else {
            where.buyer_renter_id = userId;
        }
        
        const transactions = await Transaction.findAll({
            where,
            include,
            order: [['created_at', 'DESC']]
        });

        // Fetch commission rates
        const settings = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
        const rates = settings ? settings.value : { sale: 2, rent: 9 };

        const enrichedTransactions = transactions.map(t => {
            const rate = t.transaction_type === 'Sale' ? rates.sale : rates.rent;
            const transactionObj = t.toJSON();
            transactionObj.commission_rate = rate;
            transactionObj.commission_value = (transactionObj.agreed_price * rate) / 100;
            return transactionObj;
        });

        return successResponse(res, enrichedTransactions, 'Transactions fetched successfully');
    } catch (error) {
        console.error('Get My Transactions Error:', error);
        return errorResponse(res, 'Failed to fetch transactions', 500);
    }
};
