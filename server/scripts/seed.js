import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';
import { Board } from '../src/models/Board.js';
import { BoardMember } from '../src/models/BoardMember.js';
import { List } from '../src/models/List.js';
import { Card } from '../src/models/Card.js';
import { Comment } from '../src/models/Comment.js';
import { Activity } from '../src/models/Activity.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'alice@example.com' });
  if (existing) {
    console.log('Seed data already exists (alice@example.com). Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('password123', 12);
  const alice = await User.create({
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    passwordHash,
  });
  const bob = await User.create({
    fullName: 'Bob Jones',
    email: 'bob@example.com',
    passwordHash,
  });

  const board1 = await Board.create({
    title: 'Product Roadmap',
    description: 'Q1 priorities and features',
    backgroundColor: '#0f766e',
    visibility: 'private',
    ownerId: alice._id,
  });
  await BoardMember.create({
    boardId: board1._id,
    userId: alice._id,
    role: 'owner',
    starred: true,
  });
  await BoardMember.create({
    boardId: board1._id,
    userId: bob._id,
    role: 'member',
  });
  await Activity.create({
    boardId: board1._id,
    type: 'board_created',
    userId: alice._id,
    metadata: { title: board1.title },
  });

  const list1 = await List.create({ boardId: board1._id, title: 'To Do', order: 0 });
  const list2 = await List.create({ boardId: board1._id, title: 'In Progress', order: 1 });
  const list3 = await List.create({ boardId: board1._id, title: 'Done', order: 2 });
  await Activity.create({
    boardId: board1._id,
    type: 'list_created',
    userId: alice._id,
    listId: list1._id,
    metadata: { title: list1.title },
  });

  const card1 = await Card.create({
    listId: list1._id,
    boardId: board1._id,
    title: 'User authentication',
    description: 'Implement login and signup flows',
    order: 0,
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    assignedMemberIds: [alice._id],
    labels: ['backend', 'security'],
    checklist: [{ text: 'Design API', done: true }, { text: 'Add tests', done: false }],
  });
  const card2 = await Card.create({
    listId: list1._id,
    boardId: board1._id,
    title: 'Dashboard UI',
    description: 'Build main dashboard with board list',
    order: 1,
    priority: 'medium',
    assignedMemberIds: [bob._id],
    labels: ['frontend'],
  });
  const card3 = await Card.create({
    listId: list2._id,
    boardId: board1._id,
    title: 'API documentation',
    description: 'OpenAPI spec and examples',
    order: 0,
    priority: 'low',
  });
  await Activity.create({
    boardId: board1._id,
    type: 'card_created',
    userId: alice._id,
    cardId: card1._id,
    listId: list1._id,
    metadata: { title: card1.title },
  });

  await Comment.create({
    cardId: card1._id,
    userId: alice._id,
    text: 'Let\'s use JWT for tokens.',
  });
  await Activity.create({
    boardId: board1._id,
    type: 'commented',
    userId: alice._id,
    cardId: card1._id,
    metadata: { textPreview: 'Let\'s use JWT for tokens.' },
  });

  const board2 = await Board.create({
    title: 'Marketing',
    description: 'Campaigns and content',
    backgroundColor: '#0369a1',
    visibility: 'private',
    ownerId: bob._id,
  });
  await BoardMember.create({
    boardId: board2._id,
    userId: bob._id,
    role: 'owner',
  });
  await Activity.create({
    boardId: board2._id,
    type: 'board_created',
    userId: bob._id,
    metadata: { title: board2.title },
  });
  const listB1 = await List.create({ boardId: board2._id, title: 'Ideas', order: 0 });
  await Card.create({
    listId: listB1._id,
    boardId: board2._id,
    title: 'Blog post: Getting started',
    order: 0,
    priority: 'medium',
  });

  console.log('Seed complete.');
  console.log('Users: alice@example.com, bob@example.com (password: password123)');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
