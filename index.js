const Discord = require("discord.js");
const { google } = require("googleapis");

const { apiKey, spreadsheetId, range } = require("./config/google.json");
const connection = google.sheets({
  version: "v4",
  auth: apiKey
});

const { token, roles } = require("./config/discord.json");
const client = new Discord.Client();

let oldRows = [];

const logError = error => {
  console.error("error log " + new Date());
  console.error(error);
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
    logError(error);
  }
};

const assignRoles = async (usernames, roleNames) => {
  try {
    const guildMembers = client.guilds.array()[0].members.array();
    const guildRoles = client.guilds.array()[0].roles.array();
    // * getting Role instances of role names
    const Roles = guildRoles.filter(Role => roleNames.includes(Role.name));
    // * getting GuildMember instances of usernames and setting roles
    guildMembers.forEach(async member => {
      const username = member.user.username + "#" + member.user.discriminator;
      if (usernames.includes(username)) {
        const notAssignedRoles = [];
        Roles.forEach(role => {
          if (!member.roles.array().includes(role)) {
            notAssignedRoles.push(role);
          }
        });
        if (notAssignedRoles.length > 0) {
          await member.addRoles(Roles);
          console.log(
            "Assigned " +
              notAssignedRoles.map(role => role.name) +
              " to " +
              username
          );
        } else {
          console.log(username + " already has all the roles assigned");
        }
      }
    });
  } catch (err) {
    logError(err);
  }
};

const extractNewEntries = (oldRows, rows) => {
  let newRows = [];
  if (rows.length > oldRows.length) {
    newRows = rows.slice(oldRows.length);
  }
  newRows.forEach(row => {
    oldRows.push(row);
  });
  return newRows;
};

const extractDiscordIDs = rows => {
  return rows.map(user => user[0]);
};

client.once(
  "ready",
  () => {
    console.log("Bot started with these settings:");
    console.log("• Spreadsheet ID: " + spreadsheetId);
    console.log("• Range: " + range);
    console.log("• Roles: " + roles.join(", "));
    setInterval(async () => {
      console.log("\nChecked for new entries on " + new Date().toString());
      let rows;
      try {
        rows = await fetchRows(spreadsheetId, range, connection);

        const newEntries = extractNewEntries(oldRows, rows);
        if (newEntries.length > 0) {
          console.log(`Found ${newEntries.length} new entries`);
          const usernames = extractDiscordIDs(newEntries);
          assignRoles(usernames, roles);
        } else {
          console.log("No new entries");
        }
      } catch (err) {
        if (rows === undefined) console.error("Google Sheet is empty");
        logError(err);
        rows = [];
      }
    }, 60000); // refresh rate: 60000 milliseconds == 1 minute
  },
  logError
);

client.on("error", logError);

const start = async () => {
  try {
    await client.login(token);
  } catch (err) {
    logError(err);
    setTimeout(start, 30000);
  }
};

start();

client.on("disconnect", start);

module.exports = {
  fetchRows,
  assignRoles,
  extractNewEntries,
  extractDiscordIDs
};
