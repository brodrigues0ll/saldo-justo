import mongoose from 'mongoose'
import Transaction from '@/models/Transaction'

/**
 * Calcula os totais financeiros de um devedor via aggregation MongoDB.
 * Pagamentos pending NÃO entram no saldo — apenas approved.
 */
export async function getDebtorTotals(debtorId) {
  const result = await Transaction.aggregate([
    { $match: { debtorId: new mongoose.Types.ObjectId(debtorId) } },
    {
      $group: {
        _id: null,
        totalDeposits: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'deposit'] }, { $eq: ['$status', 'approved'] }] },
              '$amount',
              0,
            ],
          },
        },
        totalPaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'approved'] }] },
              '$amount',
              0,
            ],
          },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0],
          },
        },
      },
    },
  ])

  const totals = result[0] || { totalDeposits: 0, totalPaid: 0, pendingCount: 0, pendingAmount: 0 }
  return {
    ...totals,
    balance: totals.totalDeposits - totals.totalPaid,
  }
}
