import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Subscription name is required"],
    trim: true,
    minLength: [2, "Subscription name must be at least 2 characters long"],
    maxLength: [100, "Subscription name must be at most 100 characters long"]

  },
  price: {
    type: Number,
    required: [true, "Subscription price is required"],
    min: [0, "Subscription price must be a positive number"]

  },
  currency: {
    type: String,
    enum: ["USD", "EUR", "GBP", "KE"],
    default: "USD",
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly", "yearly"],
    default: "monthly"
  },
  category: {
    type: String,
    enum: ['sports', 'news', 'entertainment', 'lifestyle', 'technology', 'finance', 'politics', 'other'],
    required: true
  },
  paymentMethod: {
    type: String,
    required: [true, "Payment method is required"],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
    validate: {
      validator: (value) => value <= new Date(),
      message: "Start date must be in the past"
    }
  },

  renewalDate: {
    type: Date,
    validate: {
      validator: (value) => value > new Date(),
      message: "Renewal date must be in the future"
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
    index: true
  }

}, { timestamps: true })

// add helper (same logic as controller; keep one copy if you prefer importing it)
function computeRenewalDate(startDate, frequency) {
  const d = startDate ? new Date(startDate) : new Date();
  const freq = String(frequency || "monthly").trim().toLowerCase();
  switch (freq) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": {
      const day = d.getDate();
      d.setMonth(d.getMonth() + 1);
      if (d.getDate() < day) d.setDate(0);
      break;
    }
    case "quarterly": {
      const day = d.getDate();
      d.setMonth(d.getMonth() + 3);
      if (d.getDate() < day) d.setDate(0);
      break;
    }
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1); break;
  }
  return d;
}

// pre-save: set renewalDate if missing or startDate/frequency changed
subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate || this.isModified("startDate") || this.isModified("frequency")) {
    this.renewalDate = computeRenewalDate(this.startDate || new Date(), this.frequency);
  }
});

// pre findOneAndUpdate: recalc when update contains startDate or frequency
subscriptionSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  const start = update.startDate || (update.$set && update.$set.startDate);
  const freq = update.frequency || (update.$set && update.$set.frequency);

  if (start || freq) {
    // get the values to compute renewalDate (fall back to existing doc values if needed)
    const now = new Date();
    const startToUse = start ? new Date(start) : now;
    const freqToUse = freq || (update.$set && update.$set.frequency);
    const renewal = computeRenewalDate(startToUse, freqToUse || "monthly");
    // ensure update sets renewalDate
    if (update.$set) update.$set.renewalDate = renewal;
    else update.renewalDate = renewal;
    this.setUpdate(update);
  }
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;