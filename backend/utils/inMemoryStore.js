const { randomUUID } = require("crypto");

// This storage is intentionally temporary. All data is lost when the server restarts.
const users = [];
const memories = [];

const createUser = ({ name, email, password }) => {
  const user = { id: randomUUID(), name, email, password, createdAt: new Date() };
  users.push(user);
  return user;
};

const findUserByEmail = (email) => users.find((user) => user.email === email);
const findUserById = (id) => users.find((user) => user.id === id);

const createMemory = ({ userId, text, category, imageUrl, cloudinaryId }) => {
  const memory = {
    id: randomUUID(),
    userId,
    text,
    category,
    imageUrl,
    cloudinaryId,
    createdAt: new Date(),
  };
  memories.push(memory);
  return memory;
};

const getUserMemories = (userId) => memories.filter((memory) => memory.userId === userId);
const findMemoryById = (id) => memories.find((memory) => memory.id === id);

const removeMemory = (id) => {
  const index = memories.findIndex((memory) => memory.id === id);
  if (index !== -1) memories.splice(index, 1);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  createMemory,
  getUserMemories,
  findMemoryById,
  removeMemory,
};
