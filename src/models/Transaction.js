import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema(
  {
    debtorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debtor', required: true },
    type: { type: String, enum: ['deposit', 'payment'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, required: false, default: '', trim: true },
    createdBy: { type: String, enum: ['admin', 'debtor'], required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
)

TransactionSchema.index({ debtorId: 1, status: 1 })
TransactionSchema.index({ debtorId: 1, type: 1 })
TransactionSchema.index({ debtorId: 1, createdAt: -1 })

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
