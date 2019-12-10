const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

let apiKey = "";
let range = "";
let spreadsheetId = "";
let connection = {};

const initializeConnection = () => {
  const googleConfigPath = path.join(__dirname, "/config/google.json");
  const googleConfigData = fs.readFileSync(googleConfigPath, {
    encoding: "utf8"
  });
  const googleConfigObject = JSON.parse(googleConfigData);
  apiKey = googleConfigObject.apiKey;
  range = googleConfigObject.range;
  spreadsheetId = googleConfigObject.spreadsheetId;
  return google.sheets({
    version: "v4",
    auth: apiKey
  });
};

const fetchRows = async (spreadsheetId, range, sheetsConnection) => {
  try {
    const response = await sheetsConnection.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    const rows = response.data.values;
    return rows;
  } catch (error) {
    console.error(error);
  }
};

connection = initializeConnection();

fetchRows(spreadsheetId, range, connection).then(rows => console.log(rows));
