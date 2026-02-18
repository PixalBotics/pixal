/**
 * Seed MongoDB with sample data (User schema excluded)
 * Run: node scripts/seed.js   OR   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Team = require('../models/Team');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const Contact = require('../models/Contact');
const Blog = require('../models/Blog');

const teamData = [
  { name: 'Ali Hassan', role: 'CEO & Founder', bio: 'Leading Pixal Botics with vision and innovation.', photoUrl: '/uploads/team/ali.jpg' },
  { name: 'Sara Ahmed', role: 'CTO', bio: 'Tech lead with 10+ years in software development.', photoUrl: '/uploads/team/sara.jpg' },
  { name: 'Omar Khan', role: 'Lead Developer', bio: 'Full-stack developer specializing in IoT solutions.', photoUrl: '/uploads/team/omar.jpg' },
  { name: 'Fatima Noor', role: 'Design Lead', bio: 'UI/UX expert and product designer.', photoUrl: '/uploads/team/fatima.jpg' },
  { name: 'Zain Malik', role: 'Robotics Engineer', bio: 'Hardware and embedded systems expert for automation projects.' },
  { name: 'Ayesha Khan', role: 'Project Manager', bio: 'Ensuring delivery on time and client satisfaction across all projects.' },
];

const testimonialData = [
  { clientName: 'Tech Solutions Ltd', reviewText: 'Pixal Botics delivered an outstanding automation system. Highly recommended!', stars: 5 },
  { clientName: 'Innovate Corp', reviewText: 'Professional team and on-time delivery. Will work with them again.', stars: 5 },
  { clientName: 'Smart Industries', reviewText: 'Great support and quality work. Our productivity increased significantly.', stars: 4 },
  { clientName: 'Future Systems', reviewText: 'Best robotics and software integration we have worked with.', stars: 5 },
  { clientName: 'Digital Hub', reviewText: 'Reliable partner for all our automation needs.', stars: 4 },
];

const projectData = [
  {
    name: 'Warehouse Automation',
    description: 'Full warehouse automation with robotic pickers and inventory management system.',
    imageUrl: '/uploads/projects/warehouse.jpg',
    reviews: [
      { name: 'Client A', rating: 5, comment: 'Excellent implementation.' },
      { name: 'Client B', rating: 4, comment: 'Smooth rollout.' },
    ],
  },
  {
    name: 'Smart Manufacturing Line',
    description: 'IoT-based production line monitoring and control system.',
    imageUrl: '/uploads/projects/manufacturing.jpg',
    reviews: [
      { name: 'Manager', rating: 5, comment: 'Reduced downtime by 40%.' },
    ],
  },
  {
    name: 'Agricultural Drone System',
    description: 'Drone fleet for crop monitoring and spraying automation.',
    imageUrl: '/uploads/projects/drone.jpg',
    reviews: [],
  },
  {
    name: 'Retail Inventory Bot',
    description: 'Autonomous inventory counting and shelf monitoring robot.',
    imageUrl: '/uploads/projects/retail-bot.jpg',
    reviews: [
      { name: 'Store Manager', rating: 5, comment: 'Saves hours every week.' },
    ],
  },
];

const contactData = [
  { name: 'Ahmed Raza', email: 'ahmed@example.com', subject: 'Partnership Inquiry', message: 'We are interested in partnering for industrial automation. Please share your capabilities and pricing.', phone: '+92 300 1234567', status: 'new' },
  { name: 'Maria Khan', email: 'maria@company.com', subject: 'Quote Request', message: 'Need a quote for a small assembly line automation. Timeline is 3 months.', phone: '+92 321 9876543', status: 'read' },
  { name: 'Hassan Ali', email: 'hassan@startup.io', subject: 'Support', message: 'We have been using your system for 6 months. Need extended support contract details.', phone: '', status: 'replied', replied: true },
];

const blogData = [
  { name: 'Introduction to Industrial Robotics', content: 'A comprehensive guide to getting started with industrial robotics and automation...' },
  { name: 'IoT in Manufacturing', content: 'How IoT is transforming modern manufacturing and what to consider before adoption...' },
  { name: 'Pixal Botics Year in Review', content: 'Key projects and milestones from the past year...' },
  { name: 'Choosing the Right Automation Partner', content: 'Factors to consider when selecting an automation and robotics provider...' },
];

async function seed() {
  try {
    await connectDB();

    console.log('Clearing existing seed data (User excluded)...');
    await Team.deleteMany({});
    await Testimonial.deleteMany({});
    await Project.deleteMany({});
    await Contact.deleteMany({});
    await Blog.deleteMany({});

    console.log('Seeding Team...');
    await Team.insertMany(teamData);

    console.log('Seeding Testimonial...');
    await Testimonial.insertMany(testimonialData);

    console.log('Seeding Project...');
    await Project.insertMany(projectData);

    console.log('Seeding Contact...');
    await Contact.insertMany(contactData);

    console.log('Seeding Blog...');
    await Blog.insertMany(blogData);

    console.log('\n✅ Seed completed. Counts:');
    console.log('   Team:', await Team.countDocuments());
    console.log('   Testimonial:', await Testimonial.countDocuments());
    console.log('   Project:', await Project.countDocuments());
    console.log('   Contact:', await Contact.countDocuments());
    console.log('   Blog:', await Blog.countDocuments());
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
}

seed();
