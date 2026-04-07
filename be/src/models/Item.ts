import mongoose, { type InferSchemaType } from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export type Item = InferSchemaType<typeof itemSchema>;

export const ItemModel = mongoose.models.Item ?? mongoose.model("Item", itemSchema);
