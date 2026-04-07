import mongoose, { type InferSchemaType } from "mongoose";

export const APPLICATION_STATUSES = [
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    jdLink: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    dateApplied: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: APPLICATION_STATUSES,
      index: true,
    },
    salaryRange: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export type Application = InferSchemaType<typeof applicationSchema>;

export const ApplicationModel =
  mongoose.models.Application ?? mongoose.model("Application", applicationSchema);
