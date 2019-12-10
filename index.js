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

const assignRoles = async (usernames, roleNames) => {
  const guildMembers = client.guilds.array()[0].members.array();
  const guildRoles = client.guilds.array()[0].roles.array();
  // * getting Role instances of role names
  const Roles = guildRoles.filter(Role => roleNames.includes(Role.name));
  // * getting GuildMember instances of usernames and setting roles
  guildMembers.forEach(async member => {
    const username = member.user.username + "#" + member.user.discriminator;
    if (usernames.includes(username)) {
      try {
        await member.addRoles(Roles);
      } catch (err) {
        console.error(err);
      }
    }
  });
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

client.once("ready", () => {
  setInterval(async () => {
    const rows = await fetchRows(spreadsheetId, range, connection);
    const newEntries = extractNewEntries(oldRows, rows);
    if (newEntries.length > 0) {
      const usernames = extractDiscordIDs(newEntries);
      assignRoles(usernames, roles);
    } else {
      console.log("No new entries");
    }
  }, 60000);
});

client.login(token);

module.exports = {
  fetchRows,
  assignRoles,
  extractNewEntries,
  extractDiscordIDs
};
