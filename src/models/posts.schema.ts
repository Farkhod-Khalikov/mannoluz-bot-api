import mongoose, { Document, Schema } from "mongoose";

// Interface for the Post document
export interface IPost extends Document {
  adminName: string;
  title: string;
  createdAt: Date; //update using mongo's timestamps
  imagePath: string;
}
// короче вот это все нахуй удалить можно в тз нету этой темы
// Schema for the Post model
const PostSchema: Schema = new Schema({
  adminName: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  imagePath: { type: String, required: true },
});

const Post = mongoose.model<IPost>("Post", PostSchema);
export default Post;
