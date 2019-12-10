const { google } = require("googleapis");

const { apiKey, spreadsheetId, range } = require("./config/google.json");

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

connection = google.sheets({
  version: "v4",
  auth: apiKey
});

fetchRows(spreadsheetId, range, connection).then(rows => console.log(rows));
