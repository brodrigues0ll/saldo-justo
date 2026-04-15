import mongoose from 'mongoose'

const PushSubscriptionSchema = new mongoose.Schema(
  {
    debtorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debtor', default: null },
    role: { type: String, enum: ['admin', 'debtor'], required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
)

PushSubscriptionSchema.index({ debtorId: 1 })
PushSubscriptionSchema.index({ role: 1 })

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema)
