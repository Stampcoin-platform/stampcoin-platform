const fs = require("fs");
test("package.json exists in todo-app", () => {
  const exists = fs.existsSync("todo-app/package.json");
  expect(exists).toBe(true);
});