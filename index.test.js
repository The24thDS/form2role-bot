const { fetchRows, extractDiscordIDs } = require("./index");

it("is returning rows", async () => {
  const mockSheetsConnection = {
    spreadsheets: {
      values: {
        get: (obj) =>
          Promise.resolve({
            data: { values: [["SomeUsername#6444"], ["AnotherUsername#3336"]] },
          }),
      },
    },
  };
  expect.assertions(1);
  expect(
    await fetchRows("ghdsj6Ghsakdf", "B2:B", mockSheetsConnection)
  ).toEqual([["SomeUsername#6444"], ["AnotherUsername#3336"]]);
});

it("is extracting usernames from rows", () => {
  expect(
    extractDiscordIDs([["SomeUsername#6444"], ["AnotherUsername#3336"]])
  ).toEqual(["SomeUsername#6444", "AnotherUsername#3336"]);
});
