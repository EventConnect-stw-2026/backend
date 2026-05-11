const axios = require("axios");

async function testImport() {
  const res = await axios.post(`${process.env.SERVER_URL}/api/zaragoza/import`);
  console.log(res.data);
}
testImport();