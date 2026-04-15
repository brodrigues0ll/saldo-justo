import mongoose from 'mongoose'

const DebtorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canCreatePayment: { type: Boolean, default: false },
    displayMode: {
      type: String,
      enum: ['deposit', 'debt'],
      default: 'deposit',
    },
  },
  { timestamps: true }
)

DebtorSchema.index({ createdBy: 1 })

export default mongoose.models.Debtor || mongoose.model('Debtor', DebtorSchema)
