require("dotenv").config();
const express = require("express");
const auth = require("./middleware/auth");
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const productRouter = require("./routes/productRouter");

const app = express();
app.use(express.json());

const { default: mongoose } = require("mongoose");
const cors = require("cors");

const PORT = process.env.PORT || 3500;

mongoose.connect(
  "mongodb+srv://sugam:sugam123@cluster0.ijqzvbj.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewURLParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.connection
  .once("open", () => console.log("Connected to database..."))
  .on("error", (error) =>
    console.log("Error connecting to database...", error)
  );

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => res.json("Server is running..."));

app.use("/api/auth", authRouter);
app.use("/api/user", auth, userRouter);
app.use("/api/product", auth, productRouter);

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
