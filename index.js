const Discord = require('discord.js');
const { google } = require('googleapis');

const { apiKey, spreadsheetId, range, rate } = require('./config/google.json');
const connection = google.sheets({
  version: 'v4',
  auth: apiKey,
});

const { token, roles } = require('./config/discord.json');
const client = new Discord.Client({
  fetchAllMembers: true,
});

let oldRows = [];
let guild = null;

const logError = (error) => {
  console.error('error log ' + new Date());
  console.error(error);
};

const fetchRows = async (spreadsheetId, range, sheetsConnection) => {
  try {
    const response = await sheetsConnection.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    const rows = response.data.values;
    return rows;
  } catch (error) {
    logError(error);
  }
};

const assignRoles = async (usernames, roleNames) => {
  try {
    await guild.members.fetch();
    await guild.roles.fetch();
    const roles = guild.roles.cache.filter((role) =>
      roleNames.includes(role.name)
    );
    const members = guild.members.cache.filter(
      ({ user: { username, discriminator } }) =>
        usernames.includes(`${username}#${discriminator}`)
    );
    members.each(async (member) => {
      const notAssignedRoles = [];
      roles.each((role) => {
        if (!member.roles.cache.has(role)) {
          notAssignedRoles.push(role.name);
        }
      });
      if (notAssignedRoles.length > 0) {
        await member.roles.add(roles);
        console.log(
          `Assigned ${notAssignedRoles.join(', ')} to ${member.user.username}#${
            member.user.discriminator
          }`
        );
      } else {
        console.log(
          `${member.user.username}#${member.user.discriminator} already has all the roles assigned`
        );
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
  newRows.forEach((row) => {
    oldRows.push(row);
  });
  return newRows;
};

const extractDiscordIDs = (rows) => {
  return rows.map((user) => user[0]);
};

client.once(
  'ready',
  () => {
    console.log('Bot started with these settings:');
    console.log(`• Spreadsheet ID: ${spreadsheetId}`);
    console.log(`• Range: ${range}`);
    console.log(`• Rate: ${rate} seconds`);
    console.log(`• Roles: ${roles.join(', ')}`);
    console.log(
      `• Server: ${
        guild ? guild.name : "Error! Bot isn't a member of any server!"
      }`
    );
    setInterval(async () => {
      console.log('\nChecked for new entries on ' + new Date().toString());
      let rows;
      try {
        rows = await fetchRows(spreadsheetId, range, connection);

        const newEntries = extractNewEntries(oldRows, rows);
        if (newEntries.length > 0) {
          console.log(`Found ${newEntries.length} new entries`);
          const usernames = extractDiscordIDs(newEntries);
          assignRoles(usernames, roles);
        } else {
          console.log('No new entries');
        }
      } catch (err) {
        if (rows === undefined) console.error('Google Sheet is empty');
        logError(err);
        rows = [];
      }
    }, rate * 1000); // refresh rate: 1000 milliseconds == 1 second
  },
  logError
);

client.on('error', logError);

const start = async () => {
  try {
    await client.login(token);
    guild = client.guilds.cache.first();
    if (!guild) {
      throw new Error("Error! Bot isn't a member of any server!");
    }
  } catch (err) {
    logError(err);
    setTimeout(start, 30000);
  }
};

start();

client.on('disconnect', start);

module.exports = {
  fetchRows,
  assignRoles,
  extractNewEntries,
  extractDiscordIDs,
};
