const { Schema, model } = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['in_progress', 'completed'];

const taskSchema = new Schema(
  {
    title: { type: String, required: [true, 'title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    // Start date & time of the task (the "Start" time + "Set Date" in the UI)
    dueAt: { type: Date, required: [true, 'dueAt is required'] },
    // Optional end time (the "Ends" field in the UI)
    endAt: { type: Date, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'in_progress' },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

taskSchema.index({ dueAt: 1 });
taskSchema.index({ status: 1, dueAt: 1 });

// endAt must come after dueAt (checked on every save, including edits)
taskSchema.pre('validate', function () {
  if (this.endAt && this.dueAt && this.endAt <= this.dueAt) {
    this.invalidate('endAt', 'endAt must be after dueAt');
  }
});

// Keep completedAt in sync with status
taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : null;
  }
});

module.exports = { Task: model('Task', taskSchema), PRIORITIES, STATUSES };
