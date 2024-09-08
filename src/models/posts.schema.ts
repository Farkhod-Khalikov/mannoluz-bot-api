import mongoose, { Document, Schema } from "mongoose";

// Interface for the Post document
export interface IPost extends Document {
  creator: string;
  title: string;
  createdAt: Date; //update using mongo's timestamps
  imagePath?: string;
}
// Schema for the Post model
const PostSchema: Schema = new Schema({
  creator: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  imagepath: { type: String, required: false },
});

const Post = mongoose.model<IPost>("Post", PostSchema);
export default Post;
