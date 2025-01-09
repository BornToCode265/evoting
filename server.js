const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const electionRoutes = require("./routes/electionRoutes");
const electionCommisionRouter = require("./routes/electionCommisionRouter");

const app = express();
app.use(bodyParser.json());

app.use("/api/users", userRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/election-commision", electionCommisionRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
