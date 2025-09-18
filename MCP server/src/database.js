import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseManager {
  constructor() {
    this.client = null;
    this.database = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
      const dbName = process.env.DATABASE_NAME || 'task_management';
      
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.database = this.client.db(dbName);
      this.isConnected = true;
      
      console.log(`Connected to MongoDB database: ${dbName}`);
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.database) {
      throw new Error('Database not connected');
    }
    return this.database;
  }

  // User-related queries
  async getUsers(filter = {}, limit = 100) {
    const db = this.getDatabase();
    return await db.collection('User').find(filter, {
      projection: { hashed_password: 0 } // Exclude password
    }).limit(limit).toArray();
  }

  async getUserById(userId) {
    const db = this.getDatabase();
    const { ObjectId } = await import('mongodb');
    return await db.collection('User').findOne(
      { _id: new ObjectId(userId) },
      { projection: { hashed_password: 0 } }
    );
  }

  async getUserByUsername(username) {
    const db = this.getDatabase();
    return await db.collection('User').findOne(
      { username: username },
      { projection: { hashed_password: 0 } }
    );
  }

  // Task-related queries
  async getTasks(filter = {}, limit = 100) {
    const db = this.getDatabase();
    return await db.collection('Task').find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  async getTaskById(taskId) {
    const db = this.getDatabase();
    const { ObjectId } = await import('mongodb');
    return await db.collection('Task').findOne({ _id: new ObjectId(taskId) });
  }

  async getTasksByUser(userId) {
    const db = this.getDatabase();
    return await db.collection('Task').find({
      $or: [
        { created_by: userId },
        { assigned_to: { $in: [userId] } }
      ]
    }).sort({ created_at: -1 }).toArray();
  }

  async getTasksByStatus(status) {
    const db = this.getDatabase();
    return await db.collection('Task').find({ status: status })
      .sort({ created_at: -1 })
      .toArray();
  }

  async getTasksByPriority(priority) {
    const db = this.getDatabase();
    return await db.collection('Task').find({ priority: priority })
      .sort({ created_at: -1 })
      .toArray();
  }

  async searchTasks(searchTerm) {
    const db = this.getDatabase();
    return await db.collection('Task').find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    }).sort({ created_at: -1 }).toArray();
  }

  // Statistics and aggregations
  async getDatabaseStats() {
    const db = this.getDatabase();
    
    const userCount = await db.collection('User').countDocuments();
    const taskCount = await db.collection('Task').countDocuments();
    
    const tasksByStatus = await db.collection('Task').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    const tasksByPriority = await db.collection('Task').aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]).toArray();

    const recentTasks = await db.collection('Task').find()
      .sort({ created_at: -1 })
      .limit(5)
      .project({ title: 1, status: 1, created_at: 1 })
      .toArray();

    return {
      userCount,
      taskCount,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      tasksByPriority: tasksByPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentTasks
    };
  }

  async getUserTaskStats(userId) {
    const db = this.getDatabase();
    
    const createdTasks = await db.collection('Task').countDocuments({ created_by: userId });
    const assignedTasks = await db.collection('Task').countDocuments({ assigned_to: { $in: [userId] } });
    
    const statusBreakdown = await db.collection('Task').aggregate([
      { 
        $match: { 
          $or: [
            { created_by: userId },
            { assigned_to: { $in: [userId] } }
          ]
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    return {
      createdTasks,
      assignedTasks,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

export default new DatabaseManager();