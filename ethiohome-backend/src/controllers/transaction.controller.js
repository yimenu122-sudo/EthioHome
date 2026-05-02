const { Transaction, Property, Booking, Payment, Commission, PropertyImage } = require('../models/associations');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @file transaction.controller.js
 * @description Handles property sale/rent transactions and commission calculations
 */

exports.createTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { property_id, booking_id, agreed_price, transaction_type } = req.body;

        // 1. Validate property
        const property = await Property.findByPk(property_id);
        if (!property) return errorResponse(res, 'Property not found', 404);
        if (property.availability_status !== 'Available') {
            return errorResponse(res, 'Property is no longer available', 400);
        }

        // 2. Validate booking
        const booking = await Booking.findByPk(booking_id);
        if (!booking) return errorResponse(res, 'Booking not found', 404);
        if (booking.booking_status !== 'Approved') {
            return errorResponse(res, 'Booking must be approved before transaction', 400);
        }

        // 3. Create Transaction
        const transaction = await Transaction.create({
            property_id,
            booking_id,
            owner_id: property.owner_id,
            agent_id: property.agent_id,
            transaction_type: transaction_type || property.listing_type,
            agreed_price,
            contract_date: new Date(),
            transaction_status: 'Completed'
        }, { transaction: t });

        // 4. Update Property Status
        await property.update({ 
            availability_status: transaction_type === 'Sale' ? 'Sold' : 'Rented' 
        }, { transaction: t });

        // 5. Calculate Commission (Sale: 2% from BOTH, Rent: 9% from BOTH)
        const settings = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
        const rates = settings ? settings.value : { sale: 2, rent: 9 };
        
        const rate = transaction_type === 'Sale' ? rates.sale : rates.rent;
        const perPartyCommission = agreed_price * (rate / 100);
        const totalCommissionEarned = perPartyCommission * 2; // Both pay

        // 6. Record Payment (The commission or full price? Schema shows payment linked to transaction)
        // Usually, the portal tracks the commission payment.
        await Payment.create({
            transaction_id: transaction.transaction_id,
            amount: commissionAmount,
            payment_method: 'Bank',
            payment_status: 'Pending',
            payment_date: new Date()
        }, { transaction: t });

        // 7. Record Commission record for Agent for the TOTAL amount earned from both sides
        if (property.agent_id) {
            await Commission.create({
                transaction_id: transaction.transaction_id,
                booking_id: booking.booking_id,
                owner_id: property.owner_id,
                agent_id: property.agent_id,
                amount: totalCommissionEarned,
                commission_status: 'Pending'
            }, { transaction: t });
        }

        await t.commit();
        return successResponse(res, transaction, 'Transaction completed successfully', 201);

    } catch (error) {
        await t.rollback();
        console.error('Transaction Error:', error);
        return errorResponse(res, 'Transaction failed', 500, error.message);
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
                attributes: ['title', 'city', 'price'],
                include: [{ model: PropertyImage, as: 'images', limit: 1 }]
            }
        ];

        let where = {};
        if (role === 'Owner') {
            where.owner_id = userId;
        } else if (role === 'Agent') {
            where.agent_id = userId;
        } else {
            // Buyer/Renter: Join via Booking
            include.push({
                model: Booking,
                where: { buyer_renter_id: userId },
                required: true,
                attributes: []
            });
        }
        
        const transactions = await Transaction.findAll({
            where,
            include,
            order: [['created_at', 'DESC']]
        });

        return successResponse(res, transactions, 'Transactions fetched successfully');
    } catch (error) {
        console.error('Get My Transactions Error:', error);
        return errorResponse(res, 'Failed to fetch transactions', 500);
    }
};
