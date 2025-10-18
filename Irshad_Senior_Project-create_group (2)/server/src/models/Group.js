import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const GroupSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    groupName: { type: String, required: true, trim: true },
    numOfMembers: { type: Number, default: 0 },
    ObjectDepartmentID: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    AdminObjectUserID: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    SupervisorObjectUserID: { type: Schema.Types.ObjectId, ref: "Supervisor", required: true },
  },
  { collection: "Group", timestamps: true }
);

const Group = models.Group || model("Group", GroupSchema);
export default Group;