require("dotenv").config();
const app = require("./app");

require("./services/esp32Client");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});